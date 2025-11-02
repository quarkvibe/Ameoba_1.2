import { activityMonitor } from './activityMonitor';
import { dataSourceService } from './dataSourceService';
import Parser from 'rss-parser';

/**
 * AI Tools Service
 * Provides native tools for AI agents to use (function calling)
 * 
 * BASELINE TOOLS (No API keys required):
 * - fetch_rss_feed: Get articles from RSS feeds
 * - fetch_webpage: Get content from any URL
 * - extract_text: Parse HTML and extract clean text
 * - fetch_json: GET request to JSON API
 * - extract_data: JSONPath extraction from data
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  handler: (params: any, context?: any) => Promise<any>;
}

export interface ToolExecutionResult {
  success: boolean;
  data: any;
  error?: string;
  metadata?: {
    executionTime: number;
    toolName: string;
  };
}

class AIToolsService {
  
  private tools: Map<string, ToolDefinition> = new Map();
  private rssParser: Parser;
  
  constructor() {
    this.rssParser = new Parser({
      customFields: {
        item: ['media:content', 'content:encoded'],
      },
    });
    
    this.registerNativeTools();
  }
  
  /**
   * Register baseline native tools (no API keys required)
   */
  private registerNativeTools() {
    
    // ==================================================================
    // TOOL 1: Fetch RSS Feed
    // ==================================================================
    this.registerTool({
      name: 'fetch_rss_feed',
      description: 'Fetches and parses an RSS feed to get latest articles, news, or blog posts. Returns titles, links, descriptions, and publication dates.',
      parameters: {
        type: 'object',
        properties: {
          feed_url: {
            type: 'string',
            description: 'The URL of the RSS feed (e.g., https://feeds.finance.yahoo.com/rss/topstories)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of articles to return (default: 10, max: 50)',
          },
        },
        required: ['feed_url'],
      },
      handler: async (params) => {
        const { feed_url, limit = 10 } = params;
        
        activityMonitor.logActivity('debug', `📰 Fetching RSS feed: ${feed_url}`);
        
        try {
          const feed = await this.rssParser.parseURL(feed_url);
          
          const items = (feed.items || [])
            .slice(0, Math.min(limit, 50))
            .map(item => ({
              title: item.title || '',
              link: item.link || '',
              description: item.contentSnippet || item.content || item.description || '',
              pubDate: item.pubDate || item.isoDate || '',
              author: item.creator || item.author || '',
              categories: item.categories || [],
            }));
          
          activityMonitor.logActivity('success', `✅ Fetched ${items.length} items from RSS feed`);
          
          return {
            feed_title: feed.title,
            feed_description: feed.description,
            items,
            total: items.length,
          };
        } catch (error: any) {
          activityMonitor.logError(error, 'RSS Feed Fetch');
          throw new Error(`Failed to fetch RSS feed: ${error.message}`);
        }
      },
    });
    
    // ==================================================================
    // TOOL 2: Fetch Webpage
    // ==================================================================
    this.registerTool({
      name: 'fetch_webpage',
      description: 'Fetches the HTML content of a webpage. Use this to get the raw content of any web page.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL of the webpage to fetch',
          },
          extract_text: {
            type: 'boolean',
            description: 'If true, extracts clean text from HTML (default: true)',
          },
        },
        required: ['url'],
      },
      handler: async (params) => {
        const { url, extract_text = true } = params;
        
        activityMonitor.logActivity('debug', `🌐 Fetching webpage: ${url}`);
        
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Amoeba-AI-Agent/1.0 (Content Generation Bot)',
            },
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const html = await response.text();
          
          if (extract_text) {
            const text = this.extractTextFromHTML(html);
            activityMonitor.logActivity('success', `✅ Fetched and extracted ${text.length} chars from webpage`);
            return {
              url,
              text,
              length: text.length,
            };
          } else {
            activityMonitor.logActivity('success', `✅ Fetched ${html.length} chars of HTML`);
            return {
              url,
              html,
              length: html.length,
            };
          }
        } catch (error: any) {
          activityMonitor.logError(error, 'Webpage Fetch');
          throw new Error(`Failed to fetch webpage: ${error.message}`);
        }
      },
    });
    
    // ==================================================================
    // TOOL 3: Extract Text from HTML
    // ==================================================================
    this.registerTool({
      name: 'extract_text',
      description: 'Extracts clean, readable text from HTML content. Removes scripts, styles, and formatting.',
      parameters: {
        type: 'object',
        properties: {
          html: {
            type: 'string',
            description: 'The HTML content to extract text from',
          },
          max_length: {
            type: 'number',
            description: 'Maximum length of extracted text (default: 10000)',
          },
        },
        required: ['html'],
      },
      handler: async (params) => {
        const { html, max_length = 10000 } = params;
        
        activityMonitor.logActivity('debug', '📝 Extracting text from HTML');
        
        try {
          const text = this.extractTextFromHTML(html, max_length);
          
          activityMonitor.logActivity('success', `✅ Extracted ${text.length} characters of text`);
          
          return {
            text,
            length: text.length,
            truncated: text.length >= max_length,
          };
        } catch (error: any) {
          activityMonitor.logError(error, 'HTML Text Extraction');
          throw new Error(`Failed to extract text: ${error.message}`);
        }
      },
    });
    
    // ==================================================================
    // TOOL 4: Fetch JSON API
    // ==================================================================
    this.registerTool({
      name: 'fetch_json',
      description: 'Makes an HTTP GET request to a JSON API and returns the parsed response.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The API endpoint URL',
          },
          headers: {
            type: 'object',
            description: 'Optional HTTP headers (e.g., {"Authorization": "Bearer token"})',
          },
        },
        required: ['url'],
      },
      handler: async (params) => {
        const { url, headers = {} } = params;
        
        activityMonitor.logActivity('debug', `🔌 Fetching JSON from API: ${url}`);
        
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Amoeba-AI-Agent/1.0',
              ...headers,
            },
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          activityMonitor.logActivity('success', `✅ Fetched JSON data from API`);
          
          return data;
        } catch (error: any) {
          activityMonitor.logError(error, 'JSON API Fetch');
          throw new Error(`Failed to fetch JSON: ${error.message}`);
        }
      },
    });
    
    // ==================================================================
    // TOOL 5: Extract Data (JSONPath-like)
    // ==================================================================
    this.registerTool({
      name: 'extract_data',
      description: 'Extracts specific data from a JSON object using a path (e.g., "items[0].title")',
      parameters: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            description: 'The JSON data to extract from',
          },
          path: {
            type: 'string',
            description: 'The path to the data (e.g., "items[0].title" or "results.data")',
          },
        },
        required: ['data', 'path'],
      },
      handler: async (params) => {
        const { data, path } = params;
        
        activityMonitor.logActivity('debug', `🔍 Extracting data at path: ${path}`);
        
        try {
          const result = this.extractByPath(data, path);
          
          activityMonitor.logActivity('success', `✅ Extracted data at ${path}`);
          
          return result;
        } catch (error: any) {
          activityMonitor.logError(error, 'Data Extraction');
          throw new Error(`Failed to extract data: ${error.message}`);
        }
      },
    });
    
    // ==================================================================
    // TOOL 6: Optimize for SMS
    // ==================================================================
    this.registerTool({
      name: 'optimize_for_sms',
      description: 'Optimizes content for SMS text message delivery. Shortens to 160-320 characters, removes formatting, makes mobile-friendly.',
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'The content to optimize for SMS',
          },
          max_length: {
            type: 'number',
            description: 'Maximum length in characters (default: 320, which is 2 SMS segments)',
          },
        },
        required: ['content'],
      },
      handler: async (params) => {
        const { content, max_length = 320 } = params;
        
        activityMonitor.logActivity('debug', '📱 Optimizing content for SMS');
        
        let optimized = content;
        
        // Remove HTML/markdown
        optimized = optimized.replace(/<[^>]+>/g, '');
        optimized = optimized.replace(/[*_`#]/g, '');
        
        // Remove extra whitespace
        optimized = optimized.replace(/\s+/g, ' ').trim();
        
        // Shorten if needed
        if (optimized.length > max_length) {
          // Try to cut at sentence boundary
          const sentences = optimized.split(/[.!?]+/);
          optimized = '';
          for (const sentence of sentences) {
            if ((optimized + sentence).length <= max_length - 3) {
              optimized += sentence + '. ';
            } else {
              break;
            }
          }
          
          if (optimized.length === 0) {
            // Couldn't fit any full sentences, just truncate
            optimized = content.substring(0, max_length - 3) + '...';
          }
        }
        
        const segments = Math.ceil(optimized.length / 160);
        
        activityMonitor.logActivity('success', `✅ Optimized for SMS: ${optimized.length} chars (${segments} segments)`);
        
        return {
          optimized,
          original_length: content.length,
          optimized_length: optimized.length,
          sms_segments: segments,
          estimated_cost: segments * 0.0075,
        };
      },
    });
    
    // ==================================================================
    // TOOL 7: Optimize for Voice
    // ==================================================================
    this.registerTool({
      name: 'optimize_for_voice',
      description: 'Optimizes content for text-to-speech voice delivery. Adds pauses, expands abbreviations, formats for listening comprehension.',
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'The content to optimize for voice',
          },
          max_sentences: {
            type: 'number',
            description: 'Maximum number of sentences (default: 10, voice attention span)',
          },
        },
        required: ['content'],
      },
      handler: async (params) => {
        const { content, max_sentences = 10 } = params;
        
        activityMonitor.logActivity('debug', '🎙️ Optimizing content for voice');
        
        // Split into sentences
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Limit sentences for voice (attention span)
        const voiceSentences = sentences.slice(0, max_sentences);
        
        // Add explicit pauses
        let optimized = voiceSentences
          .map((s: string) => s.trim())
          .join('. <break time="700ms"/> ') + '.';
        
        // Expand abbreviations for voice
        const abbreviations: Record<string, string> = {
          'AI': 'A I',
          'API': 'A P I',
          'CEO': 'C E O',
          'USD': 'U S Dollars',
          'Dr.': 'Doctor',
          'Mr.': 'Mister',
          'Mrs.': 'Missus',
        };
        
        for (const [abbrev, expansion] of Object.entries(abbreviations)) {
          const regex = new RegExp(`\\b${abbrev.replace('.', '\\.')}\\b`, 'g');
          optimized = optimized.replace(regex, expansion);
        }
        
        // Estimate duration (average speaking rate: 150 words/minute)
        const wordCount = optimized.split(/\s+/).length;
        const estimatedMinutes = wordCount / 150;
        const estimatedCost = estimatedMinutes * 0.013; // Twilio voice cost
        
        activityMonitor.logActivity('success', `✅ Optimized for voice: ${wordCount} words (~${estimatedMinutes.toFixed(1)} min)`);
        
        return {
          optimized,
          original_length: content.length,
          word_count: wordCount,
          estimated_duration_minutes: Math.round(estimatedMinutes * 10) / 10,
          estimated_cost: Math.round(estimatedCost * 1000) / 1000,
        };
      },
    });
    
    console.log(`✅ Registered ${this.tools.size} native AI tools`);
  }
  
  /**
   * Register a custom tool
   */
  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }
  
  /**
   * Get all available tools in OpenAI/Anthropic function format
   */
  getToolDefinitions(): any[] {
    return Array.from(this.tools.values()).map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }
  
  /**
   * Get single tool definition
   */
  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }
  
  /**
   * Execute a tool
   */
  async executeTool(
    toolName: string,
    parameters: any,
    context?: any
  ): Promise<ToolExecutionResult> {
    
    const startTime = Date.now();
    const tool = this.tools.get(toolName);
    
    if (!tool) {
      return {
        success: false,
        data: null,
        error: `Tool not found: ${toolName}`,
      };
    }
    
    activityMonitor.logActivity('info', `🔧 Executing tool: ${toolName}`);
    
    try {
      const data = await tool.handler(parameters, context);
      const executionTime = Date.now() - startTime;
      
      activityMonitor.logActivity('success', `✅ Tool completed: ${toolName} (${executionTime}ms)`);
      
      return {
        success: true,
        data,
        metadata: {
          executionTime,
          toolName,
        },
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      activityMonitor.logError(error, `Tool execution: ${toolName}`);
      
      return {
        success: false,
        data: null,
        error: error.message,
        metadata: {
          executionTime,
          toolName,
        },
      };
    }
  }
  
  /**
   * Extract clean text from HTML (native - no libraries needed)
   */
  private extractTextFromHTML(html: string, maxLength: number = 10000): string {
    // Remove scripts and styles
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');
    
    // Decode HTML entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–');
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ');
    text = text.trim();
    
    // Limit length
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + '...';
    }
    
    return text;
  }
  
  /**
   * Extract data by path (simple JSONPath-like)
   */
  private extractByPath(data: any, path: string): any {
    // Split path by dots and handle array indices
    // Examples: "items[0].title", "results.data.value"
    
    const parts = path.split('.');
    let current = data;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return null;
      }
      
      // Handle array indices: "items[0]"
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const key = arrayMatch[1];
        const index = parseInt(arrayMatch[2], 10);
        current = current[key];
        if (Array.isArray(current)) {
          current = current[index];
        }
      } else {
        current = current[part];
      }
    }
    
    return current;
  }
  
  /**
   * List all available tools
   */
  listTools(): Array<{ name: string; description: string }> {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
    }));
  }
}

export const aiToolsService = new AIToolsService();

