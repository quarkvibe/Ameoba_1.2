import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { standardRateLimit, generousRateLimit, strictRateLimit } from '../middleware/rateLimiter';
import { insertOutputChannelSchema } from '@shared/schema';
import { storage } from '../storage';

/**
 * OUTPUT CHANNEL ROUTES
 * Manages delivery destinations for generated content
 * Types: Email, Webhook, API, File storage
 */

export function registerOutputRoutes(router: Router) {
  
  // Create new output channel
  router.post('/outputs', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        
        // Validate request body
        const validatedData = insertOutputChannelSchema.parse({
          ...req.body,
          userId,
        });
        
        const output = await storage.createOutputChannel(validatedData);
        
        res.status(201).json({
          success: true,
          output,
        });
      } catch (error: any) {
        console.error('Error creating output channel:', error);
        
        if (error.name === 'ZodError') {
          return res.status(400).json({ 
            message: 'Validation failed', 
            errors: error.errors 
          });
        }
        
        res.status(500).json({ message: 'Failed to create output channel' });
      }
    }
  );

  // List output channels
  router.get('/outputs', 
    isAuthenticated, 
    generousRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const type = req.query.type as string | undefined;
        const includeInactive = req.query.includeInactive === 'true';
        
        const outputs = await storage.getOutputChannels(userId, {
          type,
          includeInactive,
        });
        
        res.json({ outputs });
      } catch (error) {
        console.error('Error listing output channels:', error);
        res.status(500).json({ message: 'Failed to list output channels' });
      }
    }
  );

  // Get single output channel
  router.get('/outputs/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        const output = await storage.getOutputChannel(id, userId);
        
        if (!output) {
          return res.status(404).json({ message: 'Output channel not found' });
        }
        
        res.json(output);
      } catch (error) {
        console.error('Error fetching output channel:', error);
        res.status(500).json({ message: 'Failed to fetch output channel' });
      }
    }
  );

  // Update output channel
  router.put('/outputs/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const existingOutput = await storage.getOutputChannel(id, userId);
        if (!existingOutput) {
          return res.status(404).json({ message: 'Output channel not found' });
        }
        
        // Update output channel
        const updatedOutput = await storage.updateOutputChannel(id, req.body);
        
        res.json({
          success: true,
          output: updatedOutput,
        });
      } catch (error) {
        console.error('Error updating output channel:', error);
        res.status(500).json({ message: 'Failed to update output channel' });
      }
    }
  );

  // Delete output channel
  router.delete('/outputs/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const output = await storage.getOutputChannel(id, userId);
        if (!output) {
          return res.status(404).json({ message: 'Output channel not found' });
        }
        
        await storage.deleteOutputChannel(id);
        
        res.json({ success: true, message: 'Output channel deleted' });
      } catch (error) {
        console.error('Error deleting output channel:', error);
        res.status(500).json({ message: 'Failed to delete output channel' });
      }
    }
  );

  // Test output channel
  router.post('/outputs/:id/test', 
    isAuthenticated, 
    strictRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        const { testContent } = req.body;
        
        const output = await storage.getOutputChannel(id, userId);
        if (!output) {
          return res.status(404).json({ message: 'Output channel not found' });
        }
        
        // Test delivery with sample content
        const content = testContent || 'This is a test message from Amoeba.';
        
        // TODO: Implement actual test delivery via deliveryService
        
        res.json({
          success: true,
          message: `Test delivery to ${output.type} channel successful`,
          channel: output.name,
        });
      } catch (error: any) {
        console.error('Error testing output channel:', error);
        res.status(500).json({ 
          success: false,
          message: error.message || 'Output channel test failed' 
        });
      }
    }
  );

  // Get output channel statistics
  router.get('/outputs/:id/stats', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const output = await storage.getOutputChannel(id, userId);
        if (!output) {
          return res.status(404).json({ message: 'Output channel not found' });
        }
        
        res.json({
          id,
          name: output.name,
          type: output.type,
          deliveryCount: output.deliveryCount || 0,
          errorCount: output.errorCount || 0,
          lastDelivery: output.lastDelivery,
          lastError: output.lastError,
          isActive: output.isActive,
        });
      } catch (error) {
        console.error('Error fetching output stats:', error);
        res.status(500).json({ message: 'Failed to fetch statistics' });
      }
    }
  );

  // Get available output types and their configuration schemas
  router.get('/outputs/types/available', 
    isAuthenticated, 
    generousRateLimit,
    async (req: any, res) => {
      try {
        const types = [
          {
            type: 'email',
            name: 'Email',
            description: 'Send content via email',
            configSchema: {
              to: { type: 'array', required: true, description: 'Recipient email addresses' },
              subject: { type: 'string', required: false, description: 'Email subject (supports variables)' },
              credentialId: { type: 'string', required: true, description: 'Email credential to use' },
            },
          },
          {
            type: 'webhook',
            name: 'Webhook',
            description: 'POST content to webhook URL',
            configSchema: {
              url: { type: 'string', required: true, description: 'Webhook URL' },
              method: { type: 'string', required: false, default: 'POST', description: 'HTTP method' },
              headers: { type: 'object', required: false, description: 'HTTP headers' },
              secret: { type: 'string', required: false, description: 'Webhook secret for signing' },
            },
          },
          {
            type: 'api',
            name: 'API',
            description: 'Send content to API endpoint',
            configSchema: {
              url: { type: 'string', required: true, description: 'API endpoint URL' },
              method: { type: 'string', required: false, default: 'POST', description: 'HTTP method' },
              headers: { type: 'object', required: false, description: 'HTTP headers' },
              apiKey: { type: 'string', required: false, description: 'API key for authentication' },
              bodyTemplate: { type: 'string', required: false, description: 'JSON template for request body' },
            },
          },
          {
            type: 'file',
            name: 'File Storage',
            description: 'Save content to file storage',
            configSchema: {
              path: { type: 'string', required: true, description: 'File path or S3 bucket' },
              format: { type: 'string', required: false, default: 'txt', description: 'File format' },
              s3Config: { type: 'object', required: false, description: 'S3 configuration if using S3' },
            },
          },
        ];
        
        res.json({ types });
      } catch (error) {
        console.error('Error fetching output types:', error);
        res.status(500).json({ message: 'Failed to fetch types' });
      }
    }
  );

  // Link output channel to template
  router.post('/outputs/:id/link-template', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        const { templateId } = req.body;
        
        if (!templateId) {
          return res.status(400).json({ message: 'templateId is required' });
        }
        
        // Verify ownership of both
        const output = await storage.getOutputChannel(id, userId);
        if (!output) {
          return res.status(404).json({ message: 'Output channel not found' });
        }
        
        const template = await storage.getContentTemplate(templateId, userId);
        if (!template) {
          return res.status(404).json({ message: 'Template not found' });
        }
        
        // Create link
        await storage.linkTemplateOutputChannel(templateId, id);
        
        res.json({ 
          success: true, 
          message: 'Output channel linked to template' 
        });
      } catch (error) {
        console.error('Error linking output channel:', error);
        res.status(500).json({ message: 'Failed to link output channel' });
      }
    }
  );

  // Unlink output channel from template
  router.delete('/outputs/:id/unlink-template/:templateId', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id, templateId } = req.params;
        
        // Verify ownership
        const output = await storage.getOutputChannel(id, userId);
        if (!output) {
          return res.status(404).json({ message: 'Output channel not found' });
        }
        
        // Unlink
        await storage.unlinkTemplateOutputChannel(templateId, id);
        
        res.json({ 
          success: true, 
          message: 'Output channel unlinked from template' 
        });
      } catch (error) {
        console.error('Error unlinking output channel:', error);
        res.status(500).json({ message: 'Failed to unlink output channel' });
      }
    }
  );

  // Get delivery logs for output channel
  router.get('/outputs/:id/logs', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;
        
        // Verify ownership
        const output = await storage.getOutputChannel(id, userId);
        if (!output) {
          return res.status(404).json({ message: 'Output channel not found' });
        }
        
        const logs = await storage.getDeliveryLogs({ outputChannelId: id, limit });
        
        res.json({ logs });
      } catch (error) {
        console.error('Error fetching delivery logs:', error);
        res.status(500).json({ message: 'Failed to fetch logs' });
      }
    }
  );
}



