import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { standardRateLimit, strictRateLimit } from '../middleware/rateLimiter';
import { storage } from '../storage';

/**
 * USER ROUTES
 * User profile and settings management
 */

export function registerUserRoutes(router: Router) {
  
  // Get current user profile
  router.get('/users/me', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          createdAt: user.createdAt,
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Failed to fetch user profile' });
      }
    }
  );

  // Update user profile
  router.put('/users/me', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { name, avatar } = req.body;
        
        const updatedUser = await storage.updateUser(userId, {
          name: name || undefined,
          avatar: avatar || undefined,
        });
        
        res.json({
          success: true,
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            avatar: updatedUser.avatar,
          },
        });
      } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Failed to update user profile' });
      }
    }
  );

  // Get user statistics
  router.get('/users/me/stats', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        
        const stats = await storage.getUserStats(userId);
        
        res.json({
          userId,
          templates: {
            total: stats.templateCount || 0,
            active: stats.activeTemplateCount || 0,
          },
          content: {
            generated: stats.contentGeneratedCount || 0,
            totalTokens: stats.totalTokens || 0,
            totalCost: stats.totalCost || 0,
          },
          schedules: {
            total: stats.scheduledJobCount || 0,
            active: stats.activeJobCount || 0,
            executions: stats.jobExecutionCount || 0,
          },
          dataSources: {
            total: stats.dataSourceCount || 0,
          },
          outputs: {
            total: stats.outputChannelCount || 0,
          },
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ message: 'Failed to fetch statistics' });
      }
    }
  );

  // Delete user account
  router.delete('/users/me', 
    isAuthenticated, 
    strictRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { confirm } = req.body;
        
        if (confirm !== 'DELETE') {
          return res.status(400).json({ 
            message: 'Confirmation required. Send { "confirm": "DELETE" } to proceed' 
          });
        }
        
        // Delete user and all related data (cascade delete)
        await storage.deleteUser(userId);
        
        res.json({ 
          success: true, 
          message: 'User account deleted' 
        });
      } catch (error) {
        console.error('Error deleting user account:', error);
        res.status(500).json({ message: 'Failed to delete user account' });
      }
    }
  );

  // Export user data (GDPR compliance)
  router.get('/users/me/export', 
    isAuthenticated, 
    strictRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        
        // Gather all user data
        const user = await storage.getUser(userId);
        const templates = await storage.getContentTemplates(userId, { includeInactive: true });
        const content = await storage.getGeneratedContent(userId, { limit: 1000 });
        const dataSources = await storage.getDataSources(userId, { includeInactive: true });
        const outputs = await storage.getOutputChannels(userId, { includeInactive: true });
        const schedules = await storage.getScheduledJobs(userId, { includeInactive: true });
        const licenses = await storage.getUserLicenses(userId);
        
        const exportData = {
          user: {
            id: user?.id,
            email: user?.email,
            name: user?.name,
            createdAt: user?.createdAt,
          },
          templates,
          generatedContent: content,
          dataSources,
          outputChannels: outputs,
          scheduledJobs: schedules,
          licenses,
          exportedAt: new Date().toISOString(),
          version: '1.0',
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="amoeba-export-${userId}-${Date.now()}.json"`);
        res.json(exportData);
      } catch (error) {
        console.error('Error exporting user data:', error);
        res.status(500).json({ message: 'Failed to export user data' });
      }
    }
  );
}



