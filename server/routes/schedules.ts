import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { standardRateLimit, generousRateLimit, strictRateLimit } from '../middleware/rateLimiter';
import { insertScheduledJobSchema } from '@shared/schema';
import { storage } from '../storage';
import { activityMonitor } from '../services/activityMonitor';

/**
 * SCHEDULED JOB ROUTES
 * Manages cron-based automation for content generation
 * Allows templates to run on a schedule
 */

export function registerScheduleRoutes(router: Router) {
  
  // Create new scheduled job
  router.post('/schedules', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        
        // Validate request body
        const validatedData = insertScheduledJobSchema.parse({
          ...req.body,
          userId,
        });
        
        // Verify template ownership
        const template = await storage.getContentTemplate(validatedData.templateId, userId);
        if (!template) {
          return res.status(404).json({ message: 'Template not found' });
        }
        
        const job = await storage.createScheduledJob(validatedData);
        
        activityMonitor.logActivity('info', `📅 Scheduled job created: ${job.name}`);
        
        res.status(201).json({
          success: true,
          job,
        });
      } catch (error: any) {
        console.error('Error creating scheduled job:', error);
        
        if (error.name === 'ZodError') {
          return res.status(400).json({ 
            message: 'Validation failed', 
            errors: error.errors 
          });
        }
        
        res.status(500).json({ message: 'Failed to create scheduled job' });
      }
    }
  );

  // List scheduled jobs
  router.get('/schedules', 
    isAuthenticated, 
    generousRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const includeInactive = req.query.includeInactive === 'true';
        const templateId = req.query.templateId as string | undefined;
        
        const jobs = await storage.getScheduledJobs(userId, {
          includeInactive,
          templateId,
        });
        
        res.json({ jobs });
      } catch (error) {
        console.error('Error listing scheduled jobs:', error);
        res.status(500).json({ message: 'Failed to list scheduled jobs' });
      }
    }
  );

  // Get single scheduled job
  router.get('/schedules/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        const job = await storage.getScheduledJob(id, userId);
        
        if (!job) {
          return res.status(404).json({ message: 'Scheduled job not found' });
        }
        
        res.json(job);
      } catch (error) {
        console.error('Error fetching scheduled job:', error);
        res.status(500).json({ message: 'Failed to fetch scheduled job' });
      }
    }
  );

  // Update scheduled job
  router.put('/schedules/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const existingJob = await storage.getScheduledJob(id, userId);
        if (!existingJob) {
          return res.status(404).json({ message: 'Scheduled job not found' });
        }
        
        // If templateId is being changed, verify new template ownership
        if (req.body.templateId && req.body.templateId !== existingJob.templateId) {
          const template = await storage.getContentTemplate(req.body.templateId, userId);
          if (!template) {
            return res.status(404).json({ message: 'Template not found' });
          }
        }
        
        // Update job
        const updatedJob = await storage.updateScheduledJob(id, req.body);
        
        activityMonitor.logActivity('info', `📅 Scheduled job updated: ${updatedJob.name}`);
        
        res.json({
          success: true,
          job: updatedJob,
        });
      } catch (error) {
        console.error('Error updating scheduled job:', error);
        res.status(500).json({ message: 'Failed to update scheduled job' });
      }
    }
  );

  // Delete scheduled job
  router.delete('/schedules/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const job = await storage.getScheduledJob(id, userId);
        if (!job) {
          return res.status(404).json({ message: 'Scheduled job not found' });
        }
        
        await storage.deleteScheduledJob(id);
        
        activityMonitor.logActivity('info', `📅 Scheduled job deleted: ${job.name}`);
        
        res.json({ success: true, message: 'Scheduled job deleted' });
      } catch (error) {
        console.error('Error deleting scheduled job:', error);
        res.status(500).json({ message: 'Failed to delete scheduled job' });
      }
    }
  );

  // Enable/disable scheduled job
  router.post('/schedules/:id/toggle', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const job = await storage.getScheduledJob(id, userId);
        if (!job) {
          return res.status(404).json({ message: 'Scheduled job not found' });
        }
        
        // Toggle active state
        const updatedJob = await storage.updateScheduledJob(id, {
          isActive: !job.isActive,
        });
        
        activityMonitor.logActivity(
          'info', 
          `📅 Scheduled job ${updatedJob.isActive ? 'enabled' : 'disabled'}: ${updatedJob.name}`
        );
        
        res.json({
          success: true,
          isActive: updatedJob.isActive,
          message: `Job ${updatedJob.isActive ? 'enabled' : 'disabled'}`,
        });
      } catch (error) {
        console.error('Error toggling scheduled job:', error);
        res.status(500).json({ message: 'Failed to toggle scheduled job' });
      }
    }
  );

  // Run scheduled job immediately (manual trigger)
  router.post('/schedules/:id/run', 
    isAuthenticated, 
    strictRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const job = await storage.getScheduledJob(id, userId);
        if (!job) {
          return res.status(404).json({ message: 'Scheduled job not found' });
        }
        
        // TODO: Trigger job execution via cronService
        // For now, acknowledge the request
        activityMonitor.logActivity('info', `▶️  Manual trigger: ${job.name}`);
        
        res.json({
          success: true,
          message: `Job "${job.name}" triggered manually`,
          jobId: id,
        });
      } catch (error) {
        console.error('Error running scheduled job:', error);
        res.status(500).json({ message: 'Failed to run scheduled job' });
      }
    }
  );

  // Get scheduled job execution history
  router.get('/schedules/:id/history', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;
        
        // Verify ownership
        const job = await storage.getScheduledJob(id, userId);
        if (!job) {
          return res.status(404).json({ message: 'Scheduled job not found' });
        }
        
        const history = await storage.getJobExecutionHistory(id, limit);
        
        res.json({ 
          jobId: id,
          jobName: job.name,
          history,
        });
      } catch (error) {
        console.error('Error fetching job history:', error);
        res.status(500).json({ message: 'Failed to fetch execution history' });
      }
    }
  );

  // Get scheduled job statistics
  router.get('/schedules/:id/stats', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const job = await storage.getScheduledJob(id, userId);
        if (!job) {
          return res.status(404).json({ message: 'Scheduled job not found' });
        }
        
        res.json({
          id,
          name: job.name,
          cronExpression: job.cronExpression,
          isActive: job.isActive,
          successCount: job.successCount || 0,
          errorCount: job.errorCount || 0,
          lastRun: job.lastRun,
          nextRun: job.nextRun,
          status: job.status,
        });
      } catch (error) {
        console.error('Error fetching job stats:', error);
        res.status(500).json({ message: 'Failed to fetch statistics' });
      }
    }
  );

  // Validate cron expression
  router.post('/schedules/validate-cron', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const { cronExpression } = req.body;
        
        if (!cronExpression) {
          return res.status(400).json({ message: 'cronExpression is required' });
        }
        
        // TODO: Validate cron expression using cron-parser
        // For now, basic validation
        const parts = cronExpression.split(' ');
        if (parts.length < 5 || parts.length > 6) {
          return res.status(400).json({ 
            valid: false,
            message: 'Invalid cron expression format',
          });
        }
        
        res.json({
          valid: true,
          expression: cronExpression,
          message: 'Valid cron expression',
          // TODO: Add next 5 run times
        });
      } catch (error) {
        console.error('Error validating cron expression:', error);
        res.status(500).json({ message: 'Failed to validate cron expression' });
      }
    }
  );

  // Get cron expression presets
  router.get('/schedules/presets/common', 
    isAuthenticated, 
    generousRateLimit,
    async (req: any, res) => {
      try {
        const presets = [
          { name: 'Every minute', expression: '* * * * *', description: 'Runs every minute' },
          { name: 'Every 5 minutes', expression: '*/5 * * * *', description: 'Runs every 5 minutes' },
          { name: 'Every 15 minutes', expression: '*/15 * * * *', description: 'Runs every 15 minutes' },
          { name: 'Every 30 minutes', expression: '*/30 * * * *', description: 'Runs every 30 minutes' },
          { name: 'Every hour', expression: '0 * * * *', description: 'Runs at the start of every hour' },
          { name: 'Every 6 hours', expression: '0 */6 * * *', description: 'Runs every 6 hours' },
          { name: 'Every 12 hours', expression: '0 */12 * * *', description: 'Runs every 12 hours' },
          { name: 'Daily at midnight', expression: '0 0 * * *', description: 'Runs once daily at 00:00' },
          { name: 'Daily at 9 AM', expression: '0 9 * * *', description: 'Runs once daily at 09:00' },
          { name: 'Every Monday at 9 AM', expression: '0 9 * * 1', description: 'Runs every Monday at 09:00' },
          { name: 'First day of month', expression: '0 0 1 * *', description: 'Runs on the 1st of each month at 00:00' },
          { name: 'Weekdays at 9 AM', expression: '0 9 * * 1-5', description: 'Runs Monday-Friday at 09:00' },
        ];
        
        res.json({ presets });
      } catch (error) {
        console.error('Error fetching cron presets:', error);
        res.status(500).json({ message: 'Failed to fetch presets' });
      }
    }
  );
}



