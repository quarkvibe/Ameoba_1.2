import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { generousRateLimit } from '../middleware/rateLimiter';
import { systemReadinessService } from '../services/systemReadiness';

/**
 * HEALTH & STATUS ROUTES
 * System health checks and readiness indicators (traffic light system)
 */

export function registerHealthRoutes(router: Router) {
  
  // Public health check (basic liveness)
  router.get('/health', async (req, res) => {
    try {
      const health = await systemReadinessService.getQuickHealth();
      res.json(health);
    } catch (error) {
      console.error('Error checking health:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Detailed readiness check (authenticated, for dashboard)
  router.get('/system/readiness', 
    isAuthenticated,
    generousRateLimit,
    async (req, res) => {
      try {
        const readiness = await systemReadinessService.getReadiness();
        res.json(readiness);
      } catch (error) {
        console.error('Error checking readiness:', error);
        res.status(500).json({ message: 'Failed to check system readiness' });
      }
    }
  );
}



