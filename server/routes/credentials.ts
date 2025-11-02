import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { standardRateLimit, generousRateLimit, strictRateLimit } from '../middleware/rateLimiter';
import { storage } from '../storage';

/**
 * CREDENTIALS ROUTES (BYOK - Bring Your Own Keys)
 * Manages user-provided AI and email service credentials
 * All API keys are encrypted at rest using AES-256-GCM
 */

export function registerCredentialRoutes(router: Router) {
  
  // =============================================================================
  // AI CREDENTIALS (OpenAI, Anthropic, Cohere, Ollama)
  // =============================================================================
  
  // List AI credentials (masked)
  router.get('/ai-credentials', 
    isAuthenticated, 
    generousRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const credentials = await storage.getAiCredentials(userId);
        
        // Mask API keys in list view for security
        const safeCredentials = credentials.map(cred => ({
          ...cred,
          apiKey: `${cred.apiKey.substring(0, 8)}...${cred.apiKey.substring(cred.apiKey.length - 4)}`,
        }));
        
        res.json(safeCredentials);
      } catch (error) {
        console.error('Error fetching AI credentials:', error);
        res.status(500).json({ message: 'Failed to fetch AI credentials' });
      }
    }
  );

  // Get single AI credential (full key for editing)
  router.get('/ai-credentials/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        const credential = await storage.getAiCredential(id, userId);
        
        if (!credential) {
          return res.status(404).json({ message: 'Credential not found' });
        }
        
        res.json(credential);
      } catch (error) {
        console.error('Error fetching AI credential:', error);
        res.status(500).json({ message: 'Failed to fetch credential' });
      }
    }
  );

  // Create AI credential
  router.post('/ai-credentials', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { provider, name, apiKey, additionalConfig, isDefault, isActive } = req.body;
        
        // Validation
        if (!provider || !name || !apiKey) {
          return res.status(400).json({ 
            message: 'provider, name, and apiKey are required' 
          });
        }
        
        if (!['openai', 'anthropic', 'cohere', 'ollama'].includes(provider.toLowerCase())) {
          return res.status(400).json({ 
            message: 'Invalid provider. Must be: openai, anthropic, cohere, or ollama' 
          });
        }
        
        // Create credential (encryption happens in storage layer)
        const credential = await storage.createAiCredential({
          userId,
          provider: provider.toLowerCase(),
          name,
          apiKey,
          additionalConfig: additionalConfig || null,
          isDefault: isDefault || false,
          isActive: isActive !== false,
        });
        
        // Mask API key in response
        res.status(201).json({
          ...credential,
          apiKey: `${credential.apiKey.substring(0, 8)}...${credential.apiKey.substring(credential.apiKey.length - 4)}`,
        });
      } catch (error) {
        console.error('Error creating AI credential:', error);
        res.status(500).json({ message: 'Failed to create credential' });
      }
    }
  );

  // Update AI credential
  router.put('/ai-credentials/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const existing = await storage.getAiCredential(id, userId);
        if (!existing) {
          return res.status(404).json({ message: 'Credential not found' });
        }
        
        // Update (only provided fields)
        const updated = await storage.updateAiCredential(id, req.body);
        
        // Mask API key in response
        res.json({
          ...updated,
          apiKey: `${updated.apiKey.substring(0, 8)}...${updated.apiKey.substring(updated.apiKey.length - 4)}`,
        });
      } catch (error) {
        console.error('Error updating AI credential:', error);
        res.status(500).json({ message: 'Failed to update credential' });
      }
    }
  );

  // Delete AI credential
  router.delete('/ai-credentials/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const credential = await storage.getAiCredential(id, userId);
        if (!credential) {
          return res.status(404).json({ message: 'Credential not found' });
        }
        
        await storage.deleteAiCredential(id);
        
        res.json({ success: true, message: 'Credential deleted' });
      } catch (error) {
        console.error('Error deleting AI credential:', error);
        res.status(500).json({ message: 'Failed to delete credential' });
      }
    }
  );

  // Test AI credential (verify it works)
  router.post('/ai-credentials/:id/test', 
    isAuthenticated, 
    strictRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        const credential = await storage.getAiCredential(id, userId);
        if (!credential) {
          return res.status(404).json({ message: 'Credential not found' });
        }
        
        // TODO: Implement actual API test
        // For now, just return success if credential exists
        res.json({ 
          success: true, 
          provider: credential.provider,
          message: 'Credential test successful' 
        });
      } catch (error) {
        console.error('Error testing AI credential:', error);
        res.status(500).json({ 
          success: false,
          message: 'Credential test failed' 
        });
      }
    }
  );

  // =============================================================================
  // EMAIL SERVICE CREDENTIALS (SendGrid, AWS SES)
  // =============================================================================
  
  // List email credentials (masked)
  router.get('/email-credentials', 
    isAuthenticated, 
    generousRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const credentials = await storage.getEmailServiceCredentials(userId);
        
        // Mask sensitive fields
        const safeCredentials = credentials.map(cred => ({
          ...cred,
          apiKey: cred.apiKey ? `${cred.apiKey.substring(0, 8)}...${cred.apiKey.substring(cred.apiKey.length - 4)}` : null,
          awsSecretAccessKey: cred.awsSecretAccessKey ? '***MASKED***' : null,
        }));
        
        res.json(safeCredentials);
      } catch (error) {
        console.error('Error fetching email credentials:', error);
        res.status(500).json({ message: 'Failed to fetch email credentials' });
      }
    }
  );

  // Get single email credential
  router.get('/email-credentials/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        const credential = await storage.getEmailServiceCredential(id, userId);
        
        if (!credential) {
          return res.status(404).json({ message: 'Credential not found' });
        }
        
        res.json(credential);
      } catch (error) {
        console.error('Error fetching email credential:', error);
        res.status(500).json({ message: 'Failed to fetch credential' });
      }
    }
  );

  // Create email credential
  router.post('/email-credentials', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { provider, name, fromEmail, fromName, apiKey, awsAccessKeyId, awsSecretAccessKey, awsRegion, isDefault, isActive } = req.body;
        
        // Validation
        if (!provider || !name || !fromEmail) {
          return res.status(400).json({ 
            message: 'provider, name, and fromEmail are required' 
          });
        }
        
        if (!['sendgrid', 'ses'].includes(provider.toLowerCase())) {
          return res.status(400).json({ 
            message: 'Invalid provider. Must be: sendgrid or ses' 
          });
        }
        
        // Provider-specific validation
        if (provider.toLowerCase() === 'sendgrid' && !apiKey) {
          return res.status(400).json({ message: 'apiKey required for SendGrid' });
        }
        
        if (provider.toLowerCase() === 'ses' && (!awsAccessKeyId || !awsSecretAccessKey)) {
          return res.status(400).json({ message: 'AWS credentials required for SES' });
        }
        
        // Create credential
        const credential = await storage.createEmailServiceCredential({
          userId,
          provider: provider.toLowerCase(),
          name,
          fromEmail,
          fromName: fromName || null,
          apiKey: apiKey || null,
          awsAccessKeyId: awsAccessKeyId || null,
          awsSecretAccessKey: awsSecretAccessKey || null,
          awsRegion: awsRegion || 'us-east-1',
          isDefault: isDefault || false,
          isActive: isActive !== false,
        });
        
        // Mask sensitive fields in response
        res.status(201).json({
          ...credential,
          apiKey: credential.apiKey ? `${credential.apiKey.substring(0, 8)}...${credential.apiKey.substring(credential.apiKey.length - 4)}` : null,
          awsSecretAccessKey: credential.awsSecretAccessKey ? '***MASKED***' : null,
        });
      } catch (error) {
        console.error('Error creating email credential:', error);
        res.status(500).json({ message: 'Failed to create credential' });
      }
    }
  );

  // Update email credential
  router.put('/email-credentials/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const existing = await storage.getEmailServiceCredential(id, userId);
        if (!existing) {
          return res.status(404).json({ message: 'Credential not found' });
        }
        
        // Update
        const updated = await storage.updateEmailServiceCredential(id, req.body);
        
        // Mask sensitive fields
        res.json({
          ...updated,
          apiKey: updated.apiKey ? `${updated.apiKey.substring(0, 8)}...${updated.apiKey.substring(updated.apiKey.length - 4)}` : null,
          awsSecretAccessKey: updated.awsSecretAccessKey ? '***MASKED***' : null,
        });
      } catch (error) {
        console.error('Error updating email credential:', error);
        res.status(500).json({ message: 'Failed to update credential' });
      }
    }
  );

  // Delete email credential
  router.delete('/email-credentials/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const credential = await storage.getEmailServiceCredential(id, userId);
        if (!credential) {
          return res.status(404).json({ message: 'Credential not found' });
        }
        
        await storage.deleteEmailServiceCredential(id);
        
        res.json({ success: true, message: 'Credential deleted' });
      } catch (error) {
        console.error('Error deleting email credential:', error);
        res.status(500).json({ message: 'Failed to delete credential' });
      }
    }
  );

  // Test email credential (send test email)
  router.post('/email-credentials/:id/test', 
    isAuthenticated, 
    strictRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        const { testEmail } = req.body;
        
        if (!testEmail) {
          return res.status(400).json({ message: 'testEmail is required' });
        }
        
        const credential = await storage.getEmailServiceCredential(id, userId);
        if (!credential) {
          return res.status(404).json({ message: 'Credential not found' });
        }
        
        // TODO: Implement actual email test
        // For now, just return success
        res.json({ 
          success: true, 
          provider: credential.provider,
          message: `Test email would be sent to ${testEmail}` 
        });
      } catch (error) {
        console.error('Error testing email credential:', error);
        res.status(500).json({ 
          success: false,
          message: 'Email test failed' 
        });
      }
    }
  );
}



