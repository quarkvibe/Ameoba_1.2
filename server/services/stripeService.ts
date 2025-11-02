import Stripe from 'stripe';
import { storage } from '../storage';
import { licenseService } from './licenseService';

/**
 * Stripe Service for payment processing
 * Handles both one-time payments ($3.50 license) and recurring subscriptions (managed hosting)
 */

// Initialize Stripe with API key (will be set via environment variable)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-09-30.clover',
});

export interface CreateCheckoutSessionParams {
  userId: string;
  email: string;
  type: 'license' | 'subscription';
  priceId?: string; // For subscriptions (managed hosting)
  successUrl: string;
  cancelUrl: string;
}

export interface WebhookEventData {
  type: string;
  data: {
    object: any;
  };
}

export class StripeService {
  
  /**
   * Create Stripe checkout session for license purchase ($3.50 one-time)
   */
  async createLicenseCheckoutSession(params: CreateCheckoutSessionParams): Promise<string> {
    try {
      const { userId, email, successUrl, cancelUrl } = params;

      // Get or create Stripe customer
      const customer = await this.getOrCreateCustomer(userId, email);

      // Create checkout session for one-time $3.50 payment
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price: process.env.STRIPE_PRICE_LICENSE || 'price_placeholder_350',
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          type: 'license',
        },
      });

      return session.url || '';
    } catch (error) {
      console.error('Error creating license checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Create Stripe checkout session for managed hosting subscription
   */
  async createSubscriptionCheckoutSession(params: CreateCheckoutSessionParams): Promise<string> {
    try {
      const { userId, email, priceId, successUrl, cancelUrl } = params;

      if (!priceId) {
        throw new Error('Price ID required for subscription');
      }

      // Get or create Stripe customer
      const customer = await this.getOrCreateCustomer(userId, email);

      // Create checkout session for recurring subscription
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          type: 'subscription',
        },
      });

      return session.url || '';
    } catch (error) {
      console.error('Error creating subscription checkout session:', error);
      throw new Error('Failed to create subscription session');
    }
  }

  /**
   * Get or create Stripe customer for user
   */
  private async getOrCreateCustomer(userId: string, email: string): Promise<Stripe.Customer> {
    try {
      // Check if customer already exists in our database
      const existingCustomer = await storage.getStripeCustomer(userId);
      
      if (existingCustomer) {
        // Retrieve from Stripe
        const customer = await stripe.customers.retrieve(existingCustomer.stripeCustomerId);
        if (!customer.deleted) {
          return customer as Stripe.Customer;
        }
      }

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId,
        },
      });

      // Store in our database
      await storage.createStripeCustomer({
        userId,
        stripeCustomerId: customer.id,
        email,
      });

      return customer;
    } catch (error) {
      console.error('Error getting/creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: WebhookEventData): Promise<void> {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;

        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  /**
   * Handle successful checkout session
   */
  private async handleCheckoutSessionCompleted(session: any): Promise<void> {
    const userId = session.metadata?.userId;
    const type = session.metadata?.type;

    if (!userId) {
      console.error('No userId in session metadata');
      return;
    }

    if (type === 'license') {
      // Generate and store license key
      const licenseKey = await licenseService.generateLicense(userId, session.payment_intent);
      console.log(`License key generated for user ${userId}: ${licenseKey}`);
    } else if (type === 'subscription') {
      // Subscription will be handled by customer.subscription.created event
      console.log(`Subscription checkout completed for user ${userId}`);
    }
  }

  /**
   * Handle successful payment intent
   */
  private async handlePaymentSucceeded(paymentIntent: any): Promise<void> {
    const amount = paymentIntent.amount;
    const userId = paymentIntent.metadata?.userId;

    if (!userId) {
      console.error('No userId in payment intent metadata');
      return;
    }

    // Store payment record
    await storage.createPayment({
      userId,
      stripePaymentIntentId: paymentIntent.id,
      amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      description: `Payment for ${paymentIntent.description || 'Amoeba license'}`,
      receiptUrl: paymentIntent.charges?.data[0]?.receipt_url,
    });
  }

  /**
   * Handle subscription creation/update
   */
  private async handleSubscriptionUpdated(subscription: any): Promise<void> {
    const customerId = subscription.customer;
    
    // Get user from customer ID
    const customer = await storage.getStripeCustomerByStripeId(customerId);
    if (!customer) {
      console.error(`No customer found for Stripe ID: ${customerId}`);
      return;
    }

    // Determine tier from price ID
    const priceId = subscription.items.data[0]?.price.id;
    const tier = this.getTierFromPriceId(priceId);

    // Create or update subscription in database
    await storage.upsertSubscription({
      userId: customer.userId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      tier,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    console.log(`Subscription updated for user ${customer.userId}: ${tier} (${subscription.status})`);
  }

  /**
   * Handle subscription deletion/cancellation
   */
  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const customerId = subscription.customer;
    
    const customer = await storage.getStripeCustomerByStripeId(customerId);
    if (!customer) {
      console.error(`No customer found for Stripe ID: ${customerId}`);
      return;
    }

    // Mark subscription as canceled
    await storage.updateSubscriptionStatus(subscription.id, 'canceled');

    // Optionally: Mark managed instances as stopped/scheduled for deletion
    console.log(`Subscription canceled for user ${customer.userId}`);
  }

  /**
   * Handle successful invoice payment (for recurring subscriptions)
   */
  private async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    console.log(`Invoice paid: ${invoice.id} for subscription ${invoice.subscription}`);
    
    // Store payment record
    const customerId = invoice.customer;
    const customer = await storage.getStripeCustomerByStripeId(customerId);
    
    if (customer) {
      await storage.createPayment({
        userId: customer.userId,
        stripePaymentIntentId: invoice.payment_intent,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        description: `Subscription payment`,
        receiptUrl: invoice.hosted_invoice_url,
      });
    }
  }

  /**
   * Handle failed invoice payment
   */
  private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    console.error(`Invoice payment failed: ${invoice.id} for subscription ${invoice.subscription}`);
    
    // Optionally: Send email notification to user
    // Optionally: Pause managed instances after grace period
  }

  /**
   * Create customer portal session (for managing subscriptions)
   */
  async createCustomerPortalSession(userId: string, returnUrl: string): Promise<string> {
    try {
      const customer = await storage.getStripeCustomer(userId);
      
      if (!customer) {
        throw new Error('No Stripe customer found for user');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: customer.stripeCustomerId,
        return_url: returnUrl,
      });

      return session.url;
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      throw error;
    }
  }

  /**
   * Get subscription details for user
   */
  async getUserSubscription(userId: string): Promise<any> {
    try {
      const subscription = await storage.getUserSubscription(userId);
      return subscription;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return null;
    }
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(userId: string): Promise<void> {
    try {
      const subscription = await storage.getUserSubscription(userId);
      
      if (!subscription || !subscription.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      await storage.updateSubscriptionCancelAtPeriodEnd(subscription.id, true);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Map Stripe price ID to tier name
   */
  private getTierFromPriceId(priceId: string): string {
    const priceMap: Record<string, string> = {
      [process.env.STRIPE_PRICE_LITE || '']: 'lite',
      [process.env.STRIPE_PRICE_STANDARD || '']: 'standard',
      [process.env.STRIPE_PRICE_PRO || '']: 'pro',
      [process.env.STRIPE_PRICE_BUSINESS || '']: 'business',
    };

    return priceMap[priceId] || 'standard';
  }

  /**
   * Get pricing plans (for display on pricing page)
   */
  getPricingPlans() {
    return [
      {
        id: 'license',
        name: 'Self-Hosted',
        price: 3.50,
        interval: 'one-time',
        priceId: process.env.STRIPE_PRICE_LICENSE,
        features: [
          'Lifetime license per device',
          'Self-deactivation enabled',
          'All features included',
          'Ollama local models',
          'BYOK (OpenAI, Anthropic, Cohere)',
          'Community support',
        ],
      },
      {
        id: 'lite',
        name: 'Managed Lite',
        price: 15,
        interval: 'month',
        priceId: process.env.STRIPE_PRICE_LITE,
        droplet: '1GB RAM, 1 vCPU',
        features: [
          'One-click deployment',
          'Automatic updates',
          'SSL certificates',
          'Database backups',
          'Email support',
          'Best for Ollama local models',
        ],
      },
      {
        id: 'standard',
        name: 'Managed Standard',
        price: 29,
        interval: 'month',
        priceId: process.env.STRIPE_PRICE_STANDARD,
        droplet: '2GB RAM, 2 vCPU',
        features: [
          'Everything in Lite',
          'Better performance',
          'Multiple templates',
          'Scheduled jobs',
          'Priority support',
        ],
        popular: true,
      },
      {
        id: 'pro',
        name: 'Managed Pro',
        price: 49,
        interval: 'month',
        priceId: process.env.STRIPE_PRICE_PRO,
        droplet: '4GB RAM, 2 vCPU',
        features: [
          'Everything in Standard',
          'High-volume generation',
          'Advanced scheduling',
          'Premium support',
          'Custom integrations',
        ],
      },
      {
        id: 'business',
        name: 'Managed Business',
        price: 99,
        interval: 'month',
        priceId: process.env.STRIPE_PRICE_BUSINESS,
        droplet: '8GB RAM, 4 vCPU',
        features: [
          'Everything in Pro',
          'Maximum performance',
          'White-label option',
          'SLA guarantee',
          'Dedicated support',
          'Custom features',
        ],
      },
    ];
  }
}

export const stripeService = new StripeService();

