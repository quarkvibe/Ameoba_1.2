import crypto from 'crypto';
import { storage } from '../storage';
import type { ApiKey, InsertApiKey, Webhook, InsertWebhook, IntegrationLog } from '@shared/schema';

export class IntegrationService {
  /**
   * Generate a new API key for external applications like Zodiac Buddy
   */
  async generateApiKey(name: string, permissions: string[]): Promise<{ key: string; apiKey: ApiKey }> {
    // Generate a secure API key
    const key = `amoeba_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    
    const apiKeyData: InsertApiKey = {
      name,
      keyHash,
      permissions,
      isActive: true,
      expiresAt: null, // No expiration by default
    };
    
    const apiKey = await storage.createApiKey(apiKeyData);
    
    console.log(`✅ Generated API key for ${name}: ${key.substring(0, 20)}...`);
    
    return { key, apiKey };
  }

  /**
   * Validate an API key and return its permissions
   */
  async validateApiKey(key: string): Promise<ApiKey | null> {
    if (!key || !key.startsWith('amoeba_')) {
      return null;
    }
    
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    const apiKey = await storage.getApiKeyByHash(keyHash);
    
    if (!apiKey || !apiKey.isActive) {
      return null;
    }
    
    // Check expiration
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return null;
    }
    
    // Update last used timestamp
    await storage.updateApiKeyLastUsed(apiKey.id);
    
    return apiKey;
  }

  /**
   * Check if an API key has specific permission
   */
  hasPermission(apiKey: ApiKey, permission: string): boolean {
    const permissions = apiKey.permissions as string[];
    return permissions.includes('*') || permissions.includes(permission);
  }

  /**
   * Register a webhook for real-time notifications
   */
  async registerWebhook(data: InsertWebhook): Promise<Webhook> {
    // Generate a secret for webhook signature verification
    const secret = crypto.randomBytes(32).toString('hex');
    
    const webhookData = {
      ...data,
      secret,
      isActive: true,
    };
    
    const webhook = await storage.createWebhook(webhookData);
    
    console.log(`🔗 Registered webhook: ${webhook.name} -> ${webhook.url}`);
    
    return webhook;
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(event: string, data: any): Promise<void> {
    const webhooks = await storage.getActiveWebhooksByEvent(event);
    
    for (const webhook of webhooks) {
      try {
        await this.deliverWebhook(webhook, event, data);
      } catch (error) {
        console.error(`❌ Failed to deliver webhook ${webhook.name}:`, error);
      }
    }
  }

  /**
   * Deliver a single webhook with signature verification
   */
  private async deliverWebhook(webhook: Webhook, event: string, data: any): Promise<void> {
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };
    
    const payloadString = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', webhook.secret!)
      .update(payloadString)
      .digest('hex');
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Amoeba-Signature': `sha256=${signature}`,
          'X-Amoeba-Event': event,
          'User-Agent': 'Amoeba-Horoscope-Service/1.0',
        },
        body: payloadString,
      });
      
      const responseTime = Date.now() - startTime;
      
      // Log the webhook delivery
      await storage.createIntegrationLog({
        type: 'webhook',
        source: webhook.name,
        endpoint: webhook.url,
        method: 'POST',
        statusCode: response.status,
        responseTime,
        metadata: { event, success: response.ok },
      });
      
      // Update webhook last triggered
      await storage.updateWebhookLastTriggered(webhook.id);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log(`✅ Webhook delivered: ${webhook.name} (${responseTime}ms)`);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log the failed webhook delivery
      await storage.createIntegrationLog({
        type: 'webhook',
        source: webhook.name,
        endpoint: webhook.url,
        method: 'POST',
        statusCode: 0,
        responseTime,
        errorMessage,
        metadata: { event, success: false },
      });
      
      throw error;
    }
  }

  /**
   * Log API usage for monitoring
   */
  async logApiUsage(
    source: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    metadata?: any
  ): Promise<void> {
    await storage.createIntegrationLog({
      type: 'api_call',
      source,
      endpoint,
      method,
      statusCode,
      responseTime,
      metadata,
    });
  }

  /**
   * Get integration analytics
   */
  async getIntegrationAnalytics(days: number = 7): Promise<{
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
    recentLogs: IntegrationLog[];
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    const logs = await storage.getIntegrationLogsSince(since);
    
    const totalRequests = logs.length;
    const avgResponseTime = logs.reduce((sum, log) => sum + (log.responseTime || 0), 0) / totalRequests || 0;
    const errors = logs.filter(log => log.statusCode >= 400 || !!log.errorMessage);
    const errorRate = errors.length / totalRequests || 0;
    
    // Count endpoint usage
    const endpointCounts = logs.reduce((acc, log) => {
      if (log.endpoint) {
        acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topEndpoints = Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const recentLogs = logs.slice(-20).reverse();
    
    return {
      totalRequests,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      topEndpoints,
      recentLogs,
    };
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(apiKeyId: string): Promise<void> {
    await storage.deactivateApiKey(apiKeyId);
    console.log(`🔒 Revoked API key: ${apiKeyId}`);
  }

  /**
   * Get all active API keys
   */
  async getApiKeys(): Promise<ApiKey[]> {
    return storage.getActiveApiKeys();
  }

  /**
   * Get all active webhooks
   */
  async getWebhooks(): Promise<Webhook[]> {
    return storage.getActiveWebhooks();
  }
}

export const integrationService = new IntegrationService();