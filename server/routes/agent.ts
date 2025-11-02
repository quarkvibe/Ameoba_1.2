import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { standardRateLimit } from '../middleware/rateLimiter';
import { aiAgent } from '../services/aiAgent';

/**
 * AI AGENT ROUTES
 * Natural language control interface for platform
 */

export function registerAgentRoutes(router: Router) {
  
  // Chat with AI agent
  router.post('/agent/chat', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
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
    }
  );

  // Get agent conversation history
  router.get('/agent/history', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const limit = parseInt(req.query.limit as string) || 10;
        
        // TODO: Implement conversation history storage
        res.json({ 
          conversations: [],
          message: 'Conversation history coming soon' 
        });
      } catch (error) {
        console.error("Error fetching agent history:", error);
        res.status(500).json({ message: "Failed to fetch conversation history" });
      }
    }
  );
}




