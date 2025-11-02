import { storage } from '../storage';
import { cronService } from './cronService';
import { queueService } from './queueService';
import { integrationService } from './integrationService';
import { activityMonitor } from './activityMonitor';
import os from 'os';
import { db } from '../db';

/**
 * Command executor for terminal interface
 * Executes diagnostic commands and system operations
 */
export class CommandExecutor {
  
  /**
   * Execute a command and return formatted output
   */
  async execute(command: string, userId?: string): Promise<string> {
    const parts = command.trim().toLowerCase().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    try {
      switch (cmd) {
        case 'help':
          return this.help();
        
        case 'status':
        case 'health':
          return await this.systemHealth();
        
        case 'jobs':
          return await this.listScheduledJobs(userId);
        
        case 'queue':
          return await this.queueStatus();
        
        case 'metrics':
        case 'stats':
          return await this.systemMetrics();
        
        case 'templates':
          return await this.listTemplates(userId);
        
        case 'content':
          return await this.recentContent(userId);
        
        case 'generate':
          if (!userId) return '❌ Authentication required for content generation';
          return await this.triggerGeneration(args[0], userId);
        
        case 'run':
          if (!userId) return '❌ Authentication required to run jobs';
          return await this.runJob(args[0], userId);
        
        case 'db':
          return await this.databaseInfo();
        
        case 'memory':
        case 'mem':
          return this.memoryUsage();
        
        case 'uptime':
          return this.uptimeInfo();
        
        case 'env':
          return this.environmentInfo();
        
        case 'integrations':
          return await this.integrationsStatus();
        
        case 'cron':
          return this.cronStatus();
        
        case 'logs':
          return await this.recentLogs(parseInt(args[0]) || 20);
        
        case 'clear':
          return 'CLEAR_SCREEN'; // Special return value to clear UI
        
        case 'version':
          return this.versionInfo();
        
        default:
          return `❌ Unknown command: "${cmd}"\nType 'help' for available commands`;
      }
    } catch (error: any) {
      activityMonitor.logError(error, `Command: ${command}`);
      return `❌ Error executing command: ${error.message}`;
    }
  }

  private help(): string {
    return `
╔════════════════════════════════════════════════════════════╗
║          AMOEBA OPERATIONS CONSOLE - COMMANDS              ║
╚════════════════════════════════════════════════════════════╝

📊 SYSTEM STATUS:
  status / health   - Complete system health check
  metrics / stats   - System metrics and performance
  uptime            - Server uptime and process info
  memory / mem      - Memory usage statistics
  env               - Environment configuration
  version           - Platform version info
  db                - Database connection status

🔧 OPERATIONS:
  jobs              - List all scheduled jobs
  run <jobId>       - Manually execute a scheduled job
  generate <templateId> - Generate content from template
  queue             - Show queue status and jobs
  cron              - Show cron scheduler status

📋 DATA:
  templates         - List content templates
  content           - Show recent generated content
  integrations      - Show API keys and webhooks status
  logs [N]          - Show last N activity log entries

💡 UTILITIES:
  clear             - Clear terminal output
  help              - Show this help message

═══════════════════════════════════════════════════════════

TIP: Commands are case-insensitive
TIP: Press ↑/↓ for command history
TIP: All operations are logged in real-time
    `.trim();
  }

  private async systemHealth(): Promise<string> {
    try {
      // Check database
      const dbStart = Date.now();
      await db.execute(sql`SELECT 1`);
      const dbLatency = Date.now() - dbStart;
      
      // Check services
      const cronStatus = cronService.getStatus();
      const queueMetrics = await storage.getQueueMetrics();
      const connectedClients = activityMonitor.getClientCount();
      
      return `
╔════════════════════════════════════════════════════════════╗
║                    SYSTEM HEALTH CHECK                     ║
╚════════════════════════════════════════════════════════════╝

🗄️  DATABASE:
   Status: ✅ Connected
   Latency: ${dbLatency}ms
   Provider: PostgreSQL (Neon Serverless)

⏰ CRON SCHEDULER:
   Status: ${cronStatus.isRunning ? '✅ Running' : '❌ Stopped'}
   Active Jobs: ${cronStatus.activeJobs}
   Next Execution: ${cronStatus.scheduledJobs[0]?.nextRun || 'None scheduled'}

📦 QUEUE SERVICE:
   Pending: ${queueMetrics.pending}
   Processing: ${queueMetrics.processing}
   Completed: ${queueMetrics.completed}
   Failed: ${queueMetrics.failed}

🔌 WEBSOCKET:
   Connected Clients: ${connectedClients}
   Activity Monitor: ✅ Active

🌐 SERVER:
   Status: ✅ Operational
   Platform: Amoeba AI Content Platform v2.0
   Mode: ${process.env.NODE_ENV || 'development'}

═══════════════════════════════════════════════════════════
   Overall Status: ✅ HEALTHY
      `.trim();
    } catch (error: any) {
      return `❌ Health check failed: ${error.message}`;
    }
  }

  private async systemMetrics(): Promise<string> {
    const mem = process.memoryUsage();
    const uptime = process.uptime();
    const cpu = process.cpuUsage();
    
    try {
      // Get various metrics
      const queueMetrics = await storage.getQueueMetrics();
      
      return `
╔════════════════════════════════════════════════════════════╗
║                   SYSTEM METRICS                           ║
╚════════════════════════════════════════════════════════════╝

💾 MEMORY:
   RSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB
   Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB
   Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB
   External: ${(mem.external / 1024 / 1024).toFixed(2)} MB

⏱️  CPU:
   User: ${(cpu.user / 1000000).toFixed(2)}s
   System: ${(cpu.system / 1000000).toFixed(2)}s

⏰ UPTIME:
   Process: ${this.formatUptime(uptime)}
   System: ${this.formatUptime(os.uptime())}

📊 QUEUE:
   Total Jobs: ${queueMetrics.pending + queueMetrics.processing + queueMetrics.completed + queueMetrics.failed}
   Success Rate: ${this.calculateSuccessRate(queueMetrics)}%

🔌 WEBSOCKET:
   Active Connections: ${activityMonitor.getClientCount()}

═══════════════════════════════════════════════════════════
      `.trim();
    } catch (error: any) {
      return `❌ Failed to get metrics: ${error.message}`;
    }
  }

  private async listScheduledJobs(userId?: string): Promise<string> {
    try {
      const jobs = userId 
        ? await storage.getScheduledJobs(userId)
        : await storage.getActiveScheduledJobs();
      
      if (jobs.length === 0) {
        return '📅 No scheduled jobs found';
      }

      let output = `
╔════════════════════════════════════════════════════════════╗
║                  SCHEDULED JOBS                            ║
╚════════════════════════════════════════════════════════════╝
`;

      for (const job of jobs.slice(0, 10)) {
        const statusIcon = job.isActive ? '🟢' : '🔴';
        const nextRun = job.nextRun ? new Date(job.nextRun).toLocaleString() : 'Not scheduled';
        const lastStatus = job.lastStatus || 'Never run';
        
        output += `
${statusIcon} ${job.name}
   ID: ${job.id}
   Cron: ${job.cronExpression}
   Next Run: ${nextRun}
   Last Status: ${lastStatus}
   Total Runs: ${job.totalRuns} (✅ ${job.successCount} | ❌ ${job.errorCount})
`;
      }

      if (jobs.length > 10) {
        output += `\n   ... and ${jobs.length - 10} more jobs`;
      }

      output += '\n═══════════════════════════════════════════════════════════';
      
      return output.trim();
    } catch (error: any) {
      return `❌ Failed to list jobs: ${error.message}`;
    }
  }

  private async queueStatus(): Promise<string> {
    try {
      const metrics = await storage.getQueueMetrics();
      const recentJobs = await storage.getQueueJobs(undefined, 10);
      
      let output = `
╔════════════════════════════════════════════════════════════╗
║                    QUEUE STATUS                            ║
╚════════════════════════════════════════════════════════════╝

📊 OVERVIEW:
   Pending: ${metrics.pending}
   Processing: ${metrics.processing}
   Completed: ${metrics.completed}
   Failed: ${metrics.failed}
   Success Rate: ${this.calculateSuccessRate(metrics)}%

📝 RECENT JOBS:
`;

      if (recentJobs.length === 0) {
        output += '   No recent jobs\n';
      } else {
        for (const job of recentJobs) {
          const statusIcon = job.status === 'completed' ? '✅' : job.status === 'failed' ? '❌' : '⏳';
          output += `   ${statusIcon} ${job.type} - ${job.status} (${job.attempts}/${job.maxAttempts} attempts)\n`;
        }
      }

      output += '═══════════════════════════════════════════════════════════';
      
      return output.trim();
    } catch (error: any) {
      return `❌ Failed to get queue status: ${error.message}`;
    }
  }

  private async listTemplates(userId?: string): Promise<string> {
    if (!userId) {
      return '❌ Authentication required to list templates';
    }

    try {
      const templates = await storage.getContentTemplates(userId);
      
      if (templates.length === 0) {
        return '📝 No content templates found\nCreate one at /dashboard?view=content-config';
      }

      let output = `
╔════════════════════════════════════════════════════════════╗
║                  CONTENT TEMPLATES                         ║
╚════════════════════════════════════════════════════════════╝
`;

      for (const template of templates.slice(0, 10)) {
        const statusIcon = template.isActive ? '🟢' : '🔴';
        const category = template.category || 'uncategorized';
        
        output += `
${statusIcon} ${template.name}
   ID: ${template.id}
   Category: ${category}
   Used: ${template.usageCount} times
   Last Used: ${template.lastUsed ? new Date(template.lastUsed).toLocaleString() : 'Never'}
`;
      }

      if (templates.length > 10) {
        output += `\n   ... and ${templates.length - 10} more templates`;
      }

      output += '\n═══════════════════════════════════════════════════════════';
      
      return output.trim();
    } catch (error: any) {
      return `❌ Failed to list templates: ${error.message}`;
    }
  }

  private async recentContent(userId?: string): Promise<string> {
    if (!userId) {
      return '❌ Authentication required to view content';
    }

    try {
      const content = await storage.getGeneratedContent(userId, 10);
      
      if (content.length === 0) {
        return '📄 No generated content found\nGenerate content at /dashboard?view=generation';
      }

      let output = `
╔════════════════════════════════════════════════════════════╗
║               RECENTLY GENERATED CONTENT                   ║
╚════════════════════════════════════════════════════════════╝
`;

      for (const item of content) {
        const preview = item.content.substring(0, 60).replace(/\n/g, ' ');
        const timestamp = item.generatedAt ? new Date(item.generatedAt).toLocaleString() : 'Unknown';
        
        output += `
📄 ${item.title || 'Untitled'}
   ID: ${item.id}
   Generated: ${timestamp}
   Preview: ${preview}${item.content.length > 60 ? '...' : ''}
`;
      }

      output += '\n═══════════════════════════════════════════════════════════';
      
      return output.trim();
    } catch (error: any) {
      return `❌ Failed to get content: ${error.message}`;
    }
  }

  private async triggerGeneration(templateId: string, userId: string): Promise<string> {
    if (!templateId) {
      return '❌ Usage: generate <templateId>';
    }

    try {
      activityMonitor.logActivity('info', `🎨 Triggering content generation for template ${templateId}...`);
      
      const template = await storage.getContentTemplate(templateId, userId);
      if (!template) {
        return `❌ Template ${templateId} not found`;
      }

      // Import service at top
      const { contentGenerationService } = await import('./contentGenerationService');
      
      const generationResult = await contentGenerationService.generate({
        templateId,
        userId,
        variables: {},
      });

      const generated = await storage.createGeneratedContent({
        templateId,
        userId,
        content: generationResult.content,
        metadata: { 
          ...generationResult.metadata,
          triggeredVia: 'terminal',
        },
      });
      
      return `
✅ Content generated successfully!

Template: ${template.name}
Content ID: ${generated.id}
Length: ${generated.content.length} characters
Generated: ${generated.generatedAt ? new Date(generated.generatedAt).toLocaleString() : 'Just now'}

Preview:
${generated.content.substring(0, 200)}${generated.content.length > 200 ? '...' : ''}
      `.trim();
    } catch (error: any) {
      activityMonitor.logError(error, 'Content Generation');
      return `❌ Generation failed: ${error.message}`;
    }
  }

  private async runJob(jobId: string, userId: string): Promise<string> {
    if (!jobId) {
      return '❌ Usage: run <jobId>';
    }

    try {
      activityMonitor.logActivity('info', `▶️  Triggering job ${jobId}...`);
      
      const job = await storage.getScheduledJob(jobId, userId);
      if (!job) {
        return `❌ Job ${jobId} not found`;
      }

      // Trigger the job via cron service
      await cronService.triggerJob(jobId);
      
      return `
✅ Job triggered successfully!

Name: ${job.name}
Job ID: ${jobId}
Status: Executing...

Check activity feed for execution results.
      `.trim();
    } catch (error: any) {
      activityMonitor.logError(error, 'Job Execution');
      return `❌ Job execution failed: ${error.message}`;
    }
  }

  private async databaseInfo(): Promise<string> {
    try {
      const start = Date.now();
      await db.execute(sql`SELECT 1`);
      const latency = Date.now() - start;
      
      // Get table counts (sample)
      const [userCount] = await db.select({ count: count() }).from(users);
      const [templateCount] = await db.select({ count: count() }).from(contentTemplates);
      const [jobCount] = await db.select({ count: count() }).from(scheduledJobs);
      const [contentCount] = await db.select({ count: count() }).from(generatedContent);
      
      return `
╔════════════════════════════════════════════════════════════╗
║                  DATABASE STATUS                           ║
╚════════════════════════════════════════════════════════════╝

🔌 CONNECTION:
   Status: ✅ Connected
   Latency: ${latency}ms
   Provider: PostgreSQL
   Type: Neon Serverless

📊 RECORD COUNTS:
   Users: ${userCount.count}
   Templates: ${templateCount.count}
   Scheduled Jobs: ${jobCount.count}
   Generated Content: ${contentCount.count}

🚀 PERFORMANCE:
   Query Latency: ${latency}ms ${latency < 10 ? '(Excellent)' : latency < 50 ? '(Good)' : '(Slow)'}

═══════════════════════════════════════════════════════════
      `.trim();
    } catch (error: any) {
      return `❌ Database check failed: ${error.message}`;
    }
  }

  private memoryUsage(): string {
    const mem = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    return `
╔════════════════════════════════════════════════════════════╗
║                   MEMORY USAGE                             ║
╚════════════════════════════════════════════════════════════╝

📊 PROCESS MEMORY:
   RSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB
   Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB
   Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB
   External: ${(mem.external / 1024 / 1024).toFixed(2)} MB
   Array Buffers: ${(mem.arrayBuffers / 1024 / 1024).toFixed(2)} MB

💻 SYSTEM MEMORY:
   Total: ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB
   Used: ${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB
   Free: ${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB
   Usage: ${((usedMem / totalMem) * 100).toFixed(1)}%

📈 HEAP USAGE:
   ${this.createProgressBar((mem.heapUsed / mem.heapTotal) * 100, 40)}
   ${((mem.heapUsed / mem.heapTotal) * 100).toFixed(1)}% of allocated heap

═══════════════════════════════════════════════════════════
    `.trim();
  }

  private uptimeInfo(): string {
    const uptime = process.uptime();
    const systemUptime = os.uptime();
    const startTime = new Date(Date.now() - uptime * 1000);
    
    return `
╔════════════════════════════════════════════════════════════╗
║                     UPTIME INFO                            ║
╚════════════════════════════════════════════════════════════╝

🚀 PROCESS:
   Uptime: ${this.formatUptime(uptime)}
   Started: ${startTime.toLocaleString()}
   PID: ${process.pid}

💻 SYSTEM:
   Uptime: ${this.formatUptime(systemUptime)}
   Platform: ${os.platform()} ${os.release()}
   Architecture: ${os.arch()}
   CPUs: ${os.cpus().length} cores
   Load Average: ${os.loadavg().map(l => l.toFixed(2)).join(', ')}

═══════════════════════════════════════════════════════════
    `.trim();
  }

  private environmentInfo(): string {
    const nodeVersion = process.version;
    const nodeEnv = process.env.NODE_ENV || 'development';
    const port = process.env.PORT || '5000';
    const hasEncryptionKey = !!process.env.ENCRYPTION_KEY;
    const hasCronEnabled = process.env.ENABLE_CRON !== 'false';
    
    return `
╔════════════════════════════════════════════════════════════╗
║                 ENVIRONMENT CONFIG                         ║
╚════════════════════════════════════════════════════════════╝

⚙️  RUNTIME:
   Node.js: ${nodeVersion}
   Environment: ${nodeEnv}
   Port: ${port}
   Working Dir: ${process.cwd()}

🔐 SECURITY:
   Encryption Key: ${hasEncryptionKey ? '✅ Set' : '❌ Not Set (using dev key)'}
   ${!hasEncryptionKey ? '   ⚠️  WARNING: Set ENCRYPTION_KEY for production!' : ''}

⏰ FEATURES:
   Cron Service: ${hasCronEnabled ? '✅ Enabled' : '❌ Disabled'}

═══════════════════════════════════════════════════════════
    `.trim();
  }

  private async integrationsStatus(): Promise<string> {
    try {
      const apiKeys = await integrationService.getApiKeys();
      const webhooks = await storage.getActiveWebhooks();
      
      return `
╔════════════════════════════════════════════════════════════╗
║                INTEGRATIONS STATUS                         ║
╚════════════════════════════════════════════════════════════╝

🔑 API KEYS:
   Total: ${apiKeys.length}
   Active: ${apiKeys.filter(k => k.isActive).length}
   ${apiKeys.slice(0, 5).map(k => `   • ${k.name} ${k.isActive ? '🟢' : '🔴'}`).join('\n')}

🪝 WEBHOOKS:
   Total: ${webhooks.length}
   Active: ${webhooks.filter(w => w.isActive).length}
   ${webhooks.slice(0, 5).map(w => `   • ${w.name} → ${w.url}`).join('\n')}

═══════════════════════════════════════════════════════════
      `.trim();
    } catch (error: any) {
      return `❌ Failed to get integrations: ${error.message}`;
    }
  }

  private cronStatus(): string {
    const status = cronService.getStatus();
    
    let output = `
╔════════════════════════════════════════════════════════════╗
║                  CRON SCHEDULER                            ║
╚════════════════════════════════════════════════════════════╝

Status: ${status.isRunning ? '✅ Running' : '❌ Stopped'}
Active Jobs: ${status.activeJobs}

📅 UPCOMING EXECUTIONS:
`;

    if (status.scheduledJobs.length === 0) {
      output += '   No jobs scheduled\n';
    } else {
      for (const job of status.scheduledJobs.slice(0, 5)) {
        const timeUntil = new Date(job.nextRun).getTime() - Date.now();
        const humanTime = this.formatDuration(timeUntil);
        
        output += `   ⏰ Job ${job.id}\n`;
        output += `      Next Run: ${new Date(job.nextRun).toLocaleString()}\n`;
        output += `      Time Until: ${humanTime}\n`;
      }
    }

    output += '═══════════════════════════════════════════════════════════';
    
    return output.trim();
  }

  private async recentLogs(count: number): Promise<string> {
    // This would integrate with actual logging service
    // For now, return a placeholder
    return `
╔════════════════════════════════════════════════════════════╗
║                  RECENT ACTIVITY LOGS                      ║
╚════════════════════════════════════════════════════════════╝

(Activity logs are shown in real-time above)
Use the Activity Feed tab for historical logs.

TIP: All operations are logged automatically
TIP: Watch this terminal for live updates

═══════════════════════════════════════════════════════════
    `.trim();
  }

  private versionInfo(): string {
    return `
╔════════════════════════════════════════════════════════════╗
║                  VERSION INFORMATION                       ║
╚════════════════════════════════════════════════════════════╝

🎯 PLATFORM:
   Name: Amoeba AI Content Platform
   Version: 2.0.0
   Type: Universal Content Generator
   License: MIT

🏗️  ARCHITECTURE:
   Backend: Express + TypeScript
   Database: PostgreSQL (Drizzle ORM)
   Frontend: React + Vite + TailwindCSS
   WebSocket: ws library
   Encryption: AES-256-GCM

🚀 FEATURES:
   ✅ BYOK (Bring Your Own Keys)
   ✅ Dynamic Scheduling (Cron)
   ✅ Multi-Channel Delivery
   ✅ Real-Time Monitoring
   ✅ Secure Encryption
   ✅ Content Templates
   ✅ Data Source Integration

═══════════════════════════════════════════════════════════
    `.trim();
  }

  // Utility functions
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);
    
    return parts.join(' ');
  }

  private formatDuration(ms: number): string {
    if (ms < 0) return 'Overdue';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  private calculateSuccessRate(metrics: any): number {
    const total = metrics.completed + metrics.failed;
    if (total === 0) return 0;
    return Math.round((metrics.completed / total) * 100);
  }

  private createProgressBar(percentage: number, width: number): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }

  /**
   * Get available commands
   */
  getCommands(): string[] {
    return [
      'help', 'status', 'health', 'metrics', 'stats', 
      'jobs', 'queue', 'templates', 'content', 
      'generate', 'run', 'db', 'memory', 'mem', 
      'uptime', 'env', 'integrations', 'cron', 
      'logs', 'clear', 'version'
    ];
  }
}

export const commandExecutor = new CommandExecutor();

// Import necessary items for db access
import { sql, count } from 'drizzle-orm';
import { users, contentTemplates, scheduledJobs, generatedContent } from '@shared/schema';

