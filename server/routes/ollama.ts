import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { strictRateLimit, generousRateLimit } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validation';
import { pullModelSchema } from '../validation/ollama';
import { ollamaService } from '../services/ollamaService';
import { activityMonitor } from '../services/activityMonitor';

/**
 * OLLAMA ROUTES (Local AI Models - Free!)
 * Manages local Ollama installation and model library
 */

export function registerOllamaRoutes(router: Router) {
  
  // Check Ollama health (is it running?)
  router.get('/ollama/health', 
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

  // List installed Ollama models
  router.get('/ollama/models', 
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

  // Get recommended models for Amoeba
  router.get('/ollama/recommended', 
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
  router.get('/ollama/setup', 
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

  // Pull an Ollama model (long-running background operation)
  router.post('/ollama/pull', 
    isAuthenticated, 
    strictRateLimit,
    validateBody(pullModelSchema),
    async (req: any, res) => {
      try {
        const { modelName, host } = req.body;

        // Acknowledge immediately (this takes minutes)
        res.json({ 
          success: true, 
          message: `Started pulling model "${modelName}". This may take several minutes depending on model size.`,
        });

        // Pull in background, log to terminal
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
  router.delete('/ollama/models/:modelName', 
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
}




