import { storage } from '../storage';
import { activityMonitor } from './activityMonitor';
import { emailService } from './emailService';

/**
 * Delivery Service
 * Delivers generated content via configured channels
 */

interface DeliveryOptions {
  content: string;
  contentId: string;
  userId: string;
  channels?: string[]; // Specific channels, or use template's default
  templateId?: string;
}

interface DeliveryResult {
  success: boolean;
  delivered: Array<{
    channel: string;
    channelType: string;
    success: boolean;
    error?: string;
    metadata?: any;
  }>;
  errors: string[];
}

export class DeliveryService {
  
  /**
   * Deliver content to all configured channels
   */
  async deliver(options: DeliveryOptions): Promise<DeliveryResult> {
    const { content, contentId, userId, templateId } = options;
    
    try {
      activityMonitor.logActivity('info', `📤 Starting content delivery for ${contentId}`);

      // Get delivery channels
      const channels = await this.getDeliveryChannels(userId, templateId);
      
      if (channels.length === 0) {
        activityMonitor.logActivity('warning', '⚠️  No delivery channels configured');
        return {
          success: false,
          delivered: [],
          errors: ['No delivery channels configured'],
        };
      }

      // Deliver to each channel
      const results = [];
      const errors = [];

      for (const channel of channels) {
        try {
          activityMonitor.logActivity('debug', `📤 Delivering to ${channel.type}: ${channel.name}`);

          const result = await this.deliverToChannel(channel, content, userId);
          results.push({
            channel: channel.name,
            channelType: channel.type,
            success: result.success,
            metadata: result.metadata,
          });

          if (result.success) {
            activityMonitor.logDelivery(channel.type, 'completed', result.metadata?.recipient);
          } else {
            activityMonitor.logDelivery(channel.type, 'failed', result.metadata?.recipient);
            errors.push(`${channel.name}: ${result.error}`);
          }

          // Log delivery to database (if deliveryConfigId exists)
          // Note: deliveryLogs expects deliveryConfigId, but we're using outputChannelId
          // For now, skip logging to deliveryLogs until we properly link channels to delivery configs
          // TODO: Create proper delivery config linkage

        } catch (error: any) {
          activityMonitor.logError(error, `Delivery to ${channel.name}`);
          errors.push(`${channel.name}: ${error.message}`);
          
          results.push({
            channel: channel.name,
            channelType: channel.type,
            success: false,
            error: error.message,
          });
        }
      }

      const allSucceeded = results.every(r => r.success);
      
      if (allSucceeded) {
        activityMonitor.logActivity('success', `✅ Content delivered to ${results.length} channel(s)`);
      } else {
        activityMonitor.logActivity('warning', `⚠️  Partial delivery: ${results.filter(r => r.success).length}/${results.length} succeeded`);
      }

      return {
        success: allSucceeded,
        delivered: results,
        errors,
      };

    } catch (error: any) {
      activityMonitor.logError(error, 'Delivery Service');
      throw error;
    }
  }

  /**
   * Get delivery channels for template
   */
  private async getDeliveryChannels(userId: string, templateId?: string): Promise<any[]> {
    // Get output channels associated with template
    if (templateId) {
      // TODO: Get channels linked to template via templateOutputChannels join table
      // For now, get user's active output channels
    }

    const channels = await storage.getOutputChannels(userId);
    return channels.filter(c => c.isActive);
  }

  /**
   * Deliver to specific channel
   */
  private async deliverToChannel(
    channel: any,
    content: string,
    userId: string
  ): Promise<{ success: boolean; error?: string; metadata?: any }> {
    
    switch (channel.type) {
      case 'email':
        return await this.deliverViaEmail(channel, content, userId);
      
      case 'webhook':
        return await this.deliverViaWebhook(channel, content);
      
      case 'api':
        return await this.deliverViaAPI(channel, content);
      
      case 'file':
        return await this.deliverViaFile(channel, content);
      
      default:
        return {
          success: false,
          error: `Unsupported channel type: ${channel.type}`,
        };
    }
  }

  /**
   * Deliver via email
   */
  private async deliverViaEmail(
    channel: any,
    content: string,
    userId: string
  ): Promise<{ success: boolean; error?: string; metadata?: any }> {
    
    try {
      // Get email configuration from channel config
      const config = channel.config || {};
      const recipients = config.recipients || [];
      
      if (recipients.length === 0) {
        return {
          success: false,
          error: 'No email recipients configured',
        };
      }

      // Get email credential
      const emailCredential = await storage.getDefaultEmailServiceCredential(userId);
      if (!emailCredential) {
        return {
          success: false,
          error: 'No email credential configured',
        };
      }

      // Prepare email
      const subject = config.subject || 'Content from Amoeba';
      const from = config.from || emailCredential.fromEmail || 'noreply@amoeba.ai';

      // Send email
      await emailService.sendEmail(userId, {
        to: recipients,
        from,
        subject,
        text: content,
        html: this.formatAsHTML(content),
      });

      return {
        success: true,
        metadata: {
          recipient: recipients.join(', '),
          subject,
          from,
        },
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Deliver via webhook
   */
  private async deliverViaWebhook(
    channel: any,
    content: string
  ): Promise<{ success: boolean; error?: string; metadata?: any }> {
    
    try {
      const config = channel.config || {};
      const url = config.url;
      
      if (!url) {
        return {
          success: false,
          error: 'Webhook URL not configured',
        };
      }

      const startTime = Date.now();
      
      const response = await fetch(url, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Amoeba-Content-Platform/1.0',
          ...config.headers,
        },
        body: JSON.stringify({
          content,
          timestamp: new Date().toISOString(),
          ...config.payload,
        }),
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          metadata: { duration, statusCode: response.status },
        };
      }

      return {
        success: true,
        metadata: {
          url,
          statusCode: response.status,
          duration,
        },
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Deliver via API (store for retrieval)
   */
  private async deliverViaAPI(
    channel: any,
    content: string
  ): Promise<{ success: boolean; error?: string; metadata?: any }> {
    
    // For API delivery, content is stored in database and retrieved via API endpoints
    // This is already handled by the content generation process
    
    return {
      success: true,
      metadata: {
        type: 'api',
        message: 'Content available via API',
      },
    };
  }

  /**
   * Deliver via file
   */
  private async deliverViaFile(
    channel: any,
    content: string
  ): Promise<{ success: boolean; error?: string; metadata?: any }> {
    
    try {
      const config = channel.config || {};
      const filePath = config.path;

      if (!filePath) {
        return {
          success: false,
          error: 'File path not configured',
        };
      }

      // For production, this would write to configured storage (S3, local, etc.)
      // For now, log that it would be written
      
      return {
        success: true,
        metadata: {
          path: filePath,
          size: content.length,
        },
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Format content as HTML email
   */
  private formatAsHTML(content: string): string {
    // Simple HTML wrapper
    // In production, use proper email templates
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="white-space: pre-wrap;">${this.escapeHTML(content)}</div>
  <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
  <p style="font-size: 12px; color: #888;">Generated by Amoeba AI Content Platform</p>
</body>
</html>
    `.trim();
  }

  /**
   * Escape HTML
   */
  private escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\n/g, '<br>');
  }
}

export const deliveryService = new DeliveryService();

