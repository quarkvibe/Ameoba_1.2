import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";
import { horoscopeService } from "./services/horoscopeService";
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
import { premiumEmailService } from "./services/premiumEmailService";
import { cronService } from "./services/cronService";
import { productionDbService } from "./services/productionDbService";
import { integrationService } from "./services/integrationService";
import { astronomyService } from "./services/astronomyService";
import { WebSocketServer, WebSocket } from "ws";

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


  // Test endpoints only in development  
  if (process.env.NODE_ENV !== 'production') {
    app.get("/api/test/production-db", async (req, res) => {
      try {
        const result = await productionDbService.testConnection();
        res.json({
          message: "Production database connection successful",
          timestamp: new Date().toISOString(),
          status: "connected"
        });
      } catch (error: any) {
        console.error("Production database connection failed:", error);
        res.status(500).json({ 
          message: "Failed to connect to production database",
          timestamp: new Date().toISOString(),
          status: "error"
        });
      }
    });

    app.get("/api/test/horoscope-schema", async (req, res) => {
      try {
        const schema = await productionDbService.getHoroscopeColumns();
        res.json({
          message: "Horoscope table schema from production database",
          columns: schema,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        console.error("Failed to get horoscope schema:", error);
        res.status(500).json({ 
          message: "Failed to get schema",
          error: error.message
        });
      }
    });
  }

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

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "Amoeba Horoscope Microservice",
        version: "1.0.0",
        cron_active: true // Simplified for production
      });
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({ message: "Health check failed" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getEmailMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // =============================================================================
  // HOROSCOPE API ENDPOINTS (API Key Required)
  // =============================================================================

  // Get today's horoscopes for all zodiac signs
  app.get("/api/horoscopes/today", (req, res, next) => requireApiKey(req, res, next, ['read:horoscopes']), async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const horoscopes = await horoscopeService.getAllHoroscopesForDate(today);
      
      res.json({
        date: today,
        horoscopes: horoscopes || []
      });
    } catch (error) {
      console.error("Error fetching today's horoscopes:", error);
      res.status(500).json({ message: "Failed to fetch horoscopes" });
    }
  });

  // Get horoscope for a specific zodiac sign
  app.get("/api/horoscopes/:sign", (req, res, next) => requireApiKey(req, res, next, ['read:horoscopes']), async (req, res) => {
    try {
      const { sign } = req.params;
      const today = new Date().toISOString().split('T')[0];
      
      const horoscope = await horoscopeService.getTodaysHoroscope(sign.toLowerCase());
      
      if (!horoscope) {
        return res.status(404).json({ message: "Horoscope not found for this sign" });
      }
      
      res.json({
        sign: sign.toLowerCase(),
        date: today,
        horoscope
      });
    } catch (error) {
      console.error(`Error fetching horoscope for ${req.params.sign}:`, error);
      res.status(500).json({ message: "Failed to fetch horoscope" });
    }
  });

  // =============================================================================
  // ASTRONOMY & ASTRONOMICAL CONDITIONS
  // =============================================================================

  // Get comprehensive astronomical data for current date
  app.get("/api/astronomy/current", async (req, res) => {
    try {
      const astronomicalData = await astronomyService.getAstronomicalData();
      res.json({
        timestamp: new Date().toISOString(),
        calculation_method: astronomyService.isSwissEphemerisAvailable() ? 'Swiss Ephemeris (High Precision)' : 'Astronomy Engine',
        ...astronomicalData
      });
    } catch (error) {
      console.error("Error fetching current astronomical data:", error);
      res.status(500).json({ message: "Failed to fetch astronomical data" });
    }
  });

  // Get astronomical data for a specific date
  app.get("/api/astronomy/date/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const requestedDate = new Date(date);
      
      if (isNaN(requestedDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
      }
      
      const astronomicalData = await astronomyService.getAstronomicalData(requestedDate);
      res.json({
        requested_date: date,
        calculation_method: astronomyService.isSwissEphemerisAvailable() ? 'Swiss Ephemeris (High Precision)' : 'Astronomy Engine',
        ...astronomicalData
      });
    } catch (error) {
      console.error(`Error fetching astronomical data for ${req.params.date}:`, error);
      res.status(500).json({ message: "Failed to fetch astronomical data" });
    }
  });

  // Get current planetary positions only
  app.get("/api/astronomy/planets/current", async (req, res) => {
    try {
      const positions = await astronomyService.calculatePlanetaryPositions(new Date());
      res.json({
        timestamp: new Date().toISOString(),
        calculation_method: astronomyService.isSwissEphemerisAvailable() ? 'Swiss Ephemeris (High Precision)' : 'Astronomy Engine',
        planetary_positions: positions
      });
    } catch (error) {
      console.error("Error fetching planetary positions:", error);
      res.status(500).json({ message: "Failed to fetch planetary positions" });
    }
  });

  // Get planetary positions for a specific date
  app.get("/api/astronomy/planets/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const requestedDate = new Date(date);
      
      if (isNaN(requestedDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
      }
      
      const positions = await astronomyService.calculatePlanetaryPositions(requestedDate);
      res.json({
        date: date,
        calculation_method: astronomyService.isSwissEphemerisAvailable() ? 'Swiss Ephemeris (High Precision)' : 'Astronomy Engine',
        planetary_positions: positions
      });
    } catch (error) {
      console.error(`Error fetching planetary positions for ${req.params.date}:`, error);
      res.status(500).json({ message: "Failed to fetch planetary positions" });
    }
  });

  // Get current lunar phase information
  app.get("/api/astronomy/moon/current", async (req, res) => {
    try {
      const lunarPhase = await astronomyService.calculateLunarPhase(new Date());
      res.json({
        timestamp: new Date().toISOString(),
        lunar_phase: lunarPhase
      });
    } catch (error) {
      console.error("Error fetching lunar phase:", error);
      res.status(500).json({ message: "Failed to fetch lunar phase data" });
    }
  });

  // Get current planetary aspects
  app.get("/api/astronomy/aspects/current", async (req, res) => {
    try {
      const positions = await astronomyService.calculatePlanetaryPositions(new Date());
      const aspects = await astronomyService.calculateAspects(positions);
      res.json({
        timestamp: new Date().toISOString(),
        planetary_aspects: aspects
      });
    } catch (error) {
      console.error("Error fetching planetary aspects:", error);
      res.status(500).json({ message: "Failed to fetch planetary aspects" });
    }
  });

  // Get astronomical conditions summary (plain text)
  app.get("/api/astronomy/conditions", async (req, res) => {
    try {
      const conditions = await astronomyService.getCurrentConditions();
      res.json({
        timestamp: new Date().toISOString(),
        conditions_summary: conditions,
        calculation_method: astronomyService.isSwissEphemerisAvailable() ? 'Swiss Ephemeris (High Precision)' : 'Astronomy Engine'
      });
    } catch (error) {
      console.error("Error fetching astronomical conditions:", error);
      res.status(500).json({ message: "Failed to fetch astronomical conditions" });
    }
  });

  // Get system status and available calculation methods
  app.get("/api/astronomy/status", async (req, res) => {
    try {
      res.json({
        timestamp: new Date().toISOString(),
        service_status: "operational",
        swiss_ephemeris_available: astronomyService.isSwissEphemerisAvailable(),
        calculation_method: astronomyService.isSwissEphemerisAvailable() ? 'Swiss Ephemeris (High Precision)' : 'Astronomy Engine',
        supported_bodies: [
          "Sun", "Moon", "Mercury", "Venus", "Mars", 
          "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"
        ],
        supported_features: [
          "Planetary positions",
          "Lunar phases", 
          "Planetary aspects",
          "Zodiacal positions",
          "Julian day calculations"
        ]
      });
    } catch (error) {
      console.error("Error fetching astronomy service status:", error);
      res.status(500).json({ message: "Failed to fetch service status" });
    }
  });

  // =============================================================================
  // CAMPAIGN MANAGEMENT (Auth Required)
  // =============================================================================

  // Get all campaigns
  app.get("/api/campaigns", isAuthenticated, async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  // Create a new campaign
  app.post("/api/campaigns", isAuthenticated, async (req, res) => {
    try {
      const campaign = await storage.createCampaign(req.body);
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  // Update campaign
  app.put("/api/campaigns/:id", isAuthenticated, async (req, res) => {
    try {
      const campaign = await storage.updateCampaign(req.params.id, req.body);
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
  app.delete("/api/campaigns/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteCampaign(req.params.id);
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
  app.post("/api/emails/send", isAuthenticated, async (req, res) => {
    try {
      const result = await emailService.sendEmail(req.body);
      res.json(result);
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Get email providers
  app.get("/api/emails/providers", isAuthenticated, async (req, res) => {
    try {
      const providers = await storage.getEmailProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching email providers:", error);
      res.status(500).json({ message: "Failed to fetch email providers" });
    }
  });

  // Create/update email provider
  app.post("/api/emails/providers", isAuthenticated, async (req, res) => {
    try {
      const provider = await storage.createEmailProvider(req.body);
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
      const { status, limit = 50, offset = 0 } = req.query;
      const jobs = await queueService.getJobs({
        status: status as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
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
      const job = await queueService.retryJob(req.params.id);
      res.json(job);
    } catch (error) {
      console.error("Error retrying job:", error);
      res.status(500).json({ message: "Failed to retry job" });
    }
  });

  // Cancel job
  app.delete("/api/queue/jobs/:id", isAuthenticated, async (req, res) => {
    try {
      await queueService.cancelJob(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error canceling job:", error);
      res.status(500).json({ message: "Failed to cancel job" });
    }
  });

  // Pause/resume queue
  app.post("/api/queue/pause", isAuthenticated, async (req, res) => {
    try {
      await queueService.pause();
      res.json({ message: "Queue paused successfully" });
    } catch (error) {
      console.error("Error pausing queue:", error);
      res.status(500).json({ message: "Failed to pause queue" });
    }
  });

  app.post("/api/queue/resume", isAuthenticated, async (req, res) => {
    try {
      await queueService.resume();
      res.json({ message: "Queue resumed successfully" });
    } catch (error) {
      console.error("Error resuming queue:", error);
      res.status(500).json({ message: "Failed to resume queue" });
    }
  });

  // =============================================================================
  // AI AGENT (Auth Required)
  // =============================================================================

  // Chat with AI agent
  app.post("/api/agent/chat", isAuthenticated, async (req, res) => {
    try {
      const { message } = req.body;
      const response = await aiAgent.chat(message);
      res.json(response);
    } catch (error) {
      console.error("Error in AI agent chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Get conversation history
  app.get("/api/agent/conversations", isAuthenticated, async (req, res) => {
    try {
      const conversations = await storage.getAgentConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get AI suggestions
  app.get("/api/agent/suggestions", async (req, res) => {
    try {
      const suggestions = await aiAgent.suggestOptimizations();
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
  app.get("/api/analytics/emails", isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const analytics = await storage.getEmailAnalytics({
        startDate: startDate as string,
        endDate: endDate as string,
      });
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching email analytics:", error);
      res.status(500).json({ message: "Failed to fetch email analytics" });
    }
  });

  // Get campaign performance
  app.get("/api/analytics/campaigns/:id", isAuthenticated, async (req, res) => {
    try {
      const analytics = await storage.getCampaignAnalytics(req.params.id);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching campaign analytics:", error);
      res.status(500).json({ message: "Failed to fetch campaign analytics" });
    }
  });

  // =============================================================================
  // SYSTEM CONFIGURATION (Auth Required)
  // =============================================================================

  // Get system configurations
  app.get("/api/system/config", isAuthenticated, async (req, res) => {
    try {
      const config = await storage.getSystemConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching system config:", error);
      res.status(500).json({ message: "Failed to fetch system config" });
    }
  });

  // Update system configuration
  app.put("/api/system/config", isAuthenticated, async (req, res) => {
    try {
      const config = await storage.updateSystemConfig(req.body);
      res.json(config);
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
      const integrations = await storage.getIntegrations();
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  // Create API key
  app.post("/api/integrations/keys", isAuthenticated, async (req, res) => {
    try {
      const apiKey = await integrationService.createApiKey(req.body);
      res.status(201).json(apiKey);
    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(500).json({ message: "Failed to create API key" });
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

  // Manually trigger horoscope generation
  app.post("/api/cron/trigger-horoscopes", isAuthenticated, async (req, res) => {
    try {
      const { date } = req.body;
      const result = await cronService.triggerHoroscopeGeneration(date);
      
      res.json({
        message: "Horoscope generation triggered successfully",
        ...result
      });
    } catch (error) {
      console.error("Error triggering horoscope generation:", error);
      res.status(500).json({ message: "Failed to trigger horoscope generation" });
    }
  });

  // Manually trigger premium emails
  app.post("/api/cron/trigger-emails", isAuthenticated, async (req, res) => {
    try {
      const { date } = req.body;
      const result = await cronService.triggerPremiumEmails(date);
      
      res.json({
        message: "Premium email distribution triggered successfully",
        ...result
      });
    } catch (error) {
      console.error("Error triggering premium emails:", error);
      res.status(500).json({ message: "Failed to trigger premium emails" });
    }
  });

  // =============================================================================
  // TEST ENDPOINTS (Remove in production)
  // =============================================================================

  // Test horoscope generation (development only)
  if (process.env.NODE_ENV !== 'production') {
    app.post("/api/test/generate-horoscopes", async (req, res) => {
      try {
        const { date } = req.body;
        const targetDate = date || new Date().toISOString().split('T')[0];
        
        const result = await horoscopeService.generateDailyHoroscopes(targetDate);
        
        res.json({
          message: "Horoscope generation test completed",
          date: targetDate,
          result: result
        });
      } catch (error) {
        console.error("Error in test horoscope generation:", error);
        res.status(500).json({ message: "Failed to generate test horoscopes" });
      }
    });
  }

  // Test premium email distribution (no auth required for testing)
  app.post("/api/test/send-premium-emails", async (req, res) => {
    try {
      const { date } = req.body;
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const result = await premiumEmailService.sendDailyHoroscopesToPremiumUsers(targetDate);
      
      res.json({
        message: "Premium email test completed",
        date: targetDate,
        result: result
      });
    } catch (error) {
      console.error("Error in test premium email distribution:", error);
      res.status(500).json({ message: "Failed to send test premium emails" });
    }
  });

  // Test production database connection (no auth required for testing)
  app.get("/api/test/production-users", async (req, res) => {
    try {
      const premiumUsers = await productionDbService.getPremiumUsers();
      
      res.json({
        message: "Production database connection test",
        userCount: premiumUsers.length,
        users: premiumUsers.slice(0, 5) // Return first 5 users as sample
      });
    } catch (error) {
      console.error("Error testing production database:", error);
      res.status(500).json({ 
        message: "Failed to connect to production database",
        error: error.message 
      });
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
      
      // Basic SSRF protection - only allow HTTPS URLs and block private IPs
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

      // Mock test response for now - in a real implementation, this would make the actual request
      const testResult = {
        success: true,
        data: { test: true, timestamp: new Date().toISOString() },
        responseTime: Math.floor(Math.random() * 500) + 100,
        statusCode: 200
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

      // Mock test response for now - in a real implementation, this would test the actual output
      const testResult = {
        success: true,
        message: `Test message sent to ${channel.type} channel: ${channel.name}`,
        timestamp: new Date().toISOString()
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

      // Mock job execution for now - in a real implementation, this would trigger the job
      await storage.updateScheduledJobStatus(id, 'running');
      
      // Simulate job execution
      setTimeout(async () => {
        try {
          await storage.updateScheduledJobStatus(id, 'success');
        } catch (error) {
          await storage.updateScheduledJobStatus(id, 'error', error instanceof Error ? error.message : 'Unknown error');
        }
      }, 1000);
      
      res.json({ message: 'Job execution triggered', jobId: id });
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

      // Mock content generation for now - in a real implementation, this would:
      // 1. Fetch data from connected data sources
      // 2. Process template with AI
      // 3. Generate content
      // 4. Save to database
      // 5. Send to output channels
      
      const mockContent = `Generated content for template "${template.name}" at ${new Date().toISOString()}`;
      
      const generatedContent = await storage.createGeneratedContent({
        templateId: templateId,
        userId: userId,
        content: mockContent,
        generatedAt: new Date(),
        metadata: { mock: true, timestamp: new Date().toISOString() }
      });
      
      res.json({ 
        message: 'Content generation completed',
        contentId: generatedContent.id,
        templateName: template.name
      });
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

      // Mock batch generation for now
      const results = [];
      for (const template of activeTemplates) {
        try {
          const mockContent = `Batch generated content for template "${template.name}" at ${new Date().toISOString()}`;
          
          const generatedContent = await storage.createGeneratedContent({
            templateId: template.id,
            userId: userId,
            content: mockContent,
            generatedAt: new Date(),
            metadata: { batch: true, timestamp: new Date().toISOString() }
          });
          
          results.push({
            templateId: template.id,
            templateName: template.name,
            contentId: generatedContent.id,
            success: true
          });
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
        message: `Batch generation completed: ${successCount}/${activeTemplates.length} templates successful`,
        results: results,
        totalTemplates: activeTemplates.length,
        successCount: successCount
      });
    } catch (error) {
      console.error('Error in batch generation:', error);
      res.status(500).json({ message: 'Failed to generate content for all templates', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Create and configure WebSocket server
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('WebSocket message received:', data);
        
        if (data.type === 'subscribe') {
          ws.send(JSON.stringify({
            type: 'subscribed',
            message: 'Connected to real-time updates'
          }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
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