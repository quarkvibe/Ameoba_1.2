import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { standardRateLimit, strictRateLimit, generousRateLimit } from '../middleware/rateLimiter';
import { integrationService } from '../services/integrationService';

/**
 * API KEY ROUTES
 * Programmatic access management for Amoeba API
 * Allows users to generate API keys for external integrations
 */

export function registerApiKeyRoutes(router: Router) {
  
  // List user's API keys
  router.get('/api-keys', 
    isAuthenticated, 
    generousRateLimit,
    async (req, res) => {
      try {
        const apiKeys = await integrationService.getApiKeys();
        
        // Don't return the actual key hash, only metadata
        const safeApiKeys = apiKeys.map(key => ({
          id: key.id,
          name: key.name,
          permissions: key.permissions,
          isActive: key.isActive,
          lastUsed: key.lastUsed,
          expiresAt: key.expiresAt,
          createdAt: key.createdAt,
          updatedAt: key.updatedAt,
        }));
        
        res.json(safeApiKeys);
      } catch (error) {
        console.error('Error fetching API keys:', error);
        res.status(500).json({ message: 'Failed to fetch API keys' });
      }
    }
  );

  // Generate new API key
  router.post('/api-keys', 
    isAuthenticated, 
    standardRateLimit,
    async (req, res) => {
      try {
        const { name, permissions, expiresIn } = req.body;
        
        if (!name || !permissions || !Array.isArray(permissions)) {
          return res.status(400).json({ 
            message: 'name and permissions array are required' 
          });
        }
        
        // Validate permissions
        const validPermissions = [
          'content:read',
          'content:write',
          'templates:read',
          'templates:write',
          'schedules:read',
          'schedules:write',
          'dataSources:read',
          'dataSources:write',
          'outputs:read',
          'outputs:write',
        ];
        
        for (const permission of permissions) {
          if (!validPermissions.includes(permission)) {
            return res.status(400).json({ 
              message: `Invalid permission: ${permission}` 
            });
          }
        }
        
        const result = await integrationService.generateApiKey(name, permissions, expiresIn);
        
        res.json({
          message: 'API key generated successfully. Store it securely - it will not be shown again.',
          apiKey: {
            id: result.apiKey.id,
            name: result.apiKey.name,
            permissions: result.apiKey.permissions,
            key: result.key, // Only returned on creation
            expiresAt: result.apiKey.expiresAt,
          },
        });
      } catch (error) {
        console.error('Error generating API key:', error);
        res.status(500).json({ message: 'Failed to generate API key' });
      }
    }
  );

  // Update API key metadata
  router.put('/api-keys/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { name, permissions, isActive } = req.body;
        
        const updatedKey = await integrationService.updateApiKey(id, {
          name,
          permissions,
          isActive,
        });
        
        res.json({
          success: true,
          apiKey: {
            id: updatedKey.id,
            name: updatedKey.name,
            permissions: updatedKey.permissions,
            isActive: updatedKey.isActive,
          },
        });
      } catch (error) {
        console.error('Error updating API key:', error);
        res.status(500).json({ message: 'Failed to update API key' });
      }
    }
  );

  // Revoke/delete API key
  router.delete('/api-keys/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req, res) => {
      try {
        const { id } = req.params;
        await integrationService.revokeApiKey(id);
        res.json({ success: true, message: 'API key revoked successfully' });
      } catch (error) {
        console.error('Error revoking API key:', error);
        res.status(500).json({ message: 'Failed to revoke API key' });
      }
    }
  );

  // Get API key usage statistics
  router.get('/api-keys/:id/stats', 
    isAuthenticated, 
    standardRateLimit,
    async (req, res) => {
      try {
        const { id } = req.params;
        
        const stats = await integrationService.getApiKeyStats(id);
        
        res.json({
          id,
          name: stats.name,
          requestCount: stats.requestCount || 0,
          lastUsed: stats.lastUsed,
          createdAt: stats.createdAt,
          isActive: stats.isActive,
        });
      } catch (error) {
        console.error('Error fetching API key stats:', error);
        res.status(500).json({ message: 'Failed to fetch statistics' });
      }
    }
  );

  // Get available permissions
  router.get('/api-keys/permissions/available', 
    isAuthenticated, 
    generousRateLimit,
    async (req, res) => {
      try {
        const permissions = [
          {
            scope: 'content',
            permissions: [
              { name: 'content:read', description: 'Read generated content' },
              { name: 'content:write', description: 'Generate and delete content' },
            ],
          },
          {
            scope: 'templates',
            permissions: [
              { name: 'templates:read', description: 'Read templates' },
              { name: 'templates:write', description: 'Create, update, and delete templates' },
            ],
          },
          {
            scope: 'schedules',
            permissions: [
              { name: 'schedules:read', description: 'Read scheduled jobs' },
              { name: 'schedules:write', description: 'Create, update, and delete scheduled jobs' },
            ],
          },
          {
            scope: 'dataSources',
            permissions: [
              { name: 'dataSources:read', description: 'Read data sources' },
              { name: 'dataSources:write', description: 'Create, update, and delete data sources' },
            ],
          },
          {
            scope: 'outputs',
            permissions: [
              { name: 'outputs:read', description: 'Read output channels' },
              { name: 'outputs:write', description: 'Create, update, and delete output channels' },
            ],
          },
        ];
        
        res.json({ permissions });
      } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ message: 'Failed to fetch permissions' });
      }
    }
  );

  // Rotate API key (generates new key, marks old as inactive)
  router.post('/api-keys/:id/rotate', 
    isAuthenticated, 
    strictRateLimit,
    async (req, res) => {
      try {
        const { id } = req.params;
        
        const result = await integrationService.rotateApiKey(id);
        
        res.json({
          message: 'API key rotated successfully. Store the new key securely - it will not be shown again.',
          apiKey: {
            id: result.apiKey.id,
            name: result.apiKey.name,
            permissions: result.apiKey.permissions,
            key: result.key, // New key only returned on rotation
            expiresAt: result.apiKey.expiresAt,
          },
        });
      } catch (error) {
        console.error('Error rotating API key:', error);
        res.status(500).json({ message: 'Failed to rotate API key' });
      }
    }
  );
}




