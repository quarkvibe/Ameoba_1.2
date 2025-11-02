import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { standardRateLimit, strictRateLimit } from '../middleware/rateLimiter';
import { storage } from '../storage';

/**
 * SUBSCRIPTION ROUTES (Managed Hosting)
 * Handles recurring subscription lifecycle for managed DO droplets
 */

export function registerSubscriptionRoutes(router: Router) {
  
  // Get current user subscription
  router.get('/subscriptions/current', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const subscription = await storage.getUserSubscription(userId);
        
        if (!subscription) {
          return res.json({ subscription: null });
        }
        
        res.json({ subscription });
      } catch (error: any) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({ message: 'Failed to fetch subscription' });
      }
    }
  );

  // Cancel subscription (cancels at period end)
  router.post('/subscriptions/cancel', 
    isAuthenticated, 
    strictRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const subscription = await storage.getUserSubscription(userId);
        
        if (!subscription) {
          return res.status(404).json({ message: 'No active subscription found' });
        }
        
        await storage.updateSubscriptionCancelAtPeriodEnd(subscription.id, true);
        
        res.json({ 
          success: true, 
          message: 'Subscription will cancel at end of billing period' 
        });
      } catch (error: any) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ message: 'Failed to cancel subscription' });
      }
    }
  );

  // Reactivate cancelled subscription
  router.post('/subscriptions/reactivate', 
    isAuthenticated, 
    strictRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const subscription = await storage.getUserSubscription(userId);
        
        if (!subscription) {
          return res.status(404).json({ message: 'No subscription found' });
        }
        
        await storage.updateSubscriptionCancelAtPeriodEnd(subscription.id, false);
        
        res.json({ 
          success: true, 
          message: 'Subscription reactivated' 
        });
      } catch (error: any) {
        console.error('Error reactivating subscription:', error);
        res.status(500).json({ message: 'Failed to reactivate subscription' });
      }
    }
  );
}




