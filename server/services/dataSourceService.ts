import { storage } from '../storage';
import { activityMonitor } from './activityMonitor';
import Parser from 'rss-parser';

/**
 * Data Source Service
 * Fetches data from various sources for template variables
 */

interface FetchOptions {
  dataSourceId: string;
  userId: string;
  limit?: number;
}

interface FetchResult {
  success: boolean;
  data: any;
  metadata: {
    source: string;
    itemCount: number;
    timestamp: string;
  };
  error?: string;
}

export class DataSourceService {
  private rssParser: Parser;

  constructor() {
    this.rssParser = new Parser({
      customFields: {
        item: ['media:content', 'content:encoded'],
      },
    });
  }

  /**
   * Fetch data from source
   */
  async fetch(options: FetchOptions): Promise<FetchResult> {
    try {
      activityMonitor.logActivity('debug', `📥 Fetching data from source ${options.dataSourceId}`);

      // Get data source configuration
      const dataSource = await storage.getDataSource(options.dataSourceId, options.userId);
      
      if (!dataSource) {
        throw new Error('Data source not found');
      }

      if (!dataSource.isActive) {
        throw new Error(`Data source "${dataSource.name}" is inactive`);
      }

      // Fetch based on type
      let result: FetchResult;

      switch (dataSource.type) {
        case 'rss':
          result = await this.fetchRSS(dataSource, options.limit);
          break;
        
        case 'api':
        case 'rest':
          result = await this.fetchAPI(dataSource);
          break;
        
        case 'webhook':
          result = await this.fetchWebhook(dataSource);
          break;
        
        case 'static':
          result = await this.fetchStatic(dataSource);
          break;
        
        default:
          throw new Error(`Unsupported data source type: ${dataSource.type}`);
      }

      // Update last fetched
      await storage.updateDataSource(dataSource.id, options.userId, {
        lastFetch: new Date(),
        errorCount: 0,
      });

      activityMonitor.logActivity('success', 
        `✅ Fetched ${result.metadata.itemCount} items from ${dataSource.name}`
      );

      return result;

    } catch (error: any) {
      activityMonitor.logError(error, 'Data Source Fetch');
      
      // Increment error count
      try {
        const dataSource = await storage.getDataSource(options.dataSourceId, options.userId);
        if (dataSource) {
          await storage.updateDataSource(dataSource.id, options.userId, {
            errorCount: (dataSource.errorCount || 0) + 1,
          });
        }
      } catch {}

      throw error;
    }
  }

  /**
   * Fetch RSS feed
   */
  private async fetchRSS(dataSource: any, limit?: number): Promise<FetchResult> {
    try {
      const config = dataSource.config || {};
      const url = config.url;

      if (!url) {
        throw new Error('RSS feed URL not configured');
      }

      const feed = await this.rssParser.parseURL(url);
      
      let items = feed.items || [];
      
      // Limit items if specified
      if (limit && limit > 0) {
        items = items.slice(0, limit);
      }

      // Extract relevant data
      const data = items.map(item => ({
        title: item.title || '',
        link: item.link || '',
        description: item.contentSnippet || item.content || '',
        pubDate: item.pubDate || item.isoDate || '',
        author: item.creator || item.author || '',
        categories: item.categories || [],
        content: item['content:encoded'] || item.content || '',
      }));

      return {
        success: true,
        data,
        metadata: {
          source: dataSource.name,
          itemCount: data.length,
          timestamp: new Date().toISOString(),
        },
      };

    } catch (error: any) {
      return {
        success: false,
        data: null,
        metadata: {
          source: dataSource.name,
          itemCount: 0,
          timestamp: new Date().toISOString(),
        },
        error: `RSS fetch failed: ${error.message}`,
      };
    }
  }

  /**
   * Fetch from REST API
   */
  private async fetchAPI(dataSource: any): Promise<FetchResult> {
    try {
      const config = dataSource.config || {};
      const url = config.url;
      const method = config.method || 'GET';
      const headers = config.headers || {};

      if (!url) {
        throw new Error('API URL not configured');
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        ...(config.body && { body: JSON.stringify(config.body) }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract data using JSONPath if configured
      let extractedData = data;
      if (config.dataPath) {
        extractedData = this.extractByPath(data, config.dataPath);
      }

      const itemCount = Array.isArray(extractedData) ? extractedData.length : 1;

      return {
        success: true,
        data: extractedData,
        metadata: {
          source: dataSource.name,
          itemCount,
          timestamp: new Date().toISOString(),
        },
      };

    } catch (error: any) {
      return {
        success: false,
        data: null,
        metadata: {
          source: dataSource.name,
          itemCount: 0,
          timestamp: new Date().toISOString(),
        },
        error: `API fetch failed: ${error.message}`,
      };
    }
  }

  /**
   * Fetch from webhook (return cached data)
   */
  private async fetchWebhook(dataSource: any): Promise<FetchResult> {
    // Webhooks push data to us, so we return the last received data
    const config = dataSource.config || {};
    const cachedData = config.lastData || null;

    return {
      success: !!cachedData,
      data: cachedData,
      metadata: {
        source: dataSource.name,
        itemCount: cachedData ? 1 : 0,
        timestamp: new Date().toISOString(),
      },
      error: cachedData ? undefined : 'No webhook data received yet',
    };
  }

  /**
   * Fetch static data
   */
  private async fetchStatic(dataSource: any): Promise<FetchResult> {
    const config = dataSource.config || {};
    const data = config.data || {};

    return {
      success: true,
      data,
      metadata: {
        source: dataSource.name,
        itemCount: Array.isArray(data) ? data.length : 1,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Extract data by path (simple JSONPath-like)
   */
  private extractByPath(data: any, path: string): any {
    const parts = path.split('.');
    let current = data;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return null;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Test data source connection
   */
  async test(dataSourceId: string, userId: string): Promise<{
    success: boolean;
    message: string;
    sampleData?: any;
  }> {
    try {
      const result = await this.fetch({
        dataSourceId,
        userId,
        limit: 3, // Test with small sample
      });

      return {
        success: result.success,
        message: result.success
          ? `✓ Connected successfully. Found ${result.metadata.itemCount} items.`
          : `✗ Connection failed: ${result.error}`,
        sampleData: result.success ? result.data : undefined,
      };

    } catch (error: any) {
      return {
        success: false,
        message: `✗ Test failed: ${error.message}`,
      };
    }
  }
}

export const dataSourceService = new DataSourceService();

