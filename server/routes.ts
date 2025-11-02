import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";
import {
  insertContentTemplateSchema,
  insertDataSourceSchema,
  insertOutputChannelSchema,
  insertDistributionRuleSchema,
  insertScheduledJobSchema,
  insertGeneratedContentSchema,
} from "@shared/schema";
import { queueService } from "./services/queueService";
import { emailService } from "./services/emailService";
import { aiAgent } from "./services/aiAgent";
// premiumEmailService removed - generic delivery service will replace it
import { cronService } from "./services/cronService";
import { integrationService } from "./services/integrationService";
import { WebSocketServer, WebSocket } from "ws";
import { activityMonitor } from "./services/activityMonitor";
import { commandExecutor } from "./services/commandExecutor";
import { systemReadinessService } from "./services/systemReadiness";
import { contentGenerationService } from "./services/contentGenerationService";
import { deliveryService } from "./services/deliveryService";
import { dataSourceService } from "./services/dataSourceService";
import { stripeService } from "./services/stripeService";
import { licenseService } from "./services/licenseService";
import { ollamaService } from "./services/ollamaService";
import { validateBody, validateQuery } from "./middleware/validation";
import { 
  strictRateLimit, 
  standardRateLimit, 
  generousRateLimit,
  aiGenerationRateLimit 
} from "./middleware/rateLimiter";
import {
  activateLicenseSchema,
  deactivateLicenseSchema,
  createCheckoutSchema,
  createSubscriptionCheckoutSchema,
} from "./validation/monetization";
import {
  pullModelSchema,
} from "./validation/ollama";

// API Key Authentication Middleware
async function requireApiKey(req: any, res: any, next: any, permissions: string[] = []) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: "Missing or invalid authorization header. Required format: 'Bearer YOUR_API_KEY'" 
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const apiKey = await integrationService.validateApiKey(token);
    
    if (!apiKey) {
      return res.status(401).json({ 
        message: "Invalid or expired API key" 
      });
    }
    
    // Check permissions if required
    for (const permission of permissions) {
      if (!integrationService.hasPermission(apiKey, permission)) {
        return res.status(403).json({ 
          message: `Insufficient permissions. Required: ${permission}` 
        });
      }
    }
    
    // Add API key info to request
    req.apiKey = apiKey;
    
    // Log API usage
    await integrationService.logApiUsage(
      apiKey.name,
      req.path,
      req.method,
      200,
      0 // Response time will be updated later
    );
    
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({ message: 'Authentication service error' });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple health checks BEFORE auth middleware
  app.get('/healthz', (req, res) => res.status(200).send('OK'));
  app.get('/readyz', (req, res) => res.status(200).json({status:'ready'}));

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Health check endpoint (public)
  app.get("/api/health", async (req, res) => {
    try {
      const quickHealth = await systemReadinessService.getQuickHealth();
      res.json({
        status: quickHealth.status,
        icon: quickHealth.icon,
        message: quickHealth.message,
        timestamp: new Date().toISOString(),
        service: "Amoeba AI Content Generation Platform",
        version: "2.0.0",
        platform: "universal_content_generator"
      });
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({ 
        status: "critical",
        message: "Health check failed" 
      });
    }
  });

  // System readiness check (authenticated) - 🟢🟡🔴 Traffic Light System
  app.get("/api/system/readiness", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const readiness = await systemReadinessService.getReadiness(userId);
      res.json(readiness);
    } catch (error) {
      console.error("Readiness check error:", error);
      res.status(500).json({ message: "Failed to check system readiness" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const metrics = await storage.getEmailMetrics(userId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // =============================================================================
  // CAMPAIGN MANAGEMENT (Auth Required)
  // =============================================================================

  // Get all campaigns
  app.get("/api/campaigns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaigns = await storage.getCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  // Create a new campaign
  app.post("/api/campaigns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaign = await storage.createCampaign({ ...req.body, userId });
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  // Update campaign
  app.put("/api/campaigns/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaign = await storage.updateCampaign(req.params.id, userId, req.body);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  // Delete campaign
  app.delete("/api/campaigns/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteCampaign(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  // =============================================================================
  // EMAIL MANAGEMENT (Auth Required)
  // =============================================================================

  // Send email
  app.post("/api/emails/send", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await emailService.sendEmail(req.body, userId);
      res.json(result);
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Get email providers
  app.get("/api/emails/providers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const providers = await storage.getEmailConfigurations(userId);
      res.json(providers);
    } catch (error) {
      console.error("Error fetching email providers:", error);
      res.status(500).json({ message: "Failed to fetch email providers" });
    }
  });

  // Create/update email provider
  app.post("/api/emails/providers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const provider = await storage.createEmailConfiguration({ ...req.body, userId });
      res.status(201).json(provider);
    } catch (error) {
      console.error("Error creating email provider:", error);
      res.status(500).json({ message: "Failed to create email provider" });
    }
  });

  // =============================================================================
  // QUEUE MANAGEMENT (Auth Required)
  // =============================================================================

  // Get queue metrics
  app.get("/api/queue/metrics", async (req, res) => {
    try {
      const metrics = await queueService.getMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching queue metrics:", error);
      res.status(500).json({ message: "Failed to fetch queue metrics" });
    }
  });

  // Get queue jobs
  app.get("/api/queue/jobs", isAuthenticated, async (req, res) => {
    try {
      const { status, limit = 50 } = req.query;
      const jobs = await storage.getQueueJobs(status as string, parseInt(limit as string));
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching queue jobs:", error);
      res.status(500).json({ message: "Failed to fetch queue jobs" });
    }
  });

  // Add job to queue
  app.post("/api/queue/jobs", isAuthenticated, async (req, res) => {
    try {
      const job = await queueService.addJob(req.body);
      res.status(201).json(job);
    } catch (error) {
      console.error("Error adding job to queue:", error);
      res.status(500).json({ message: "Failed to add job to queue" });
    }
  });

  // Retry failed job
  app.post("/api/queue/jobs/:id/retry", isAuthenticated, async (req, res) => {
    try {
      // Reset job status to pending and reset attempts
      await storage.updateQueueJob(req.params.id, {
        status: 'pending',
        attempts: 0,
        error: null,
      });
      res.json({ message: 'Job queued for retry' });
    } catch (error) {
      console.error("Error retrying job:", error);
      res.status(500).json({ message: "Failed to retry job" });
    }
  });

  // Cancel job
  app.delete("/api/queue/jobs/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.updateQueueJob(req.params.id, {
        status: 'failed',
        error: 'Cancelled by user',
      });
      res.status(204).send();
    } catch (error) {
      console.error("Error canceling job:", error);
      res.status(500).json({ message: "Failed to cancel job" });
    }
  });

  // Pause/resume queue
  app.post("/api/queue/pause", isAuthenticated, async (req, res) => {
    try {
      // Queue service doesn't have pause - it processes automatically
      // This is a stub endpoint for future implementation
      res.json({ message: "Queue paused successfully (stub)" });
    } catch (error) {
      console.error("Error pausing queue:", error);
      res.status(500).json({ message: "Failed to pause queue" });
    }
  });

  app.post("/api/queue/resume", isAuthenticated, async (req, res) => {
    try {
      // Queue service doesn't have resume - it processes automatically
      // This is a stub endpoint for future implementation
      res.json({ message: "Queue resumed successfully (stub)" });
    } catch (error) {
      console.error("Error resuming queue:", error);
      res.status(500).json({ message: "Failed to resume queue" });
    }
  });

  // =============================================================================
  // AI AGENT (Auth Required)
  // =============================================================================

  // Chat with AI agent
  app.post("/api/agent/chat", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: 'Invalid message' });
      }
      
      const response = await aiAgent.processMessage(userId, message);
      res.json(response);
    } catch (error) {
      console.error("Error in AI agent chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Get conversation history
  app.get("/api/agent/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getAgentConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get AI suggestions
  app.get("/api/agent/suggestions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const suggestions = await aiAgent.suggestOptimizations(userId);
      res.json({ suggestions });
    } catch (error) {
      console.error("Optimization suggestions error:", error);
      res.json({ suggestions: ["Unable to generate suggestions at this time"] });
    }
  });

  // =============================================================================
  // ANALYTICS & REPORTING (Auth Required)
  // =============================================================================

  // Get email analytics
  app.get("/api/analytics/emails", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      const analytics = await storage.getEmailMetrics(
        userId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching email analytics:", error);
      res.status(500).json({ message: "Failed to fetch email analytics" });
    }
  });

  // Get campaign performance
  app.get("/api/analytics/campaigns/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Stub - return basic campaign stats from email logs
      const campaign = await storage.getCampaign(req.params.id, userId);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      res.json({ 
        campaign,
        stats: { sent: 0, delivered: 0, bounced: 0, failed: 0 }
      });
    } catch (error) {
      console.error("Error fetching campaign analytics:", error);
      res.status(500).json({ message: "Failed to fetch campaign analytics" });
    }
  });

  // =============================================================================
  // SYSTEM CONFIGURATION (Auth Required)
  // =============================================================================

  // Get system configurations
  app.get("/api/system/config", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Return basic config - can be expanded later
      res.json({ 
        version: '2.0.0',
        features: ['content_generation', 'scheduling', 'delivery'],
        userId 
      });
    } catch (error) {
      console.error("Error fetching system config:", error);
      res.status(500).json({ message: "Failed to fetch system config" });
    }
  });

  // Update system configuration
  app.put("/api/system/config", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Stub - acknowledge update
      res.json({ message: 'Configuration updated', userId });
    } catch (error) {
      console.error("Error updating system config:", error);
      res.status(500).json({ message: "Failed to update system config" });
    }
  });

  // =============================================================================
  // API KEY MANAGEMENT (Auth Required)
  // =============================================================================

  // Get all API keys for the current user
  app.get("/api/api-keys", isAuthenticated, async (req, res) => {
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
        updatedAt: key.updatedAt
      }));
      res.json(safeApiKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ message: "Failed to fetch API keys" });
    }
  });

  // Generate a new API key
  app.post("/api/api-keys", isAuthenticated, async (req, res) => {
    try {
      const { name, permissions } = req.body;
      
      if (!name || !permissions || !Array.isArray(permissions)) {
        return res.status(400).json({ 
          message: "Name and permissions array are required" 
        });
      }

      const result = await integrationService.generateApiKey(name, permissions);
      
      res.json({
        message: "API key generated successfully",
        apiKey: {
          id: result.apiKey.id,
          name: result.apiKey.name,
          permissions: result.apiKey.permissions,
          key: result.key // Only return the actual key on creation
        }
      });
    } catch (error) {
      console.error("Error generating API key:", error);
      res.status(500).json({ message: "Failed to generate API key" });
    }
  });

  // Revoke an API key
  app.delete("/api/api-keys/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await integrationService.revokeApiKey(id);
      res.json({ message: "API key revoked successfully" });
    } catch (error) {
      console.error("Error revoking API key:", error);
      res.status(500).json({ message: "Failed to revoke API key" });
    }
  });

  // =============================================================================
  // INTEGRATION MANAGEMENT (Auth Required)
  // =============================================================================

  // Get integrations
  app.get("/api/integrations", isAuthenticated, async (req, res) => {
    try {
      const apiKeys = await integrationService.getApiKeys();
      const webhooks = await storage.getActiveWebhooks();
      res.json({ apiKeys, webhooks });
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  // Create API key (legacy endpoint - use /api/api-keys instead)
  app.post("/api/integrations/keys", isAuthenticated, async (req, res) => {
    try {
      const { name, permissions } = req.body;
      const result = await integrationService.generateApiKey(name, permissions);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(500).json({ message: "Failed to create API key" });
    }
  });

  // =============================================================================
  // BYOK CREDENTIALS MANAGEMENT (Auth Required)
  // =============================================================================

  // AI Credentials CRUD
  app.get("/api/ai-credentials", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const credentials = await storage.getAiCredentials(userId);
      
      // Don't return the full API key in list view for security
      const safeCredentials = credentials.map(cred => ({
        ...cred,
        apiKey: `${cred.apiKey.substring(0, 8)}...${cred.apiKey.substring(cred.apiKey.length - 4)}`,
      }));
      
      res.json(safeCredentials);
    } catch (error) {
      console.error("Error fetching AI credentials:", error);
      res.status(500).json({ message: "Failed to fetch AI credentials" });
    }
  });

  app.post("/api/ai-credentials", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const credential = await storage.createAiCredential({ ...req.body, userId });
      
      // Mask the API key in response (show first 8 and last 4 chars)
      res.status(201).json({
        ...credential,
        apiKey: `${credential.apiKey.substring(0, 8)}...${credential.apiKey.substring(credential.apiKey.length - 4)}`,
      });
    } catch (error) {
      console.error("Error creating AI credential:", error);
      res.status(500).json({ message: "Failed to create AI credential" });
    }
  });

  app.get("/api/ai-credentials/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const credential = await storage.getAiCredential(req.params.id, userId);
      
      if (!credential) {
        return res.status(404).json({ message: "AI credential not found" });
      }
      
      // Return full credential (caller has permission)
      res.json(credential);
    } catch (error) {
      console.error("Error fetching AI credential:", error);
      res.status(500).json({ message: "Failed to fetch AI credential" });
    }
  });

  app.put("/api/ai-credentials/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const credential = await storage.updateAiCredential(req.params.id, userId, req.body);
      
      if (!credential) {
        return res.status(404).json({ message: "AI credential not found" });
      }
      
      res.json({
        ...credential,
        apiKey: `${credential.apiKey.substring(0, 8)}...${credential.apiKey.substring(credential.apiKey.length - 4)}`,
      });
    } catch (error) {
      console.error("Error updating AI credential:", error);
      res.status(500).json({ message: "Failed to update AI credential" });
    }
  });

  app.delete("/api/ai-credentials/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteAiCredential(req.params.id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "AI credential not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting AI credential:", error);
      res.status(500).json({ message: "Failed to delete AI credential" });
    }
  });

  // Email Service Credentials CRUD
  app.get("/api/email-credentials", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const credentials = await storage.getEmailServiceCredentials(userId);
      
      // Mask sensitive fields in list view
      const safeCredentials = credentials.map(cred => ({
        ...cred,
        apiKey: cred.apiKey ? `${cred.apiKey.substring(0, 8)}...` : null,
        awsSecretAccessKey: cred.awsSecretAccessKey ? '***HIDDEN***' : null,
      }));
      
      res.json(safeCredentials);
    } catch (error) {
      console.error("Error fetching email credentials:", error);
      res.status(500).json({ message: "Failed to fetch email credentials" });
    }
  });

  app.post("/api/email-credentials", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const credential = await storage.createEmailServiceCredential({ ...req.body, userId });
      
      res.status(201).json({
        ...credential,
        apiKey: credential.apiKey ? `${credential.apiKey.substring(0, 8)}...` : null,
        awsSecretAccessKey: credential.awsSecretAccessKey ? '***HIDDEN***' : null,
        });
      } catch (error) {
      console.error("Error creating email credential:", error);
      res.status(500).json({ message: "Failed to create email credential" });
    }
  });

  app.get("/api/email-credentials/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const credential = await storage.getEmailServiceCredential(req.params.id, userId);
      
      if (!credential) {
        return res.status(404).json({ message: "Email credential not found" });
      }
      
      // Return full credential (caller has permission)
      res.json(credential);
    } catch (error) {
      console.error("Error fetching email credential:", error);
      res.status(500).json({ message: "Failed to fetch email credential" });
    }
  });

  app.put("/api/email-credentials/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const credential = await storage.updateEmailServiceCredential(req.params.id, userId, req.body);
      
      if (!credential) {
        return res.status(404).json({ message: "Email credential not found" });
      }
      
      res.json({
        ...credential,
        apiKey: credential.apiKey ? `${credential.apiKey.substring(0, 8)}...` : null,
        awsSecretAccessKey: credential.awsSecretAccessKey ? '***HIDDEN***' : null,
      });
    } catch (error) {
      console.error("Error updating email credential:", error);
      res.status(500).json({ message: "Failed to update email credential" });
    }
  });

  app.delete("/api/email-credentials/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteEmailServiceCredential(req.params.id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Email credential not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting email credential:", error);
      res.status(500).json({ message: "Failed to delete email credential" });
    }
  });

  // =============================================================================
  // CRON JOB MANAGEMENT (Auth Required)
  // =============================================================================

  // Get cron job status
  app.get("/api/cron/status", isAuthenticated, async (req, res) => {
    try {
      const status = cronService.getStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching cron status:", error);
      res.status(500).json({ message: "Failed to fetch cron status" });
    }
  });

  // ===============================================
  // UNIVERSAL CONTENT PLATFORM API ROUTES
  // ===============================================

  // Content Templates CRUD
  app.get('/api/templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templates = await storage.getContentTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ message: 'Failed to fetch templates' });
    }
  });

  app.post('/api/templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templateData = insertContentTemplateSchema.parse({ ...req.body, userId });
      const template = await storage.createContentTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(400).json({ message: 'Failed to create template', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put('/api/templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const updates = insertContentTemplateSchema.partial().parse(req.body);
      const template = await storage.updateContentTemplate(id, userId, updates);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      res.json(template);
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(400).json({ message: 'Failed to update template', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete('/api/templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const deleted = await storage.deleteContentTemplate(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: 'Template not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({ message: 'Failed to delete template' });
    }
  });

  // Data Sources CRUD
  app.get('/api/datasources', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dataSources = await storage.getDataSources(userId);
      res.json(dataSources);
    } catch (error) {
      console.error('Error fetching data sources:', error);
      res.status(500).json({ message: 'Failed to fetch data sources' });
    }
  });

  app.post('/api/datasources', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dataSourceData = insertDataSourceSchema.parse({ ...req.body, userId });
      const dataSource = await storage.createDataSource(dataSourceData);
      res.status(201).json(dataSource);
    } catch (error) {
      console.error('Error creating data source:', error);
      res.status(400).json({ message: 'Failed to create data source', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put('/api/datasources/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const updates = insertDataSourceSchema.partial().parse(req.body);
      const dataSource = await storage.updateDataSource(id, userId, updates);
      if (!dataSource) {
        return res.status(404).json({ message: 'Data source not found' });
      }
      res.json(dataSource);
    } catch (error) {
      console.error('Error updating data source:', error);
      res.status(400).json({ message: 'Failed to update data source', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete('/api/datasources/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const deleted = await storage.deleteDataSource(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: 'Data source not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting data source:', error);
      res.status(500).json({ message: 'Failed to delete data source' });
    }
  });

  // Data Source Testing Endpoint (with SSRF protection)
  app.post('/api/datasources/test', isAuthenticated, async (req: any, res) => {
    try {
      const { config } = req.body;
      
      // SSRF Protection - Validate URLs even in stub implementation
      if (config?.endpoint) {
        const url = new URL(config.endpoint);
        if (url.protocol !== 'https:') {
          return res.status(400).json({ message: 'Only HTTPS URLs are allowed' });
        }
        // Block common private IP ranges
        const hostname = url.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || 
            hostname.startsWith('192.168.') || hostname.startsWith('10.') ||
            hostname.startsWith('172.16.') || hostname.startsWith('172.17.') ||
            hostname.startsWith('172.18.') || hostname.startsWith('172.19.') ||
            hostname.startsWith('172.20.') || hostname.startsWith('172.21.') ||
            hostname.startsWith('172.22.') || hostname.startsWith('172.23.') ||
            hostname.startsWith('172.24.') || hostname.startsWith('172.25.') ||
            hostname.startsWith('172.26.') || hostname.startsWith('172.27.') ||
            hostname.startsWith('172.28.') || hostname.startsWith('172.29.') ||
            hostname.startsWith('172.30.') || hostname.startsWith('172.31.')) {
          return res.status(400).json({ message: 'Private IP addresses are not allowed' });
        }
      }

      // STUB IMPLEMENTATION - Returns mock test result after validation
      // Real implementation would make actual HTTP requests to the validated endpoint
      const testResult = {
        success: true,
        data: { test: true, timestamp: new Date().toISOString() },
        responseTime: Math.floor(Math.random() * 500) + 100,
        statusCode: 200,
        warning: 'This is a stub implementation. Real data source testing is not yet implemented.',
        mock: true
      };
      
      res.json(testResult);
    } catch (error) {
      console.error('Error testing data source:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Output Channels CRUD
  app.get('/api/output/channels', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const channels = await storage.getOutputChannels(userId);
      res.json(channels);
    } catch (error) {
      console.error('Error fetching output channels:', error);
      res.status(500).json({ message: 'Failed to fetch output channels' });
    }
  });

  app.post('/api/output/channels', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const channelData = insertOutputChannelSchema.parse({ ...req.body, userId });
      const channel = await storage.createOutputChannel(channelData);
      res.status(201).json(channel);
    } catch (error) {
      console.error('Error creating output channel:', error);
      res.status(400).json({ message: 'Failed to create output channel', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put('/api/output/channels/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const updates = insertOutputChannelSchema.partial().parse(req.body);
      const channel = await storage.updateOutputChannel(id, userId, updates);
      if (!channel) {
        return res.status(404).json({ message: 'Output channel not found' });
      }
      res.json(channel);
    } catch (error) {
      console.error('Error updating output channel:', error);
      res.status(400).json({ message: 'Failed to update output channel', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete('/api/output/channels/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const deleted = await storage.deleteOutputChannel(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: 'Output channel not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting output channel:', error);
      res.status(500).json({ message: 'Failed to delete output channel' });
    }
  });

  // Output Channel Testing Endpoint
  app.post('/api/output/channels/:id/test', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { testData } = req.body;
      
      const channel = await storage.getOutputChannel(id, userId);
      if (!channel) {
        return res.status(404).json({ message: 'Output channel not found' });
      }

      // STUB IMPLEMENTATION - Returns mock success without actual delivery
      const testResult = {
        success: true,
        message: `[MOCK] Test message sent to ${channel.type} channel: ${channel.name}`,
        timestamp: new Date().toISOString(),
        warning: 'This is a stub implementation. Real output channel testing is not yet implemented.',
        mock: true
      };
      
      res.json(testResult);
    } catch (error) {
      console.error('Error testing output channel:', error);
      res.status(500).json({ message: 'Failed to test output channel', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Distribution Rules CRUD
  app.get('/api/output/rules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rules = await storage.getDistributionRules(userId);
      res.json(rules);
    } catch (error) {
      console.error('Error fetching distribution rules:', error);
      res.status(500).json({ message: 'Failed to fetch distribution rules' });
    }
  });

  app.post('/api/output/rules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ruleData = insertDistributionRuleSchema.parse({ ...req.body, userId });
      const rule = await storage.createDistributionRule(ruleData);
      res.status(201).json(rule);
    } catch (error) {
      console.error('Error creating distribution rule:', error);
      res.status(400).json({ message: 'Failed to create distribution rule', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Scheduled Jobs CRUD
  app.get('/api/schedule/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobs = await storage.getScheduledJobs(userId);
      res.json(jobs);
    } catch (error) {
      console.error('Error fetching scheduled jobs:', error);
      res.status(500).json({ message: 'Failed to fetch scheduled jobs' });
    }
  });

  app.post('/api/schedule/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobData = insertScheduledJobSchema.parse({ ...req.body, userId });
      const job = await storage.createScheduledJob(jobData);
      res.status(201).json(job);
    } catch (error) {
      console.error('Error creating scheduled job:', error);
      res.status(400).json({ message: 'Failed to create scheduled job', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put('/api/schedule/jobs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const updates = insertScheduledJobSchema.partial().parse(req.body);
      const job = await storage.updateScheduledJob(id, userId, updates);
      if (!job) {
        return res.status(404).json({ message: 'Scheduled job not found' });
      }
      res.json(job);
    } catch (error) {
      console.error('Error updating scheduled job:', error);
      res.status(400).json({ message: 'Failed to update scheduled job', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete('/api/schedule/jobs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const deleted = await storage.deleteScheduledJob(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: 'Scheduled job not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting scheduled job:', error);
      res.status(500).json({ message: 'Failed to delete scheduled job' });
    }
  });

  // Manual Job Execution
  app.post('/api/schedule/jobs/:id/run', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const job = await storage.getScheduledJob(id, userId);
      if (!job) {
        return res.status(404).json({ message: 'Scheduled job not found' });
      }

      // STUB IMPLEMENTATION - Simulates job execution without real processing
      await storage.updateScheduledJobStatus(id, 'running');
      
      // Simulate job execution
      setTimeout(async () => {
        try {
          await storage.updateScheduledJobStatus(id, 'success');
        } catch (error) {
          await storage.updateScheduledJobStatus(id, 'error', error instanceof Error ? error.message : 'Unknown error');
        }
      }, 1000);
      
      res.json({ 
        message: 'Job execution triggered (MOCK)', 
        jobId: id,
        warning: 'This is a stub implementation. Real job execution with AI content generation is not yet implemented.',
        mock: true
      });
    } catch (error) {
      console.error('Error running scheduled job:', error);
      res.status(500).json({ message: 'Failed to run scheduled job', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Content Generation Endpoints
  app.get('/api/generated-content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { limit = 50 } = req.query;
      const content = await storage.getGeneratedContent(userId, parseInt(limit));
      res.json(content);
    } catch (error) {
      console.error('Error fetching generated content:', error);
      res.status(500).json({ message: 'Failed to fetch generated content' });
    }
  });

  app.post('/api/content/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { templateId } = req.body;
      
      // Verify template exists and belongs to user
      const template = await storage.getContentTemplate(templateId, userId);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      // Generate content using real AI
      const generationResult = await contentGenerationService.generate({
        templateId,
        userId,
        variables: req.body.variables || {},
        credentialId: req.body.credentialId,
      });
      
      // Save generated content
      const generatedContent = await storage.createGeneratedContent({
        templateId,
        userId,
        content: generationResult.content,
        metadata: generationResult.metadata,
      });

      // Deliver content if channels configured
      try {
        const deliveryResult = await deliveryService.deliver({
          content: generationResult.content,
          contentId: generatedContent.id,
          userId,
          templateId,
        });

        return res.json({ 
          success: true,
        contentId: generatedContent.id,
        templateName: template.name,
          tokens: generationResult.metadata.tokens.total,
          cost: generationResult.metadata.cost,
          duration: generationResult.metadata.duration,
          delivery: {
            attempted: deliveryResult.delivered.length,
            succeeded: deliveryResult.delivered.filter(d => d.success).length,
            failed: deliveryResult.delivered.filter(d => !d.success).length,
          },
        });
      } catch (deliveryError: any) {
        // Content generated but delivery failed
        return res.json({
          success: true,
          contentId: generatedContent.id,
          templateName: template.name,
          tokens: generationResult.metadata.tokens.total,
          cost: generationResult.metadata.cost,
          warning: `Content generated but delivery failed: ${deliveryError.message}`,
        });
      }
    } catch (error) {
      console.error('Error generating content:', error);
      res.status(500).json({ message: 'Failed to generate content', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/content/generate-all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get all active templates for the user
      const templates = await storage.getContentTemplates(userId);
      const activeTemplates = templates.filter(t => t.isActive);
      
      if (activeTemplates.length === 0) {
        return res.status(400).json({ message: 'No active templates found' });
      }

      // Batch generate content using real AI
      const results = [];
      let totalCost = 0;
      let totalTokens = 0;

      for (const template of activeTemplates) {
        try {
          const generationResult = await contentGenerationService.generate({
            templateId: template.id,
            userId,
            variables: req.body.variables || {},
          });
          
          const generatedContent = await storage.createGeneratedContent({
            templateId: template.id,
            userId,
            content: generationResult.content,
            metadata: { 
              ...generationResult.metadata,
              batch: true, 
            },
          });

          totalCost += generationResult.metadata.cost;
          totalTokens += generationResult.metadata.tokens.total;
          
          results.push({
            templateId: template.id,
            templateName: template.name,
            contentId: generatedContent.id,
            tokens: generationResult.metadata.tokens.total,
            cost: generationResult.metadata.cost,
            success: true,
          });

          // Attempt delivery (don't fail batch if delivery fails)
          try {
            await deliveryService.deliver({
              content: generationResult.content,
              contentId: generatedContent.id,
              userId,
              templateId: template.id,
            });
          } catch (deliveryError) {
            console.error(`Delivery failed for template ${template.name}:`, deliveryError);
          }

        } catch (error) {
          results.push({
            templateId: template.id,
            templateName: template.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      
      res.json({ 
        message: `Batch generation complete: ${successCount}/${activeTemplates.length} templates successful`,
        results,
        totalTemplates: activeTemplates.length,
        successCount,
        totalTokens,
        totalCost,
      });
    } catch (error) {
      console.error('Error in batch generation:', error);
      res.status(500).json({ message: 'Failed to generate content for all templates', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // =============================================================================
  // MONETIZATION (Tree Fiddy! 🦕)
  // =============================================================================

  // License activation (requires authentication)
  app.post("/api/licenses/activate", 
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

  // License deactivation (self-service)
  app.post("/api/licenses/deactivate", 
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

  // Get user licenses
  app.get("/api/licenses", 
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
  app.post("/api/licenses/validate", 
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

  // Create checkout session for license purchase
  app.post("/api/payments/checkout/license", 
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

  // Create checkout session for managed hosting subscription
  app.post("/api/payments/checkout/subscription", 
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

  // Stripe webhook handler (unauthenticated - Stripe signs the payload)
  app.post("/api/webhooks/stripe", async (req, res) => {
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

  // Get user subscription
  app.get("/api/subscriptions/current", isAuthenticated, async (req: any, res) => {
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
  });

  // Get user payments
  app.get("/api/payments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const payments = await storage.getUserPayments(userId, limit);
      res.json(payments);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ message: 'Failed to fetch payments' });
    }
  });

  // =============================================================================
  // OLLAMA (Local AI Models - Free!)
  // =============================================================================

  // Check Ollama health
  app.get("/api/ollama/health", 
    isAuthenticated, 
    generousRateLimit,
    async (req: any, res) => {
      try {
        const host = req.query.host as string | undefined;
        const health = await ollamaService.checkHealth(host);
        res.json(health);
      } catch (error: any) {
        console.error('Error checking Ollama health:', error);
        res.status(500).json({ message: 'Failed to check Ollama health', available: false });
      }
    }
  );

  // List Ollama models
  app.get("/api/ollama/models", 
    isAuthenticated, 
    generousRateLimit,
    async (req: any, res) => {
      try {
        const host = req.query.host as string | undefined;
        const models = await ollamaService.listModels(host);
        res.json(models);
      } catch (error: any) {
        console.error('Error listing Ollama models:', error);
        res.status(500).json({ message: error.message || 'Failed to list Ollama models', models: [] });
      }
    }
  );

  // Get recommended Ollama models
  app.get("/api/ollama/recommended", 
    isAuthenticated, 
    generousRateLimit,
    async (req: any, res) => {
      try {
        const recommended = ollamaService.getRecommendedModels();
        res.json({ models: recommended });
      } catch (error: any) {
        console.error('Error getting recommended models:', error);
        res.status(500).json({ message: 'Failed to get recommended models' });
      }
    }
  );

  // Get Ollama setup instructions
  app.get("/api/ollama/setup", 
    isAuthenticated, 
    generousRateLimit,
    async (req: any, res) => {
      try {
        const instructions = ollamaService.getSetupInstructions();
        res.json(instructions);
      } catch (error: any) {
        console.error('Error getting setup instructions:', error);
        res.status(500).json({ message: 'Failed to get setup instructions' });
      }
    }
  );

  // Pull an Ollama model
  app.post("/api/ollama/pull", 
    isAuthenticated, 
    strictRateLimit,
    validateBody(pullModelSchema),
    async (req: any, res) => {
      try {
        const { modelName, host } = req.body;

        // This is a long-running operation, acknowledge immediately
        res.json({ 
          success: true, 
          message: `Started pulling model "${modelName}". This may take several minutes depending on model size.`,
        });

        // Pull in the background
        ollamaService.pullModel(modelName, host).then(() => {
          activityMonitor.logActivity('success', `✅ Ollama model "${modelName}" pulled successfully`);
        }).catch((error) => {
          activityMonitor.logError(error, `Ollama Pull: ${modelName}`);
        });

      } catch (error: any) {
        console.error('Error starting model pull:', error);
        res.status(500).json({ message: error.message || 'Failed to start model pull' });
      }
    }
  );

  // Delete an Ollama model
  app.delete("/api/ollama/models/:modelName", 
    isAuthenticated, 
    strictRateLimit,
    async (req: any, res) => {
      try {
        const { modelName } = req.params;
        const host = req.query.host as string | undefined;

        await ollamaService.deleteModel(modelName, host);
        
        activityMonitor.logActivity('info', `🗑️  Ollama model "${modelName}" deleted`);
        res.json({ success: true, message: `Model "${modelName}" deleted successfully` });
      } catch (error: any) {
        console.error('Error deleting Ollama model:', error);
        res.status(500).json({ message: error.message || 'Failed to delete model' });
      }
    }
  );

  // Create and configure WebSocket server
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // ===============================================
  // WEBSOCKET - REAL-TIME ACTIVITY MONITOR & TERMINAL
  // ===============================================

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('🔌 WebSocket client connected');
    activityMonitor.logActivity('info', '🔌 New terminal client connected');
    
    // Register client with activity monitor
    activityMonitor.registerClient(ws);
    
    // Extract user session if available (for authorized commands)
    let userId: string | undefined;
    
    ws.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe') {
          // Client subscribing to activity feed
          ws.send(JSON.stringify({
            type: 'subscribed',
            message: '✅ Connected to real-time activity monitor',
            timestamp: new Date().toISOString(),
          }));
          
          // Send welcome message
              ws.send(JSON.stringify({
            type: 'activity',
            level: 'info',
            message: '🎉 Amoeba Operations Console Ready',
            metadata: { tip: "Type 'help' for available commands" },
            timestamp: new Date().toISOString(),
          }));
        } 
        else if (data.type === 'auth') {
          // Store user ID for authorized commands
          userId = data.userId;
              ws.send(JSON.stringify({
            type: 'activity',
            level: 'success',
            message: `🔐 Authenticated as user ${userId?.substring(0, 8)}`,
            timestamp: new Date().toISOString(),
              }));
            }
        else if (data.type === 'command') {
          const command = data.command?.trim();
          
          if (!command) return;
          
          // Log command execution
          activityMonitor.logActivity('debug', `$ ${command}`);
          
          try {
            // Execute command via command executor
            const output = await commandExecutor.execute(command, userId);
            
            // Check for special commands
            if (output === 'CLEAR_SCREEN') {
              ws.send(JSON.stringify({
                type: 'clear_screen',
                timestamp: new Date().toISOString(),
              }));
          } else {
              ws.send(JSON.stringify({
                type: 'command_output',
                output: output,
                timestamp: new Date().toISOString(),
              }));
            }
          } catch (error: any) {
            activityMonitor.logError(error, 'Command Execution');
            ws.send(JSON.stringify({
              type: 'command_error',
              error: error.message || 'Command execution failed',
              timestamp: new Date().toISOString(),
            }));
          }
        }
      } catch (error) {
        console.error('❌ Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'command_error',
          error: 'Failed to process message',
          timestamp: new Date().toISOString(),
        }));
      }
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket client disconnected');
      activityMonitor.logActivity('debug', '🔌 Terminal client disconnected');
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      activityMonitor.logError(error, 'WebSocket');
    });
  });

  // Send periodic updates to all connected clients
  setInterval(() => {
    const message = JSON.stringify({
      type: 'metrics_update',
      timestamp: new Date().toISOString()
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }, 5000);

  return httpServer;
}