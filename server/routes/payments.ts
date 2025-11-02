import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { strictRateLimit, standardRateLimit } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validation';
import { createCheckoutSchema, createSubscriptionCheckoutSchema } from '../validation/monetization';
import { stripeService } from '../services/stripeService';
import { storage } from '../storage';

/**
 * PAYMENT ROUTES (Stripe Integration)
 * Handles checkout sessions and payment history
 */

export function registerPaymentRoutes(router: Router) {
  
  // Create Stripe checkout session for $3.50 license
  router.post('/payments/checkout/license', 
    isAuthenticated, 
    strictRateLimit,
    validateBody(createCheckoutSchema),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { successUrl, cancelUrl, email } = req.body;

        const checkoutUrl = await stripeService.createLicenseCheckoutSession({
          userId,
          email: email || req.user.claims.email || 'no-email@example.com',
          type: 'license',
          successUrl,
          cancelUrl,
        });

        res.json({ 
          success: true,
          url: checkoutUrl,
        });
      } catch (error: any) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ message: error.message || 'Failed to create checkout session' });
      }
    }
  );

  // Create Stripe checkout session for managed hosting subscription
  router.post('/payments/checkout/subscription', 
    isAuthenticated, 
    strictRateLimit,
    validateBody(createSubscriptionCheckoutSchema),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { priceId, successUrl, cancelUrl, email } = req.body;

        const checkoutUrl = await stripeService.createSubscriptionCheckoutSession({
          userId,
          email: email || req.user.claims.email || 'no-email@example.com',
          type: 'subscription',
          priceId,
          successUrl,
          cancelUrl,
        });

        res.json({ 
          success: true,
          url: checkoutUrl,
        });
      } catch (error: any) {
        console.error('Error creating subscription checkout:', error);
        res.status(500).json({ message: error.message || 'Failed to create subscription checkout' });
      }
    }
  );

  // Get user's payment history
  router.get('/payments', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const payments = await storage.getUserPayments(userId);
        res.json(payments);
      } catch (error: any) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ message: 'Failed to fetch payment history' });
      }
    }
  );
}



