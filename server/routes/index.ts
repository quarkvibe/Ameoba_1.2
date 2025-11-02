import { Express, Router } from 'express';
import { createServer, type Server } from 'http';
import { setupAuth } from '../replitAuth';
import { WebSocketServer, WebSocket } from 'ws';
import { activityMonitor } from '../services/activityMonitor';
import { commandExecutor } from '../services/commandExecutor';

// Import all route modules (organelles)
import { registerLicenseRoutes } from './licenses';
import { registerOllamaRoutes } from './ollama';
import { registerPaymentRoutes } from './payments';
import { registerWebhookRoutes } from './webhooks';
import { registerHealthRoutes } from './health';
import { registerSubscriptionRoutes } from './subscriptions';
import { registerAgentRoutes } from './agent';
import { registerContentRoutes } from './content';
import { registerTemplateRoutes } from './templates';
import { registerCredentialRoutes } from './credentials';
import { registerDataSourceRoutes } from './dataSources';
import { registerOutputRoutes } from './outputs';
import { registerScheduleRoutes } from './schedules';
import { registerDistributionRoutes } from './distributions';
import { registerUserRoutes } from './users';
import { registerApiKeyRoutes } from './apiKeys';
import { registerReviewRoutes } from './reviews';
import { registerEnvironmentRoutes } from './environment';
import { registerSMSCommandRoutes } from './smsCommands';
import { registerTestingRoutes } from './testing';
import { registerDeploymentRoutes } from './deployment';
import { registerCodeModificationRoutes } from './codeModification';

/**
 * ROUTE REGISTRY (Cell Nucleus)
 * Central coordinator for all route organelles
 * 
 * Each route module is an independent organelle (ribosome) that:
 * - Handles HTTP requests for its domain
 * - Contains ALL logic for that domain (CRUD, validation, error handling)
 * - Can be tested independently
 * - Can be evolved independently
 * 
 * This file coordinates them all into a cohesive organism.
 */

export function registerRoutes(app: Express): Server {
  // Set up authentication
  setupAuth(app);
  
  // Create API router
  const apiRouter = Router();
  
  // =============================================================================
  // REGISTER ALL ROUTE ORGANELLES
  // =============================================================================
  
  // Core functionality
  registerHealthRoutes(apiRouter);         // System health & readiness
  registerContentRoutes(apiRouter);        // Content generation (the "anything generator")
  registerTemplateRoutes(apiRouter);       // Content template management
  registerCredentialRoutes(apiRouter);     // BYOK credentials (AI + Email)
  registerReviewRoutes(apiRouter);         // Content review queue & approval workflow
  
  // Data flow & automation
  registerDataSourceRoutes(apiRouter);     // Input sources (RSS, API, Webhook, Static)
  registerOutputRoutes(apiRouter);         // Output channels (Email, Webhook, API, File)
  registerScheduleRoutes(apiRouter);       // Cron-based job scheduling
  registerDistributionRoutes(apiRouter);   // Intelligent routing rules
  
  // Monetization (Tree Fiddy! 🦕)
  registerLicenseRoutes(apiRouter);        // $3.50 lifetime licenses
  registerPaymentRoutes(apiRouter);        // Stripe checkout
  registerSubscriptionRoutes(apiRouter);   // Managed hosting subscriptions
  registerWebhookRoutes(apiRouter);        // External webhooks (Stripe, etc.)
  
  // AI & Automation
  registerAgentRoutes(apiRouter);          // AI Agent natural language control
  registerOllamaRoutes(apiRouter);         // Local AI model management
  
  // User & access management
  registerUserRoutes(apiRouter);           // User profile & settings
  registerApiKeyRoutes(apiRouter);         // Programmatic API access
  registerEnvironmentRoutes(apiRouter);    // Environment variable management (UI-based)
  registerSMSCommandRoutes(app);           // SMS command interface (webhook at root level)
  
  // Testing & diagnostics
  registerTestingRoutes(apiRouter);        // System testing, logs, diagnostics
  registerDeploymentRoutes(apiRouter);     // Deployment integration, DNS guidance
  registerCodeModificationRoutes(apiRouter); // AI code modification (Phase 3 - self-modifying AI)
  
  // =============================================================================
  // MOUNT API ROUTER
  // =============================================================================
  
  app.use('/api', apiRouter);
  
  // =============================================================================
  // WEBSOCKET - REAL-TIME ACTIVITY MONITOR & TERMINAL
  // =============================================================================
  
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
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
            message: 'Successfully subscribed to activity feed' 
          }));
        } 
        else if (data.type === 'command') {
          // Terminal command execution
          if (!userId) {
            // Extract userId from auth (if provided)
            userId = data.userId;
          }
          
          const command = data.command;
          
          try {
            const output = await commandExecutor.execute(command, userId);
            ws.send(JSON.stringify({ 
              type: 'command_output', 
              command, 
              output 
            }));
          } catch (error: any) {
            ws.send(JSON.stringify({ 
              type: 'command_error', 
              command, 
              error: error.message 
            }));
          }
        }
        else if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket client disconnected');
      activityMonitor.unregisterClient(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  return httpServer;
}

