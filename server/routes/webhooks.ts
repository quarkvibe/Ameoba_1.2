import { Router } from 'express';
import { stripeService } from '../services/stripeService';

/**
 * WEBHOOK ROUTES (External Event Receivers)
 * Handles incoming webhooks from external services
 * Note: These are NOT authenticated by our system (verified by service signature)
 */

export function registerWebhookRoutes(router: Router) {
  
  // Stripe webhook handler
  router.post('/webhooks/stripe', async (req, res) => {
    try {
      // Note: In production, verify webhook signature with Stripe SDK
      // For now, assume event is valid (placeholder implementation)
      const event = req.body;
      
      await stripeService.handleWebhook(event);
      
      res.json({ received: true });
    } catch (error: any) {
      console.error('Error processing Stripe webhook:', error);
      res.status(400).json({ message: `Webhook Error: ${error.message}` });
    }
  });
}



