import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { strictRateLimit, standardRateLimit, generousRateLimit } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validation';
import { activateLicenseSchema, deactivateLicenseSchema } from '../validation/monetization';
import { licenseService } from '../services/licenseService';
import { storage } from '../storage';

/**
 * LICENSE ROUTES (Tree Fiddy! 🦕)
 * Handles $3.50 lifetime license management
 */

export function registerLicenseRoutes(router: Router) {
  
  // Activate license (bind to device)
  router.post('/licenses/activate', 
    isAuthenticated, 
    strictRateLimit,
    validateBody(activateLicenseSchema),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { licenseKey } = req.body;

        const result = await licenseService.activateLicense(licenseKey, userId);
        
        if (!result.isValid) {
          return res.status(400).json({ success: false, message: result.message });
        }
        
        res.json({ 
          success: true, 
          message: result.message,
          license: {
            status: result.status,
            activatedAt: result.activatedAt,
            deviceFingerprint: result.deviceFingerprint,
          }
        });
      } catch (error: any) {
        console.error('Error activating license:', error);
        res.status(400).json({ message: error.message || 'Failed to activate license' });
      }
    }
  );

  // Deactivate license (self-service device release)
  router.post('/licenses/deactivate', 
    isAuthenticated, 
    strictRateLimit,
    validateBody(deactivateLicenseSchema),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { licenseKey } = req.body;

        const success = await licenseService.deactivateLicense(userId, licenseKey);
        
        res.json({ 
          success, 
          message: 'License deactivated successfully. You can now activate it on another device.',
        });
      } catch (error: any) {
        console.error('Error deactivating license:', error);
        res.status(400).json({ success: false, message: error.message || 'Failed to deactivate license' });
      }
    }
  );

  // List user's licenses
  router.get('/licenses', 
    isAuthenticated, 
    generousRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const licenses = await storage.getUserLicenses(userId);
        
        // Mask sensitive data
        const safeLicenses = licenses.map(license => ({
          id: license.id,
          licenseKey: `${license.licenseKey.substring(0, 12)}...${license.licenseKey.substring(license.licenseKey.length - 4)}`,
          status: license.status,
          activatedAt: license.activatedAt,
          deactivatedAt: license.deactivatedAt,
          lastValidated: license.lastValidated,
          createdAt: license.createdAt,
        }));
        
        res.json(safeLicenses);
      } catch (error: any) {
        console.error('Error fetching licenses:', error);
        res.status(500).json({ message: 'Failed to fetch licenses' });
      }
    }
  );

  // Validate license (used by client on startup)
  router.post('/licenses/validate', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;

        const result = await licenseService.validateLicense(userId);
        
        res.json({ 
          valid: result.isValid, 
          message: result.message,
          license: result.isValid ? {
            licenseKey: result.licenseKey,
            status: result.status,
            activatedAt: result.activatedAt,
          } : null
        });
      } catch (error: any) {
        console.error('Error validating license:', error);
        res.status(500).json({ message: 'Failed to validate license', valid: false });
      }
    }
  );
}




