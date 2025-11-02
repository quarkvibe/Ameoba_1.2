import { storage } from '../storage';
import { activityMonitor } from './activityMonitor';
import { contentGenerationService } from './contentGenerationService';
import { deliveryService } from './deliveryService';
const parser = require('cron-parser');

interface ScheduledJobState {
  jobId: string;
  timeout: NodeJS.Timeout | null;
  interval: NodeJS.Timeout | null;
  nextRun: Date;
}

export class CronService {
  private scheduledJobs: Map<string, ScheduledJobState> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 60000; // Check for new jobs every minute

  /**
   * Start the dynamic content generation scheduler
   */
  async start(): Promise<void> {
    console.log('🌟 Starting Amoeba Content Generation Scheduler...');
    activityMonitor.logActivity('info', '⏰ Content generation scheduler starting...');

    // Load and schedule all active jobs from database
    await this.refreshScheduledJobs();

    // Poll for changes to scheduled jobs every minute
    this.pollingInterval = setInterval(async () => {
      await this.refreshScheduledJobs();
    }, this.POLL_INTERVAL_MS);

    console.log('✅ Scheduler started successfully');
    activityMonitor.logActivity('success', '⏰ Scheduler started - polling every 60s for job updates');
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    // Clear all job timers
    this.scheduledJobs.forEach((state, jobId) => {
      if (state.timeout) clearTimeout(state.timeout);
      if (state.interval) clearInterval(state.interval);
    });
    this.scheduledJobs.clear();

    // Stop polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    console.log('🛑 Scheduler stopped');
  }

  /**
   * Refresh all scheduled jobs from database
   */
  private async refreshScheduledJobs(): Promise<void> {
    try {
      const jobs = await storage.getActiveScheduledJobs();
      
      // Schedule new jobs
      for (const job of jobs) {
        if (!this.scheduledJobs.has(job.id)) {
          await this.scheduleJob(job);
        }
      }

      // Remove jobs that are no longer active
      const activeJobIds = new Set(jobs.map(j => j.id));
      const scheduledJobIds = Array.from(this.scheduledJobs.keys());
      for (const jobId of scheduledJobIds) {
        if (!activeJobIds.has(jobId)) {
          this.unscheduleJob(jobId);
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing scheduled jobs:', error);
    }
  }

  /**
   * Schedule a single job based on its cron expression
   */
  private async scheduleJob(job: any): Promise<void> {
    try {
      // Parse cron expression
      const cronExpression = job.cronExpression;
      const timezone = job.timezone || 'UTC';
      
      const interval = parser.parseExpression(cronExpression, {
        currentDate: new Date(),
        tz: timezone
      });
      
      const nextRun = interval.next().toDate();
      const timeUntilRun = nextRun.getTime() - Date.now();

      // Schedule the job
      const timeout = setTimeout(async () => {
        await this.executeJob(job);
        
        // Reschedule for next occurrence
        this.unscheduleJob(job.id);
        await this.scheduleJob(job);
      }, timeUntilRun);

      this.scheduledJobs.set(job.id, {
        jobId: job.id,
        timeout,
        interval: null,
        nextRun
      });

      // Update next run time in database
      await storage.updateScheduledJobNextRun(job.id, nextRun);

      console.log(`📅 Scheduled job "${job.name}" (${job.id}) for ${nextRun.toISOString()}`);
      activityMonitor.logActivity('debug', `📅 Job "${job.name}" scheduled for ${nextRun.toLocaleString()}`);
    } catch (error) {
      console.error(`❌ Error scheduling job ${job.id}:`, error);
    }
  }

  /**
   * Unschedule a job
   */
  private unscheduleJob(jobId: string): void {
    const state = this.scheduledJobs.get(jobId);
    if (state) {
      if (state.timeout) clearTimeout(state.timeout);
      if (state.interval) clearInterval(state.interval);
      this.scheduledJobs.delete(jobId);
      console.log(`🗑️  Unscheduled job ${jobId}`);
    }
  }

  /**
   * Execute a scheduled job
   */
  private async executeJob(job: any): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Executing job "${job.name}" (${job.id})...`);
      activityMonitor.logJobExecution(job.id, job.name, 'started');
      
      // Update job status to running
      await storage.updateScheduledJobStatus(job.id, 'running');
      await storage.updateScheduledJobLastRun(job.id, new Date());
      
      // Get the content template for this job
      const template = await storage.getContentTemplateById(job.templateId);
      if (!template) {
        throw new Error(`Template ${job.templateId} not found`);
      }

      // Generate content using real AI
      const generationResult = await contentGenerationService.generate({
        templateId: job.templateId,
        userId: job.userId,
        variables: job.config?.variables || {},
      });

      // Save generated content
      const generatedContent = await storage.createGeneratedContent({
        templateId: job.templateId,
        userId: job.userId,
        jobId: job.id,
        content: generationResult.content,
        metadata: {
          ...generationResult.metadata,
          executionTime: Date.now() - startTime,
        },
      });

      // Deliver content
      try {
        await deliveryService.deliver({
          content: generationResult.content,
          contentId: generatedContent.id,
          userId: job.userId,
          templateId: job.templateId,
        });
      } catch (deliveryError: any) {
        console.error(`Delivery failed for job ${job.name}:`, deliveryError);
        // Don't fail the job if delivery fails - content was generated
      }

      // Update job status to success
      await storage.updateScheduledJobStatus(job.id, 'success');
      await storage.incrementScheduledJobSuccessCount(job.id);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Job "${job.name}" completed in ${duration}ms`);
      activityMonitor.logJobExecution(job.id, job.name, 'completed', duration);
      activityMonitor.logContentGeneration(template.name, 'completed');
      
    } catch (error: any) {
      console.error(`❌ Job "${job.name}" failed:`, error);
      activityMonitor.logJobExecution(job.id, job.name, 'failed');
      activityMonitor.logError(error, `Job: ${job.name}`);
      
      // Update job status to error
      await storage.updateScheduledJobStatus(job.id, 'error', error.message);
      await storage.incrementScheduledJobErrorCount(job.id);
    }
  }

  /**
   * Get the status of the scheduler
   */
  getStatus(): {
    isRunning: boolean;
    activeJobs: number;
    scheduledJobs: Array<{
      id: string;
      name?: string;
      nextRun: Date;
    }>;
  } {
    const jobs = Array.from(this.scheduledJobs.entries()).map(([id, state]) => ({
      id,
      nextRun: state.nextRun
    }));

    return {
      isRunning: this.pollingInterval !== null,
      activeJobs: this.scheduledJobs.size,
      scheduledJobs: jobs
    };
  }

  /**
   * Manually trigger a job execution (for testing)
   */
  async triggerJob(jobId: string): Promise<any> {
    console.log(`🔄 Manually triggering job ${jobId}...`);
    
    try {
      const job = await storage.getScheduledJobById(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      await this.executeJob(job);
      console.log(`✅ Manual job execution completed`);
      return { success: true, jobId };
    } catch (error) {
      console.error('❌ Manual job execution failed:', error);
      throw error;
    }
  }
}

export const cronService = new CronService();
