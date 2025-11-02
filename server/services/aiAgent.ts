import OpenAI from "openai";
import { storage } from '../storage';
import type { AgentConversation } from '@shared/schema';
import { commandExecutor } from './commandExecutor';
import { contentGenerationService } from './contentGenerationService';
import { activityMonitor } from './activityMonitor';

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "" 
});

interface AgentContext {
  userId: string;
  systemMetrics?: any;
  recentLogs?: any[];
  campaigns?: any[];
}

interface AgentResponse {
  message: string;
  actions?: AgentAction[];
  suggestions?: string[];
  commandExecuted?: boolean;
  commandResult?: string;
}

interface AgentAction {
  type: string;
  parameters: any;
  description: string;
  command?: string; // Actual command to execute
}

export class AIAgent {
  private systemPrompt = `You are Amoeba AI, an intelligent operations agent with full control over the Amoeba content generation platform. You help users manage templates, generate content, schedule jobs, monitor system health, and optimize operations through natural language commands.

Your capabilities include:
1. CONTENT MANAGEMENT:
   - Create, list, and manage content templates
   - Generate content on demand
   - View generated content history

2. SCHEDULING & AUTOMATION:
   - Create and manage scheduled jobs (cron syntax)
   - Run jobs immediately
   - Monitor job execution status

3. CREDENTIALS & CONFIGURATION:
   - Help users add AI credentials (OpenAI, Anthropic, Cohere)
   - Configure email delivery (SendGrid, AWS SES)
   - Set up data sources and output channels

4. SYSTEM MONITORING:
   - Check system health and readiness
   - View metrics and performance
   - Monitor database and memory usage
   - Review recent logs and activity

5. COMMAND EXECUTION:
   You can execute platform commands directly. Available commands:
   - status, health - System health check
   - jobs - List scheduled jobs
   - templates - List content templates
   - content - Recent generated content
   - generate <id> - Generate content from template
   - run <id> - Execute a scheduled job
   - queue - Queue status
   - db - Database info
   - memory - Memory usage
   - logs - Recent system logs
   - metrics - System metrics

IMPORTANT: When users ask you to DO something (not just explain), you should:
1. Parse their intent into specific actions
2. Return actions with the 'command' field containing the exact command to execute
3. Explain what you're about to do

Example user requests and your responses:
- "Show me system status" → Execute command: "status"
- "Create a blog post" → Ask for template details, then guide them
- "Run my daily newsletter" → Find their newsletter job and execute command: "run <job-id>"
- "What's in the queue?" → Execute command: "queue"

Response format: Return JSON with:
- 'message' (string): Your explanation/response to the user
- 'actions' (array, optional): Specific actions with 'command' field for executable commands
- 'suggestions' (array, optional): Helpful recommendations
- 'needsMoreInfo' (boolean, optional): true if you need clarification

Always be helpful, proactive, and execute commands when appropriate.`;

  async processMessage(
    userId: string,
    message: string,
    context?: AgentContext
  ): Promise<AgentResponse> {
    try {
      activityMonitor.logActivity('info', `🤖 AI Agent processing: "${message}"`);
      
      const conversationHistory = await storage.getAgentConversations(userId, 5);
      
      const contextualPrompt = this.buildContextualPrompt(message, context, conversationHistory);
      
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: contextualPrompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1500,
      });

      const agentResponse = JSON.parse(response.choices[0].message.content || '{}');
      
      // Execute commands if any actions contain command field
      let commandExecuted = false;
      let commandResult = '';
      
      if (agentResponse.actions && agentResponse.actions.length > 0) {
        for (const action of agentResponse.actions) {
          if (action.command) {
            activityMonitor.logActivity('info', `🤖 AI Agent executing: ${action.command}`);
            try {
              commandResult = await commandExecutor.execute(action.command, userId);
              commandExecuted = true;
              activityMonitor.logActivity('success', `✅ AI Agent command completed: ${action.command}`);
            } catch (cmdError: any) {
              commandResult = `Command execution failed: ${cmdError.message}`;
              activityMonitor.logError(cmdError, `AI Agent command: ${action.command}`);
            }
            break; // Execute only the first command for now
          }
        }
      }
      
      // Store the conversation
      await storage.createAgentConversation({
        userId,
        message,
        response: agentResponse.message || 'I apologize, but I had trouble processing that request.',
        context: { 
          ...context, 
          timestamp: new Date().toISOString(),
          commandExecuted,
          commandResult: commandExecuted ? commandResult : undefined,
        },
      });

      return {
        message: agentResponse.message || 'I apologize, but I had trouble processing that request.',
        actions: agentResponse.actions || [],
        suggestions: agentResponse.suggestions || [],
        commandExecuted,
        commandResult: commandExecuted ? commandResult : undefined,
      };
    } catch (error) {
      console.error('AI Agent error:', error);
      activityMonitor.logError(error as Error, 'AI Agent');
      return {
        message: 'I apologize, but I encountered an error processing your request. Please try again.',
        actions: [],
        suggestions: [],
      };
    }
  }

  private buildContextualPrompt(
    message: string,
    context?: AgentContext,
    history?: AgentConversation[]
  ): string {
    let prompt = `User message: "${message}"\n\n`;

    if (context?.systemMetrics) {
      prompt += `Current system metrics:
- Total emails today: ${context.systemMetrics.emailsToday || 0}
- Delivery rate: ${context.systemMetrics.deliveryRate || 'N/A'}
- Queue depth: ${context.systemMetrics.queueDepth || 0}
- Active users: ${context.systemMetrics.activeUsers || 0}\n\n`;
    }

    if (context?.recentLogs && context.recentLogs.length > 0) {
      prompt += `Recent email activity (last 5 entries):\n`;
      context.recentLogs.slice(0, 5).forEach(log => {
        prompt += `- ${log.status}: ${log.recipient} (${log.subject})\n`;
      });
      prompt += '\n';
    }

    if (context?.campaigns && context.campaigns.length > 0) {
      prompt += `Active campaigns:\n`;
      context.campaigns.forEach(campaign => {
        prompt += `- ${campaign.name}: ${campaign.status}\n`;
      });
      prompt += '\n';
    }

    if (history && history.length > 0) {
      prompt += `Recent conversation history:\n`;
      history.reverse().forEach(conv => {
        prompt += `User: ${conv.message}\nAgent: ${conv.response}\n\n`;
      });
    }

    prompt += `Please respond with helpful information and actionable suggestions. Format your response as JSON with 'message', optional 'actions' array, and optional 'suggestions' array.`;

    return prompt;
  }

  async analyzeEmailPerformance(userId: string, timeframe: 'day' | 'week' | 'month' = 'day'): Promise<AgentResponse> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      const metrics = await storage.getEmailMetrics(userId, startDate, endDate);
      const campaigns = await storage.getCampaigns(userId);
      
      const analysisPrompt = `Analyze this email performance data for the last ${timeframe}:

Metrics:
- Total emails: ${metrics.total}
- Sent: ${metrics.sent}
- Delivered: ${metrics.delivered}
- Bounced: ${metrics.bounced}
- Failed: ${metrics.failed}

Active campaigns: ${campaigns.length}

Provide insights, identify issues, and suggest optimizations. Format as JSON with 'message', 'actions', and 'suggestions'.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: analysisPrompt }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Performance analysis error:', error);
      return {
        message: 'Unable to analyze email performance at this time.',
        suggestions: [],
      };
    }
  }

  async suggestOptimizations(userId: string): Promise<string[]> {
    try {
      const metrics = await storage.getEmailMetrics(userId);
      const campaigns = await storage.getCampaigns(userId);
      const recentLogs = await storage.getEmailLogs(userId, 100);

      const deliveryRate = metrics.total > 0 ? (metrics.delivered / metrics.total) * 100 : 0;
      const bounceRate = metrics.total > 0 ? (metrics.bounced / metrics.total) * 100 : 0;

      const suggestions: string[] = [];

      if (deliveryRate < 95) {
        suggestions.push("Delivery rate is below optimal. Consider reviewing your email list hygiene and sender reputation.");
      }

      if (bounceRate > 5) {
        suggestions.push("High bounce rate detected. Implement email validation and list cleaning procedures.");
      }

      if (campaigns.length === 0) {
        suggestions.push("No active campaigns found. Consider setting up automated email sequences.");
      }

      const activeCampaigns = campaigns.filter(c => c.status === 'active');
      if (activeCampaigns.length > 10) {
        suggestions.push("Many active campaigns detected. Consider consolidating or scheduling to avoid overwhelming recipients.");
      }

      return suggestions;
    } catch (error) {
      console.error('Optimization suggestions error:', error);
      return ["Unable to generate optimization suggestions at this time."];
    }
  }

  /**
   * Check if AI Agent is available and functional
   */
  async checkHealth(): Promise<{ available: boolean; model: string; error?: string }> {
    try {
      const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR;
      
      if (!apiKey) {
        return {
          available: false,
          model: 'gpt-5',
          error: 'OpenAI API key not configured',
        };
      }

      // Quick test to verify API connectivity
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: "You are a health check assistant." },
          { role: "user", content: "Respond with OK" }
        ],
        max_completion_tokens: 10,
      });

      if (response.choices && response.choices.length > 0) {
        return {
          available: true,
          model: 'gpt-5',
        };
      }

      return {
        available: false,
        model: 'gpt-5',
        error: 'Unexpected response from OpenAI API',
      };
    } catch (error: any) {
      return {
        available: false,
        model: 'gpt-5',
        error: error.message || 'Failed to connect to OpenAI API',
      };
    }
  }
}

export const aiAgent = new AIAgent();
