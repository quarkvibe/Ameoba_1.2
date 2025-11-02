import type { Express } from "express";
import { aiCodeModificationService } from "../services/aiCodeModificationService";
import { strictRateLimit } from "../middleware/rateLimiter";

/**
 * Code Modification Routes
 * 
 * Handles AI-powered code modifications with safety boundaries
 * 
 * CRITICAL SAFETY RULE:
 * AI can modify code, but CANNOT modify:
 * - This code modification system itself
 * - Security/authentication
 * - Encryption
 * - Core database
 * 
 * This prevents recursive self-modification and security bypasses
 */

export function registerCodeModificationRoutes(app: Express) {
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
  };

  /**
   * Generate code changes from natural language intent
   * POST /api/code-modification/generate
   */
  app.post('/api/code-modification/generate', isAuthenticated, strictRateLimit, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { intent, approvalRequired = true } = req.body;
      
      if (!intent) {
        return res.status(400).json({
          success: false,
          error: 'intent is required',
        });
      }
      
      const result = await aiCodeModificationService.processModificationRequest({
        intent,
        userId,
        approvalRequired,
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Apply approved changes
   * POST /api/code-modification/apply
   */
  app.post('/api/code-modification/apply', isAuthenticated, strictRateLimit, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { changes } = req.body;
      
      if (!changes || !Array.isArray(changes)) {
        return res.status(400).json({
          success: false,
          error: 'changes array is required',
        });
      }
      
      // Validate all changes before applying
      for (const change of changes) {
        if (aiCodeModificationService.isProtected(change.file)) {
          return res.status(403).json({
            success: false,
            error: `File is protected and cannot be modified: ${change.file}`,
          });
        }
      }
      
      // Apply changes
      // Note: In production, this would actually apply the changes
      // For now, just acknowledge
      
      res.json({
        success: true,
        appliedCount: changes.length,
        message: 'Changes would be applied (feature in development)',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Get protected files list
   * GET /api/code-modification/protected-files
   */
  app.get('/api/code-modification/protected-files', isAuthenticated, async (req: any, res) => {
    try {
      const protectedFiles = aiCodeModificationService.getProtectedFiles();
      const allowedDirs = aiCodeModificationService.getAllowedDirectories();
      
      res.json({
        success: true,
        protectedFiles,
        allowedDirectories: allowedDirs,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * List backups
   * GET /api/code-modification/backups
   */
  app.get('/api/code-modification/backups', isAuthenticated, async (req: any, res) => {
    try {
      const backups = await aiCodeModificationService.listBackups();
      
      res.json({
        success: true,
        backups,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Rollback to backup
   * POST /api/code-modification/rollback
   */
  app.post('/api/code-modification/rollback', isAuthenticated, strictRateLimit, async (req: any, res) => {
    try {
      const { backupTimestamp } = req.body;
      
      if (!backupTimestamp) {
        return res.status(400).json({
          success: false,
          error: 'backupTimestamp is required',
        });
      }
      
      await aiCodeModificationService.rollback(backupTimestamp);
      
      res.json({
        success: true,
        message: 'Rollback successful. Restart server for changes to take effect.',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
}

