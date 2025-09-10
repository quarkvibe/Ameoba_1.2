import { storage } from '../storage';
import { emailService } from './emailService';
import type { QueueJob, InsertQueueJob } from '@shared/schema';

interface QueueMetrics {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
  throughput: number; // jobs per minute
}

export class QueueService {
  private isProcessing = false;
  private workers: Set<NodeJS.Timeout> = new Set();
  private maxWorkers = parseInt(process.env.MAX_QUEUE_WORKERS || '5');
  private processInterval = parseInt(process.env.QUEUE_PROCESS_INTERVAL || '1000'); // ms

  async startProcessing(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log(`Starting queue processing with ${this.maxWorkers} workers`);
    
    for (let i = 0; i < this.maxWorkers; i++) {
      this.startWorker(i);
    }
  }

  async stopProcessing(): Promise<void> {
    this.isProcessing = false;
    
    this.workers.forEach(worker => clearInterval(worker));
    this.workers.clear();
    
    console.log('Queue processing stopped');
  }

  private startWorker(workerId: number): void {
    const worker = setInterval(async () => {
      if (!this.isProcessing) return;
      
      try {
        await this.processNextJob(workerId);
      } catch (error) {
        console.error(`Worker ${workerId} error:`, error);
      }
    }, this.processInterval);
    
    this.workers.add(worker);
  }

  private async processNextJob(workerId: number): Promise<void> {
    const pendingJobs = await storage.getQueueJobs('pending', 1);
    
    if (pendingJobs.length === 0) return;
    
    const job = pendingJobs[0];
    
    // Mark job as processing
    await storage.updateQueueJob(job.id, {
      status: 'processing',
      processedAt: new Date(),
      attempts: (job.attempts || 0) + 1,
    });

    try {
      await this.executeJob(job);
      
      // Mark as completed
      await storage.updateQueueJob(job.id, {
        status: 'completed',
        completedAt: new Date(),
      });
      
      console.log(`Worker ${workerId}: Job ${job.id} completed`);
    } catch (error) {
      console.error(`Worker ${workerId}: Job ${job.id} failed:`, error);
      
      const shouldRetry = (job.attempts || 0) < (job.maxAttempts || 3);
      
      await storage.updateQueueJob(job.id, {
        status: shouldRetry ? 'pending' : 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        failedAt: shouldRetry ? undefined : new Date(),
      });
    }
  }

  private async executeJob(job: QueueJob): Promise<void> {
    switch (job.type) {
      case 'email':
        await this.processEmailJob(job);
        break;
      case 'campaign':
        await this.processCampaignJob(job);
        break;
      case 'cleanup':
        await this.processCleanupJob(job);
        break;
      case 'horoscope_generation':
        await this.processHoroscopeGenerationJob(job);
        break;
      case 'personalized_horoscope_emails':
        await this.processPersonalizedEmailJob(job);
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  private async processEmailJob(job: QueueJob): Promise<void> {
    const data = job.data as any;
    const { userId, recipient, subject, content, htmlContent, campaignId } = data;
    
    // Create email log entry
    const emailLog = await storage.createEmailLog({
      campaignId,
      userId,
      recipient,
      subject,
      provider: 'default',
      status: 'queued',
    });

    try {
      // Update status to sending
      await storage.updateEmailLogStatus(emailLog.id, 'sending');
      
      // Send email
      const result = await emailService.sendEmail(userId, {
        to: recipient,
        from: '', // Will be determined by email service
        subject,
        text: content,
        html: htmlContent,
      });

      if (result.success) {
        await storage.updateEmailLogStatus(emailLog.id, 'sent', {
          messageId: result.messageId,
        });
      } else {
        await storage.updateEmailLogStatus(emailLog.id, 'failed', {
          error: result.error,
        });
        throw new Error(result.error || 'Email send failed');
      }
    } catch (error) {
      await storage.updateEmailLogStatus(emailLog.id, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async processCampaignJob(job: QueueJob): Promise<void> {
    const data = job.data as any;
    const { campaignId, userId } = data;
    
    const campaign = await storage.getCampaign(campaignId, userId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Process recipients
    const recipients = campaign.recipients as string[] || [];
    
    for (const recipient of recipients) {
      await this.addEmailJob({
        type: 'email',
        data: {
          userId,
          campaignId,
          recipient,
          subject: campaign.subject,
          content: campaign.content,
          htmlContent: campaign.htmlContent,
        },
        priority: job.priority,
      });
    }
  }

  private async processCleanupJob(job: QueueJob): Promise<void> {
    const data = job.data as any;
    const { olderThanDays = 30 } = data;
    
    // Clean up old completed jobs
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    // This would require additional database operations
    console.log(`Cleanup job processed for data older than ${olderThanDays} days`);
  }

  async addEmailJob(job: Omit<InsertQueueJob, 'id' | 'createdAt'>): Promise<QueueJob> {
    return await storage.createQueueJob(job);
  }

  async addCampaignJob(campaignId: string, userId: string, priority = 0): Promise<QueueJob> {
    return await storage.createQueueJob({
      type: 'campaign',
      data: { campaignId, userId },
      priority,
    });
  }

  async getMetrics(): Promise<QueueMetrics> {
    const metrics = await storage.getQueueMetrics();
    
    // Calculate throughput (simplified - would need time-based tracking in production)
    const throughput = 0; // Would track completed jobs per minute
    
    return {
      pending: metrics.pending || 0,
      processing: metrics.processing || 0,
      completed: metrics.completed || 0,
      failed: metrics.failed || 0,
      total: metrics.total || 0,
      throughput,
    };
  }

  async pauseProcessing(): Promise<void> {
    this.isProcessing = false;
  }

  async resumeProcessing(): Promise<void> {
    if (!this.isProcessing) {
      this.startProcessing();
    }
  }

  async clearQueue(): Promise<void> {
    // This would require database operation to delete pending jobs
    console.log('Queue cleared');
  }

  async retryFailedJobs(): Promise<void> {
    const failedJobs = await storage.getQueueJobs('failed');
    
    for (const job of failedJobs) {
      await storage.updateQueueJob(job.id, {
        status: 'pending',
        attempts: 0,
        error: null,
        failedAt: null,
      });
    }
  }

  private async processHoroscopeGenerationJob(job: QueueJob): Promise<void> {
    // Import here to avoid circular dependency
    const { horoscopeQueueService } = await import('./horoscopeQueueService');
    await horoscopeQueueService.processHoroscopeGenerationJob(job.data);
  }

  private async processPersonalizedEmailJob(job: QueueJob): Promise<void> {
    // Import here to avoid circular dependency
    const { horoscopeQueueService } = await import('./horoscopeQueueService');
    await horoscopeQueueService.processPersonalizedEmailJob(job.data);
  }

  async addJob(job: Omit<InsertQueueJob, 'id' | 'createdAt'>): Promise<QueueJob> {
    return await storage.createQueueJob(job);
  }
}

export const queueService = new QueueService();

// Auto-start queue processing
queueService.startProcessing().catch(console.error);
