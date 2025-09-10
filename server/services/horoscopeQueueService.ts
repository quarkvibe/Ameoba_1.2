import { queueService } from "./queueService";
import { horoscopeService } from "./horoscopeService";
import { storage } from "../storage";

export class HoroscopeQueueService {
  
  /**
   * Schedule daily horoscope generation for a specific date
   */
  async scheduleDailyHoroscopeGeneration(date: string, priority = 10): Promise<void> {
    try {
      // Check if horoscopes already exist for this date
      const existing = await storage.getAllHoroscopesForDate(date);
      if (existing.length === 12) {
        console.log(`Horoscopes already exist for ${date}, skipping generation`);
        return;
      }

      // Create a queue job for horoscope generation
      const job = await queueService.addJob({
        type: 'horoscope_generation',
        priority: priority,
        data: {
          date: date,
          action: 'generate_daily_horoscopes'
        }
      });

      console.log(`Scheduled horoscope generation for ${date}, job ID: ${job.id}`);
    } catch (error) {
      console.error(`Failed to schedule horoscope generation for ${date}:`, error);
      throw error;
    }
  }

  /**
   * Schedule daily horoscope generation at midnight every day
   */
  async scheduleRecurringDailyGeneration(): Promise<void> {
    // Schedule for today if not already done
    const today = new Date().toISOString().split('T')[0];
    await this.scheduleDailyHoroscopeGeneration(today);
    
    // Schedule for tomorrow (useful for testing and ensuring continuity)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await this.scheduleDailyHoroscopeGeneration(tomorrowStr);
  }

  /**
   * Schedule personalized horoscope emails for premium users
   */
  async schedulePersonalizedEmails(date: string): Promise<void> {
    try {
      // This will be enhanced once we have production database access
      const job = await queueService.addJob({
        type: 'personalized_horoscope_emails',
        priority: 5,
        data: {
          date: date,
          action: 'send_premium_horoscopes'
        }
      });

      console.log(`Scheduled personalized horoscope emails for ${date}, job ID: ${job.id}`);
    } catch (error) {
      console.error(`Failed to schedule personalized emails for ${date}:`, error);
      throw error;
    }
  }

  /**
   * Process horoscope generation job
   */
  async processHoroscopeGenerationJob(jobData: any): Promise<void> {
    const { date } = jobData;
    
    try {
      console.log(`Starting horoscope generation for ${date}`);
      await horoscopeService.generateDailyHoroscopes(date);
      
      // After generating horoscopes, schedule emails for premium users
      await this.schedulePersonalizedEmails(date);
      
      console.log(`Completed horoscope generation for ${date}`);
    } catch (error) {
      console.error(`Failed to generate horoscopes for ${date}:`, error);
      throw error;
    }
  }

  /**
   * Process personalized email job (placeholder for when we have production DB access)
   */
  async processPersonalizedEmailJob(jobData: any): Promise<void> {
    const { date } = jobData;
    
    try {
      console.log(`Processing personalized emails for ${date}`);
      
      // TODO: Once we have production database access:
      // 1. Fetch premium users with sun chart data
      // 2. Get their personalized horoscope based on birth chart
      // 3. Send email with their specific horoscope
      
      // For now, log that this would happen
      console.log(`Would send personalized horoscopes to premium users for ${date}`);
      
    } catch (error) {
      console.error(`Failed to send personalized emails for ${date}:`, error);
      throw error;
    }
  }

  /**
   * Generate missing horoscopes for past dates (backfill)
   */
  async backfillMissingHoroscopes(startDate: string, endDate: string): Promise<void> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      // Check if horoscopes exist for this date
      const existing = await storage.getAllHoroscopesForDate(dateStr);
      if (existing.length < 12) {
        console.log(`Backfilling horoscopes for ${dateStr}`);
        await this.scheduleDailyHoroscopeGeneration(dateStr, 1); // Lower priority for backfill
      }
    }
  }

  /**
   * Get horoscope generation statistics
   */
  async getGenerationStats(): Promise<any> {
    try {
      // Get recent horoscope generations
      const recentGenerations = await storage.getQueueJobs('completed', 10);
      const horoscopeJobs = recentGenerations.filter(job => job.type === 'horoscope_generation');
      
      // Calculate success rate and average generation time
      const stats = {
        totalGenerations: horoscopeJobs.length,
        successfulGenerations: horoscopeJobs.filter(job => job.status === 'completed').length,
        failedGenerations: horoscopeJobs.filter(job => job.status === 'failed').length,
        averageGenerationTime: this.calculateAverageProcessingTime(horoscopeJobs),
        lastGeneration: horoscopeJobs[0]?.createdAt || null
      };

      return stats;
    } catch (error) {
      console.error('Error getting generation stats:', error);
      return null;
    }
  }

  private calculateAverageProcessingTime(jobs: any[]): number {
    const completedJobs = jobs.filter(job => 
      job.status === 'completed' && job.processedAt && job.completedAt
    );

    if (completedJobs.length === 0) return 0;

    const totalTime = completedJobs.reduce((sum, job) => {
      const processingTime = new Date(job.completedAt).getTime() - new Date(job.processedAt).getTime();
      return sum + processingTime;
    }, 0);

    return Math.round(totalTime / completedJobs.length / 1000); // Return seconds
  }
}

export const horoscopeQueueService = new HoroscopeQueueService();