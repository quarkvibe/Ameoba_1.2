import { storage } from '../storage';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { aiAgent } from './aiAgent';

/**
 * System readiness checker
 * Provides traffic light (🟢🟡🔴) status for all platform dependencies
 */

export type HealthStatus = 'healthy' | 'degraded' | 'critical';

export interface HealthCheck {
  status: HealthStatus;
  message: string;
  details?: any;
  icon: '🟢' | '🟡' | '🔴';
  timestamp: string;
}

export interface SystemReadiness {
  overall: HealthStatus;
  overallIcon: '🟢' | '🟡' | '🔴';
  score: number; // 0-100
  checks: {
    aiCredentials: HealthCheck;
    emailCredentials: HealthCheck;
    aiAgent: HealthCheck; // NEW: AI agent control system
    database: HealthCheck;
    encryption: HealthCheck;
    templates: HealthCheck;
    scheduledJobs: HealthCheck;
    queueHealth: HealthCheck;
    diskSpace?: HealthCheck;
  };
  blockers: string[]; // What's preventing operation
  warnings: string[]; // What needs attention
  recommendations: string[]; // How to improve
  timestamp: string;
}

export class SystemReadinessService {
  
  /**
   * Get complete system readiness status
   */
  async getReadiness(userId?: string): Promise<SystemReadiness> {
    const timestamp = new Date().toISOString();
    
    // Run all health checks in parallel
    const [
      aiCreds,
      emailCreds,
      agentHealth,
      database,
      encryption,
      templates,
      jobs,
      queue
    ] = await Promise.all([
      this.checkAiCredentials(userId),
      this.checkEmailCredentials(userId),
      this.checkAiAgent(),
      this.checkDatabase(),
      this.checkEncryption(),
      this.checkTemplates(userId),
      this.checkScheduledJobs(userId),
      this.checkQueue(),
    ]);

    const checks = {
      aiCredentials: aiCreds,
      emailCredentials: emailCreds,
      aiAgent: agentHealth,
      database,
      encryption,
      templates,
      scheduledJobs: jobs,
      queueHealth: queue,
    };

    // Calculate overall status
    const { overall, score, blockers, warnings, recommendations } = this.calculateOverall(checks);

    return {
      overall,
      overallIcon: this.getIcon(overall),
      score,
      checks,
      blockers,
      warnings,
      recommendations,
      timestamp,
    };
  }

  /**
   * Check AI credentials status
   */
  private async checkAiCredentials(userId?: string): Promise<HealthCheck> {
    if (!userId) {
      return {
        status: 'degraded',
        message: 'User not authenticated',
        icon: '🟡',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const credentials = await storage.getAiCredentials(userId);
      const activeCredentials = credentials.filter(c => c.isActive);
      
      if (activeCredentials.length === 0) {
        return {
          status: 'critical',
          message: 'No AI credentials configured',
          details: { 
            total: credentials.length,
            active: 0,
            action: 'Add an AI API key to start generating content'
          },
          icon: '🔴',
          timestamp: new Date().toISOString(),
        };
      }

      const hasDefault = activeCredentials.some(c => c.isDefault);
      const providerSet = new Set(activeCredentials.map(c => c.provider));
      const providers = Array.from(providerSet);

      if (!hasDefault) {
        return {
          status: 'degraded',
          message: 'No default AI credential set',
          details: {
            total: credentials.length,
            active: activeCredentials.length,
            providers,
            action: 'Set one credential as default'
          },
          icon: '🟡',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        status: 'healthy',
        message: `${activeCredentials.length} AI credential(s) ready`,
        details: {
          total: credentials.length,
          active: activeCredentials.length,
          providers,
          hasDefault: true
        },
        icon: '🟢',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        status: 'critical',
        message: `Error checking AI credentials: ${error.message}`,
        icon: '🔴',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check AI Agent control system availability
   */
  private async checkAiAgent(): Promise<HealthCheck> {
    try {
      const health = await aiAgent.checkHealth();
      
      if (!health.available) {
        return {
          status: 'degraded',
          message: 'AI Agent unavailable',
          details: {
            error: health.error,
            model: health.model,
            severity: 'warning',
            action: 'Configure OPENAI_API_KEY to enable natural language control'
          },
          icon: '🟡',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        status: 'healthy',
        message: 'AI Agent ready (GPT-5)',
        details: {
          model: health.model,
          capabilities: [
            'Natural language commands',
            'System control',
            'Content generation',
            'Job execution',
            'Status monitoring'
          ]
        },
        icon: '🟢',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        status: 'degraded',
        message: `AI Agent check failed: ${error.message}`,
        details: {
          severity: 'warning',
          action: 'AI Agent is optional but recommended for natural language control'
        },
        icon: '🟡',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check email service credentials
   */
  private async checkEmailCredentials(userId?: string): Promise<HealthCheck> {
    if (!userId) {
      return {
        status: 'degraded',
        message: 'User not authenticated',
        icon: '🟡',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const credentials = await storage.getEmailServiceCredentials(userId);
      const activeCredentials = credentials.filter(c => c.isActive);
      
      if (activeCredentials.length === 0) {
        return {
          status: 'degraded',
          message: 'No email credentials configured',
          details: {
            total: credentials.length,
            active: 0,
            severity: 'warning',
            action: 'Email delivery will not work without credentials'
          },
          icon: '🟡',
          timestamp: new Date().toISOString(),
        };
      }

      const hasDefault = activeCredentials.some(c => c.isDefault);
      const providerSet2 = new Set(activeCredentials.map(c => c.provider));
      const providers = Array.from(providerSet2);

      return {
        status: hasDefault ? 'healthy' : 'degraded',
        message: hasDefault 
          ? `${activeCredentials.length} email credential(s) ready`
          : 'Email credentials configured but no default set',
        details: {
          total: credentials.length,
          active: activeCredentials.length,
          providers,
          hasDefault
        },
        icon: hasDefault ? '🟢' : '🟡',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        status: 'degraded',
        message: `Error checking email credentials: ${error.message}`,
        icon: '🟡',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check database connection and health
   */
  private async checkDatabase(): Promise<HealthCheck> {
    try {
      const start = Date.now();
      await db.execute(sql`SELECT 1`);
      const latency = Date.now() - start;

      let status: HealthStatus = 'healthy';
      let message = `Database connected (${latency}ms)`;

      if (latency > 100) {
        status = 'degraded';
        message = `Database slow (${latency}ms)`;
      }
      if (latency > 500) {
        status = 'critical';
        message = `Database very slow (${latency}ms)`;
      }

      return {
        status,
        message,
        details: { latency, threshold: '< 100ms optimal' },
        icon: this.getIcon(status),
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        status: 'critical',
        message: `Database connection failed: ${error.message}`,
        icon: '🔴',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check encryption configuration
   */
  private async checkEncryption(): Promise<HealthCheck> {
    const hasEncryptionKey = !!process.env.ENCRYPTION_KEY;
    const isProduction = process.env.NODE_ENV === 'production';

    if (!hasEncryptionKey && isProduction) {
      return {
        status: 'critical',
        message: 'ENCRYPTION_KEY not set in production!',
        details: {
          severity: 'critical',
          action: 'Set ENCRYPTION_KEY environment variable immediately'
        },
        icon: '🔴',
        timestamp: new Date().toISOString(),
      };
    }

    if (!hasEncryptionKey) {
      return {
        status: 'degraded',
        message: 'Using default encryption key (dev only)',
        details: {
          severity: 'warning',
          action: 'Set ENCRYPTION_KEY for production'
        },
        icon: '🟡',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: 'healthy',
      message: 'Encryption configured correctly',
      details: { algorithm: 'AES-256-GCM' },
      icon: '🟢',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if user has content templates
   */
  private async checkTemplates(userId?: string): Promise<HealthCheck> {
    if (!userId) {
      return {
        status: 'degraded',
        message: 'User not authenticated',
        icon: '🟡',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const templates = await storage.getContentTemplates(userId);
      const activeTemplates = templates.filter(t => t.isActive);

      if (templates.length === 0) {
        return {
          status: 'degraded',
          message: 'No content templates created',
          details: {
            action: 'Create your first content template to start generating'
          },
          icon: '🟡',
          timestamp: new Date().toISOString(),
        };
      }

      if (activeTemplates.length === 0) {
        return {
          status: 'degraded',
          message: 'All templates are inactive',
          details: {
            total: templates.length,
            active: 0,
            action: 'Activate at least one template'
          },
          icon: '🟡',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        status: 'healthy',
        message: `${activeTemplates.length} active template(s)`,
        details: {
          total: templates.length,
          active: activeTemplates.length,
        },
        icon: '🟢',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        status: 'degraded',
        message: `Error checking templates: ${error.message}`,
        icon: '🟡',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check scheduled jobs status
   */
  private async checkScheduledJobs(userId?: string): Promise<HealthCheck> {
    if (!userId) {
      return {
        status: 'degraded',
        message: 'User not authenticated',
        icon: '🟡',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const jobs = await storage.getScheduledJobs(userId);
      const activeJobs = jobs.filter(j => j.isActive);

      if (jobs.length === 0) {
        return {
          status: 'degraded',
          message: 'No scheduled jobs configured',
          details: {
            action: 'Schedule jobs for automated content generation'
          },
          icon: '🟡',
          timestamp: new Date().toISOString(),
        };
      }

      if (activeJobs.length === 0) {
        return {
          status: 'degraded',
          message: 'All jobs are inactive',
          details: {
            total: jobs.length,
            active: 0,
            action: 'Activate jobs to enable automation'
          },
          icon: '🟡',
          timestamp: new Date().toISOString(),
        };
      }

      // Check for jobs with errors
      const failingJobs = activeJobs.filter(j => j.lastStatus === 'error');
      
      if (failingJobs.length > activeJobs.length / 2) {
        return {
          status: 'degraded',
          message: `${failingJobs.length} job(s) failing`,
          details: {
            total: jobs.length,
            active: activeJobs.length,
            failing: failingJobs.length,
            action: 'Check job errors and fix issues'
          },
          icon: '🟡',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        status: 'healthy',
        message: `${activeJobs.length} active job(s)`,
        details: {
          total: jobs.length,
          active: activeJobs.length,
          failing: failingJobs.length,
          successRate: this.calculateSuccessRate(activeJobs),
        },
        icon: '🟢',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        status: 'degraded',
        message: `Error checking jobs: ${error.message}`,
        icon: '🟡',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check queue health
   */
  private async checkQueue(): Promise<HealthCheck> {
    try {
      const metrics = await storage.getQueueMetrics();
      
      const total = metrics.pending + metrics.processing + metrics.completed + metrics.failed;
      const failureRate = total > 0 ? (metrics.failed / total) * 100 : 0;

      if (metrics.processing > 50) {
        return {
          status: 'degraded',
          message: `High queue load (${metrics.processing} processing)`,
          details: metrics,
          icon: '🟡',
          timestamp: new Date().toISOString(),
        };
      }

      if (failureRate > 30) {
        return {
          status: 'degraded',
          message: `High failure rate (${failureRate.toFixed(1)}%)`,
          details: { ...metrics, failureRate },
          icon: '🟡',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        status: 'healthy',
        message: `Queue healthy (${metrics.completed} completed)`,
        details: metrics,
        icon: '🟢',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        status: 'critical',
        message: `Queue check failed: ${error.message}`,
        icon: '🔴',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Calculate overall status and recommendations
   */
  private calculateOverall(checks: any): {
    overall: HealthStatus;
    score: number;
    blockers: string[];
    warnings: string[];
    recommendations: string[];
  } {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    let healthyCount = 0;
    let degradedCount = 0;
    let criticalCount = 0;
    let totalChecks = 0;

    // Count status levels
    for (const [key, check] of Object.entries(checks)) {
      totalChecks++;
      if ((check as HealthCheck).status === 'healthy') healthyCount++;
      if ((check as HealthCheck).status === 'degraded') degradedCount++;
      if ((check as HealthCheck).status === 'critical') criticalCount++;
    }

    // Identify blockers (critical issues)
    if (checks.aiCredentials.status === 'critical') {
      blockers.push('❌ No AI credentials - Cannot generate content');
      recommendations.push('Add an AI API key (OpenAI, Anthropic, etc.) in Settings → AI Credentials');
    }

    if (checks.database.status === 'critical') {
      blockers.push('❌ Database not connected - System inoperable');
    }

    if (checks.encryption.status === 'critical') {
      blockers.push('❌ Encryption not configured - Security compromised');
      recommendations.push('Set ENCRYPTION_KEY environment variable');
    }

    // Identify warnings (degraded status)
    if (checks.aiAgent && checks.aiAgent.status === 'degraded') {
      warnings.push('⚠️  AI Agent unavailable - Natural language control disabled');
      recommendations.push('Configure OPENAI_API_KEY to enable AI-powered control');
    }

    if (checks.emailCredentials.status === 'degraded') {
      warnings.push('⚠️  No email credentials - Email delivery unavailable');
      recommendations.push('Add SendGrid or AWS SES credentials to enable email delivery');
    }

    if (checks.templates.status === 'degraded') {
      warnings.push('⚠️  No templates configured - Nothing to generate');
      recommendations.push('Create your first content template');
    }

    if (checks.scheduledJobs.status === 'degraded') {
      warnings.push('⚠️  No active scheduled jobs - No automation');
      recommendations.push('Schedule jobs for automated content generation');
    }

    if (checks.queueHealth.status === 'degraded') {
      warnings.push('⚠️  Queue health degraded - Check for failures');
    }

    // Add general recommendations based on status
    if (healthyCount === totalChecks) {
      recommendations.push('✨ System is fully operational - Ready to scale!');
    } else if (criticalCount === 0 && healthyCount > degradedCount) {
      recommendations.push('💡 Most systems healthy - Address warnings for full functionality');
    }

    // Calculate score (0-100)
    const score = Math.round((healthyCount / totalChecks) * 100);

    // Determine overall status
    let overall: HealthStatus = 'healthy';
    if (criticalCount > 0) {
      overall = 'critical';
    } else if (degradedCount > healthyCount) {
      overall = 'degraded';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    }

    return { overall, score, blockers, warnings, recommendations };
  }

  /**
   * Get icon for status
   */
  private getIcon(status: HealthStatus): '🟢' | '🟡' | '🔴' {
    switch (status) {
      case 'healthy': return '🟢';
      case 'degraded': return '🟡';
      case 'critical': return '🔴';
    }
  }

  /**
   * Calculate success rate for jobs
   */
  private calculateSuccessRate(jobs: any[]): number {
    const jobsWithRuns = jobs.filter(j => j.totalRuns > 0);
    if (jobsWithRuns.length === 0) return 0;

    const totalRuns = jobsWithRuns.reduce((sum, j) => sum + j.totalRuns, 0);
    const totalSuccesses = jobsWithRuns.reduce((sum, j) => sum + j.successCount, 0);

    return Math.round((totalSuccesses / totalRuns) * 100);
  }

  /**
   * Quick health check (for status endpoints)
   */
  async getQuickHealth(): Promise<{
    status: HealthStatus;
    icon: string;
    message: string;
  }> {
    try {
      await db.execute(sql`SELECT 1`);
      const hasEncryptionKey = !!process.env.ENCRYPTION_KEY;

      if (!hasEncryptionKey && process.env.NODE_ENV === 'production') {
        return {
          status: 'critical',
          icon: '🔴',
          message: 'Encryption not configured in production'
        };
      }

      return {
        status: 'healthy',
        icon: '🟢',
        message: 'All core systems operational'
      };
    } catch (error) {
      return {
        status: 'critical',
        icon: '🔴',
        message: 'Database connection failed'
      };
    }
  }
}

export const systemReadinessService = new SystemReadinessService();

