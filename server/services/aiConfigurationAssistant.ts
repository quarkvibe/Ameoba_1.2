/**
 * AI Configuration Assistant - Phase 1 of Self-Modifying Amoeba
 * 
 * What it does:
 * - Interprets natural language requests to configure the system
 * - Creates templates, data sources, schedules via API calls
 * - NO CODE MODIFICATION (safe, immediate value)
 * 
 * Example:
 * User: "Create a daily tech news summary from Hacker News"
 * AI: → Creates template
 *     → Creates RSS data source
 *     → Creates schedule (daily at 9am)
 *     → Returns configured workflow
 * 
 * This is the foundation for Phase 2 (actual code generation)
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { storage } from '../storage';
import { activityMonitor } from './activityMonitor';
import type { InsertContentTemplate, InsertDataSource, InsertOutputChannel, InsertScheduledJob } from '@shared/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ""
});

interface ConfigurationIntent {
  action: 'create_template' | 'create_datasource' | 'create_schedule' | 'create_workflow';
  parameters: any;
  explanation: string;
}

interface ConfigurationResult {
  success: boolean;
  message: string;
  created: {
    templates?: any[];
    dataSources?: any[];
    outputChannels?: any[];
    schedules?: any[];
  };
  nextSteps?: string[];
  error?: string;
}

export class AIConfigurationAssistant {
  
  private systemPrompt = `You are Amoeba Configuration Assistant, an intelligent system that helps users set up AI content generation workflows through natural language.

Your job is to interpret user requests and convert them into specific configuration actions.

AVAILABLE ACTIONS:

1. CREATE_TEMPLATE:
   - name: Template name
   - description: What it generates
   - systemPrompt: AI instructions
   - outputFormat: 'text' | 'markdown' | 'html' | 'json'
   - aiProvider: 'openai' | 'anthropic' | 'cohere' | 'ollama'
   - model: Model name (e.g., 'gpt-4', 'claude-3-sonnet')
   - variables: Array of variable names needed

2. CREATE_DATASOURCE:
   - name: Source name
   - type: 'rss' | 'rest_api' | 'webhook' | 'static'
   - config: { url: string, headers?: object, jsonPath?: string }

3. CREATE_SCHEDULE:
   - name: Job name
   - cronExpression: Cron syntax (e.g., '0 9 * * *' for daily at 9am)
   - templateId: Link to template
   - dataSourceId: Link to data source

4. CREATE_WORKFLOW (composite action):
   - Creates template + data source + schedule in one go

EXAMPLES:

User: "Create a daily tech news summary from Hacker News"
Your response:
{
  "action": "create_workflow",
  "parameters": {
    "template": {
      "name": "Tech News Summary",
      "description": "Daily summary of top Hacker News articles",
      "systemPrompt": "You are a tech news curator. Summarize the top stories from Hacker News into a concise, engaging daily digest. Focus on AI, startups, and developer tools.",
      "outputFormat": "markdown",
      "aiProvider": "openai",
      "model": "gpt-4o-mini",
      "variables": ["articles"]
    },
    "dataSource": {
      "name": "Hacker News RSS",
      "type": "rss",
      "config": {
        "url": "https://news.ycombinator.com/rss",
        "jsonPath": "$.items[0:10]"
      }
    },
    "schedule": {
      "name": "Daily Tech News Job",
      "cronExpression": "0 9 * * *"
    }
  },
  "explanation": "I'll create a complete workflow: RSS feed → AI summarization → Daily at 9am"
}

User: "Set up a blog post generator for my SaaS"
Your response:
{
  "action": "create_template",
  "parameters": {
    "name": "SaaS Blog Post",
    "description": "SEO-optimized blog posts for SaaS products",
    "systemPrompt": "You are an expert SaaS content marketer. Write comprehensive, SEO-optimized blog posts that educate and convert. Include practical examples and actionable takeaways.",
    "outputFormat": "markdown",
    "aiProvider": "anthropic",
    "model": "claude-3-sonnet-20240229",
    "variables": ["topic", "keywords", "targetAudience", "callToAction"]
  },
  "explanation": "I'll create a template for generating blog posts. You can provide topic, keywords, and target audience when generating content."
}

IMPORTANT:
- Always respond in valid JSON format
- Be specific with configuration details
- Use appropriate AI models (GPT-4 for quality, GPT-3.5 for cost, Claude for writing)
- Suggest cron expressions that make sense (daily, weekly, hourly)
- Provide clear explanations of what you're creating
`;

  /**
   * Process a natural language configuration request
   */
  async processRequest(userId: string, request: string, provider: 'openai' | 'anthropic' = 'anthropic'): Promise<ConfigurationResult> {
    try {
      activityMonitor.logActivity('info', `🤖 Config Assistant processing: "${request}"`);
      
      // Step 1: Interpret the user's intent
      const intent = await this.interpretIntent(request, provider);
      
      if (!intent) {
        return {
          success: false,
          message: "I couldn't understand that request. Please try rephrasing it.",
          created: {},
          error: "Intent interpretation failed"
        };
      }

      // Step 2: Execute the configuration action
      const result = await this.executeConfiguration(userId, intent);
      
      activityMonitor.logActivity('success', `✅ Config created: ${intent.action}`);
      
      return result;
      
    } catch (error: any) {
      activityMonitor.logError(error, 'AI Configuration Assistant');
      return {
        success: false,
        message: "I encountered an error processing your request.",
        created: {},
        error: error.message
      };
    }
  }

  /**
   * Interpret user's natural language request into structured intent
   */
  private async interpretIntent(request: string, provider: 'openai' | 'anthropic'): Promise<ConfigurationIntent | null> {
    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: request }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } 
    else if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20250514",
        max_tokens: 2000,
        system: this.systemPrompt,
        messages: [{
          role: "user",
          content: request
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        // Claude doesn't have native JSON mode, so we extract JSON from text
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    }
    
    return null;
  }

  /**
   * Execute the configuration based on interpreted intent
   */
  private async executeConfiguration(userId: string, intent: ConfigurationIntent): Promise<ConfigurationResult> {
    const result: ConfigurationResult = {
      success: true,
      message: '',
      created: {}
    };

    try {
      switch (intent.action) {
        case 'create_template':
          const template = await this.createTemplate(userId, intent.parameters);
          result.created.templates = [template];
          result.message = `Created template: "${template.name}"`;
          result.nextSteps = [
            `Generate content: Click "Generate Now" on the template`,
            `Add AI credentials in Settings if you haven't already`,
            `Configure delivery channels to auto-send generated content`
          ];
          break;

        case 'create_datasource':
          const dataSource = await this.createDataSource(userId, intent.parameters);
          result.created.dataSources = [dataSource];
          result.message = `Created data source: "${dataSource.name}"`;
          result.nextSteps = [
            `Link this data source to a template`,
            `Test the data source to verify it's working`
          ];
          break;

        case 'create_schedule':
          const schedule = await this.createSchedule(userId, intent.parameters);
          result.created.schedules = [schedule];
          result.message = `Created schedule: "${schedule.name}" (${schedule.cronExpression})`;
          result.nextSteps = [
            `The job will run automatically based on the schedule`,
            `Monitor execution in the Jobs dashboard`
          ];
          break;

        case 'create_workflow':
          const workflow = await this.createCompleteWorkflow(userId, intent.parameters);
          result.created = workflow;
          result.message = `Created complete workflow with template, data source, and schedule`;
          result.nextSteps = [
            `Test the workflow: Run the job manually to verify it works`,
            `Configure delivery: Add email or webhook outputs`,
            `Add AI credentials: Go to Settings → AI Credentials if you haven't`,
            `The workflow will run automatically: ${intent.parameters.schedule.cronExpression}`
          ];
          break;

        default:
          result.success = false;
          result.message = `Unknown action: ${intent.action}`;
      }

      result.message += `\n\n${intent.explanation}`;
      
    } catch (error: any) {
      result.success = false;
      result.message = `Failed to create configuration: ${error.message}`;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Create a content template
   */
  private async createTemplate(userId: string, params: any) {
    const templateData: InsertContentTemplate = {
      userId,
      name: params.name,
      description: params.description,
      systemPrompt: params.systemPrompt,
      userPrompt: params.userPrompt || `Generate content based on: {{${params.variables?.[0] || 'input'}}}`,
      outputFormat: params.outputFormat || 'markdown',
      aiProvider: params.aiProvider || 'openai',
      model: params.model || 'gpt-4o-mini',
      temperature: params.temperature || 0.7,
      maxTokens: params.maxTokens || 2000,
      variables: params.variables || [],
      metadata: { createdBy: 'ai-assistant' },
      isActive: true
    };

    return await storage.createContentTemplate(templateData);
  }

  /**
   * Create a data source
   */
  private async createDataSource(userId: string, params: any) {
    const dataSourceData: InsertDataSource = {
      userId,
      name: params.name,
      type: params.type,
      config: params.config,
      refreshInterval: params.refreshInterval || 3600, // 1 hour default
      isActive: true,
      metadata: { createdBy: 'ai-assistant' }
    };

    return await storage.createDataSource(dataSourceData);
  }

  /**
   * Create a scheduled job
   */
  private async createSchedule(userId: string, params: any) {
    const scheduleData: InsertScheduledJob = {
      userId,
      name: params.name,
      templateId: params.templateId,
      dataSourceId: params.dataSourceId,
      cronExpression: params.cronExpression,
      isActive: true,
      metadata: { createdBy: 'ai-assistant' }
    };

    return await storage.createScheduledJob(scheduleData);
  }

  /**
   * Create a complete workflow (template + data source + schedule)
   */
  private async createCompleteWorkflow(userId: string, params: any) {
    const created: any = {};

    // 1. Create template
    if (params.template) {
      created.templates = [await this.createTemplate(userId, params.template)];
    }

    // 2. Create data source
    if (params.dataSource) {
      created.dataSources = [await this.createDataSource(userId, params.dataSource)];
    }

    // 3. Create schedule (linking template and data source)
    if (params.schedule && created.templates && created.dataSources) {
      const scheduleWithLinks = {
        ...params.schedule,
        templateId: created.templates[0].id,
        dataSourceId: created.dataSources[0].id
      };
      created.schedules = [await this.createSchedule(userId, scheduleWithLinks)];
    }

    return created;
  }

  /**
   * Suggest configurations based on user's existing setup
   */
  async suggestConfigurations(userId: string): Promise<string[]> {
    try {
      const templates = await storage.getContentTemplates(userId);
      const dataSources = await storage.getDataSources(userId);
      const schedules = await storage.getScheduledJobs(userId);

      const suggestions: string[] = [];

      if (templates.length === 0) {
        suggestions.push("Try: 'Create a daily newsletter template'");
        suggestions.push("Try: 'Set up a blog post generator'");
      }

      if (dataSources.length === 0) {
        suggestions.push("Try: 'Add Hacker News as a data source'");
        suggestions.push("Try: 'Connect to Reddit RSS feed'");
      }

      if (templates.length > 0 && schedules.length === 0) {
        suggestions.push("Try: 'Schedule my template to run daily at 9am'");
      }

      if (templates.length > 0 && dataSources.length > 0 && schedules.length === 0) {
        suggestions.push("Try: 'Create a workflow that combines my template and data source'");
      }

      return suggestions;
      
    } catch (error) {
      return [];
    }
  }
}

export const aiConfigurationAssistant = new AIConfigurationAssistant();

