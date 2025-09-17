import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";
import { horoscopeService } from "./services/horoscopeService";
import { queueService } from "./services/queueService";
import { emailService } from "./services/emailService";
import { aiAgent } from "./services/aiAgent";
import { premiumEmailService } from "./services/premiumEmailService";
import { cronService } from "./services/cronService";
import { productionDbService } from "./services/productionDbService";
import { integrationService } from "./services/integrationService";
import { astronomyService } from "./services/astronomyService";
import { WebSocketServer, WebSocket } from "ws";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);


  // Production database connection test (simple endpoint)
  app.get("/api/test/production-db", async (req, res) => {
    try {
      const result = await productionDbService.testConnection();
      res.json({
        message: "Production database connection successful",
        timestamp: new Date().toISOString(),
        database: result.database,
        host: result.host,
        status: "connected"
      });
    } catch (error: any) {
      console.error("Production database connection failed:", error);
      res.status(500).json({ 
        message: "Failed to connect to production database",
        error: error.message,
        timestamp: new Date().toISOString(),
        status: "error"
      });
    }
  });

  // Check horoscope table schema in production
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
        cron_active: cronService.isActive()
      });
    } catch (error) {
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
  // HOROSCOPE API ENDPOINTS (Public - No Auth Required)
  // =============================================================================

  // Get today's horoscopes for all zodiac signs
  app.get("/api/horoscopes/today", async (req, res) => {
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
  app.get("/api/horoscopes/:sign", async (req, res) => {
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

  // Test horoscope generation (no auth required for testing)
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