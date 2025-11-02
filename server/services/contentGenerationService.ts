import { storage } from '../storage';
import { activityMonitor } from './activityMonitor';
import { outputPipelineService, PipelineConfig } from './outputPipelineService';
import { reviewQueueService } from './reviewQueueService';
import { aiToolsService } from './aiToolsService';
import OpenAI from 'openai';
import { Ollama } from 'ollama';

/**
 * Content Generation Service
 * Uses user's encrypted AI credentials to generate content
 */

interface GenerationOptions {
  templateId: string;
  userId: string;
  variables?: Record<string, any>;
  credentialId?: string; // Optional: use specific credential
}

interface GenerationResult {
  content: string;
  status?: 'draft' | 'pending_review' | 'approved' | 'rejected';
  metadata: {
    model: string;
    provider: string;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    cost: number;
    duration: number;
    timestamp: string;
    pipeline?: any;
    reviewRequired?: boolean;
  };
}

export class ContentGenerationService {
  
  /**
   * Generate content from template
   */
  async generate(options: GenerationOptions): Promise<GenerationResult> {
    const startTime = Date.now();
    
    try {
      activityMonitor.logActivity('info', `🤖 Starting content generation for template ${options.templateId}`);

      // 1. Get template
      const template = await storage.getContentTemplate(options.templateId, options.userId);
      if (!template) {
        throw new Error('Template not found');
      }

      activityMonitor.logContentGeneration(template.name, 'started');

      // 2. Get AI credential
      const credential = options.credentialId
        ? await storage.getAiCredential(options.credentialId, options.userId)
        : await storage.getDefaultAiCredential(options.userId);

      if (!credential) {
        throw new Error('No AI credential found. Please add an AI API key in Settings.');
      }

      if (!credential.isActive) {
        throw new Error(`AI credential "${credential.name}" is inactive`);
      }

      // 3. Build prompt with variables
      const prompt = this.buildPrompt(template, options.variables || {});

      // 4. Call AI API based on provider
      const aiResult = await this.callAI(credential, template, prompt);

      // 5. Process output through pipeline
      const settings = template.settings as any || {};
      const pipelineConfig: PipelineConfig = {
        parseFormat: (template.outputFormat as any) || 'text',
        validateOutput: true,
        safetyCheck: settings.safetyCheck !== false,
        qualityScore: settings.qualityScore !== false,
        cleanup: settings.cleanup !== false,
        formatting: {
          removeEmptyLines: true,
          trimWhitespace: true,
          fixPunctuation: true,
          removeDuplicateSpaces: true,
        },
        requireApproval: settings.requireApproval || false,
        autoApprovalRules: settings.autoApprovalRules || [],
        minLength: settings.minLength,
        maxLength: settings.maxLength,
        requiredKeywords: settings.requiredKeywords,
        forbiddenKeywords: settings.forbiddenKeywords,
      };

      const pipelineResult = await outputPipelineService.processOutput(
        aiResult.content,
        pipelineConfig,
        { template, variables: options.variables }
      );

      // 6. Log success
      const duration = Date.now() - startTime;
      activityMonitor.logContentGeneration(
        template.name,
        'completed',
        aiResult.metadata.tokens.total
      );

      activityMonitor.logActivity('success', 
        `✅ Content generated: ${aiResult.metadata.tokens.total} tokens, $${aiResult.metadata.cost.toFixed(4)}, ${duration}ms, quality: ${pipelineResult.metadata.qualityScore || 'N/A'}`
      );

      return {
        content: pipelineResult.processed,
        status: pipelineResult.status,
        metadata: {
          ...aiResult.metadata,
          duration,
          pipeline: pipelineResult.metadata,
          reviewRequired: pipelineResult.status === 'pending_review',
        },
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      activityMonitor.logError(error, 'Content Generation');
      throw error;
    }
  }

  /**
   * Build prompt with variable substitution
   */
  private buildPrompt(template: any, variables: Record<string, any>): string {
    let prompt = template.aiPrompt;

    // Replace {{variable}} with actual values
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      prompt = prompt.replace(regex, String(value));
    }

    // Check for unreplaced variables
    const unreplaced = prompt.match(/{{[^}]+}}/g);
    if (unreplaced) {
      throw new Error(`Missing variables: ${unreplaced.join(', ')}`);
    }

    return prompt;
  }

  /**
   * Call AI API based on provider
   */
  private async callAI(
    credential: any,
    template: any,
    prompt: string
  ): Promise<GenerationResult> {
    
    const provider = credential.provider.toLowerCase();

    switch (provider) {
      case 'openai':
        return await this.callOpenAI(credential, template, prompt);
      
      case 'anthropic':
        return await this.callAnthropic(credential, template, prompt);
      
      case 'cohere':
        return await this.callCohere(credential, template, prompt);
      
      case 'ollama':
        return await this.callOllama(credential, template, prompt);
      
      default:
        throw new Error(`Unsupported AI provider: ${credential.provider}`);
    }
  }

  /**
   * Call OpenAI API (with optional function calling)
   */
  private async callOpenAI(
    credential: any,
    template: any,
    prompt: string
  ): Promise<GenerationResult> {
    
    const client = new OpenAI({
      apiKey: credential.apiKey, // Already decrypted by storage layer
    });

    // Get model from template settings or use default
    const model = template.settings?.model || 'gpt-4o-mini';
    const maxTokens = template.settings?.maxTokens || 1000;
    const temperature = template.settings?.temperature || 0.7;
    const toolsEnabled = template.settings?.toolsEnabled || false;
    const maxToolCalls = template.settings?.maxToolCalls || 10;

    try {
      // Build initial messages
      const messages: any[] = [
        ...(template.systemPrompt ? [{ role: 'system' as const, content: template.systemPrompt }] : []),
        { role: 'user' as const, content: prompt },
      ];
      
      // Get tools if enabled
      const tools = toolsEnabled ? aiToolsService.getToolDefinitions() : undefined;
      
      let totalTokens = 0;
      let toolCallCount = 0;
      let toolsUsed: string[] = [];
      
      // Initial AI call
      let response = await client.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        ...(tools && { tools, tool_choice: 'auto' }),
      });
      
      // Track tokens
      totalTokens += response.usage?.total_tokens || 0;
      
      // Handle function/tool calls (iterative loop)
      while (
        response.choices[0]?.finish_reason === 'tool_calls' &&
        toolCallCount < maxToolCalls
      ) {
        const toolCalls = response.choices[0]?.message?.tool_calls;
        
        if (!toolCalls || toolCalls.length === 0) break;
        
        activityMonitor.logActivity('info', `🔧 AI requesting ${toolCalls.length} tool call(s)`);
        
        // Add assistant's message with tool calls to conversation
        messages.push(response.choices[0].message);
        
        // Execute each tool call
        for (const toolCall of toolCalls) {
          toolCallCount++;
          const toolName = (toolCall as any).function?.name;
          const toolArgs = JSON.parse((toolCall as any).function?.arguments || '{}');
          
          activityMonitor.logActivity('debug', `🔧 Tool: ${toolName} with args: ${JSON.stringify(toolArgs).substring(0, 100)}`);
          toolsUsed.push(toolName);
          
          // Execute tool
          const toolResult = await aiToolsService.executeTool(toolName, toolArgs);
          
          // Add tool result to messages
          messages.push({
            role: 'tool' as const,
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult.data),
          });
          
          activityMonitor.logActivity('success', `✅ Tool ${toolName} executed successfully`);
        }
        
        // Continue conversation with tool results
        response = await client.chat.completions.create({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
          ...(tools && { tools, tool_choice: 'auto' }),
        });
        
        // Track tokens
        totalTokens += response.usage?.total_tokens || 0;
      }
      
      // Check if we hit max tool calls
      if (toolCallCount >= maxToolCalls) {
        activityMonitor.logActivity('warning', `⚠️ Hit max tool calls limit (${maxToolCalls})`);
      }
      
      const content = response.choices[0]?.message?.content || '';
      const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: totalTokens };

      // Calculate cost (approximate, based on GPT-4o-mini pricing)
      const cost = this.calculateOpenAICost(model, usage.prompt_tokens, usage.completion_tokens);

      if (toolsUsed.length > 0) {
        activityMonitor.logActivity('info', `🔧 Tools used: ${toolsUsed.join(', ')} (${toolCallCount} calls)`);
      }

      return {
        content,
        metadata: {
          model,
          provider: 'openai',
          tokens: {
            prompt: usage.prompt_tokens,
            completion: usage.completion_tokens,
            total: totalTokens,
          },
          cost,
          duration: 0, // Set by caller
          timestamp: new Date().toISOString(),
          toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
          toolCallCount: toolCallCount > 0 ? toolCallCount : undefined,
        },
      };

    } catch (error: any) {
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please update your credential.');
      } else if (error.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please try again later or use a different credential.');
      } else if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI quota exceeded. Please check your OpenAI account billing.');
      }
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Call Anthropic API (with optional tool use)
   */
  private async callAnthropic(
    credential: any,
    template: any,
    prompt: string
  ): Promise<GenerationResult> {
    
    // Use fetch for Anthropic (no official SDK dependency yet)
    const model = template.settings?.model || 'claude-3-5-sonnet-20241022';
    const maxTokens = template.settings?.maxTokens || 1000;
    const temperature = template.settings?.temperature || 0.7;
    const toolsEnabled = template.settings?.toolsEnabled || false;
    const maxToolCalls = template.settings?.maxToolCalls || 10;

    try {
      // Build initial messages
      const messages: any[] = [
        { role: 'user', content: prompt },
      ];
      
      // Get tools if enabled (Anthropic format)
      const tools = toolsEnabled ? this.convertToolsToAnthropicFormat(aiToolsService.getToolDefinitions()) : undefined;
      
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let toolCallCount = 0;
      let toolsUsed: string[] = [];
      
      // Initial API call
      let response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': credential.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          messages,
          ...(template.systemPrompt && { system: template.systemPrompt }),
          ...(tools && { tools }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
      }

      let data = await response.json();
      totalInputTokens += data.usage?.input_tokens || 0;
      totalOutputTokens += data.usage?.output_tokens || 0;
      
      // Handle tool use (Anthropic calls them "tool_use" blocks)
      while (
        data.stop_reason === 'tool_use' &&
        toolCallCount < maxToolCalls
      ) {
        const toolUseBlocks = data.content.filter((block: any) => block.type === 'tool_use');
        
        if (toolUseBlocks.length === 0) break;
        
        activityMonitor.logActivity('info', `🔧 Claude requesting ${toolUseBlocks.length} tool call(s)`);
        
        // Add assistant's response to conversation
        messages.push({
          role: 'assistant',
          content: data.content,
        });
        
        // Execute tools and build tool results
        const toolResults: any[] = [];
        
        for (const toolUse of toolUseBlocks) {
          toolCallCount++;
          const toolName = toolUse.name;
          const toolArgs = toolUse.input;
          
          activityMonitor.logActivity('debug', `🔧 Tool: ${toolName}`);
          toolsUsed.push(toolName);
          
          // Execute tool
          const toolResult = await aiToolsService.executeTool(toolName, toolArgs);
          
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(toolResult.data),
          });
          
          activityMonitor.logActivity('success', `✅ Tool ${toolName} executed successfully`);
        }
        
        // Add tool results as user message
        messages.push({
          role: 'user',
          content: toolResults,
        });
        
        // Continue conversation
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': credential.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            temperature,
            messages,
            ...(template.systemPrompt && { system: template.systemPrompt }),
            ...(tools && { tools }),
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
        }
        
        data = await response.json();
        totalInputTokens += data.usage?.input_tokens || 0;
        totalOutputTokens += data.usage?.output_tokens || 0;
      }
      
      // Check if we hit max tool calls
      if (toolCallCount >= maxToolCalls) {
        activityMonitor.logActivity('warning', `⚠️ Hit max tool calls limit (${maxToolCalls})`);
      }
      
      // Extract final text response
      const content = data.content.find((block: any) => block.type === 'text')?.text || '';

      // Calculate cost (Anthropic pricing)
      const cost = this.calculateAnthropicCost(model, totalInputTokens, totalOutputTokens);

      if (toolsUsed.length > 0) {
        activityMonitor.logActivity('info', `🔧 Tools used: ${toolsUsed.join(', ')} (${toolCallCount} calls)`);
      }

      return {
        content,
        metadata: {
          model,
          provider: 'anthropic',
          tokens: {
            prompt: totalInputTokens,
            completion: totalOutputTokens,
            total: totalInputTokens + totalOutputTokens,
          },
          cost,
          duration: 0,
          timestamp: new Date().toISOString(),
        } as any,
      };

    } catch (error: any) {
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }
  
  /**
   * Convert OpenAI tool format to Anthropic format
   */
  private convertToolsToAnthropicFormat(openAITools: any[]): any[] {
    return openAITools.map((tool: any) => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters,
    }));
  }

  /**
   * Call Cohere API
   */
  private async callCohere(
    credential: any,
    template: any,
    prompt: string
  ): Promise<GenerationResult> {
    
    const model = template.settings?.model || 'command';
    const maxTokens = template.settings?.maxTokens || 1000;
    const temperature = template.settings?.temperature || 0.7;

    try {
      const response = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credential.apiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          max_tokens: maxTokens,
          temperature,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Cohere API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.generations[0]?.text || '';

      // Cohere doesn't return token counts in generate endpoint
      // Approximate based on content length
      const estimatedTokens = Math.ceil(content.length / 4);

      return {
        content,
        metadata: {
          model,
          provider: 'cohere',
          tokens: {
            prompt: Math.ceil(prompt.length / 4),
            completion: estimatedTokens,
            total: Math.ceil(prompt.length / 4) + estimatedTokens,
          },
          cost: estimatedTokens * 0.00002, // Approximate
          duration: 0,
          timestamp: new Date().toISOString(),
        },
      };

    } catch (error: any) {
      throw new Error(`Cohere API error: ${error.message}`);
    }
  }

  /**
   * Call Ollama API (Local Models - No API Key Required!)
   */
  private async callOllama(
    credential: any,
    template: any,
    prompt: string
  ): Promise<GenerationResult> {
    
    // Ollama runs locally - use host from credential config or default
    const host = credential.additionalConfig?.host || 'http://localhost:11434';
    const model = template.settings?.model || credential.additionalConfig?.defaultModel || 'llama2';
    const maxTokens = template.settings?.maxTokens || 1000;
    const temperature = template.settings?.temperature || 0.7;

    try {
      const ollama = new Ollama({ host });

      // Check if model is available
      const models = await ollama.list();
      const modelExists = models.models.some((m: any) => m.name === model || m.name === `${model}:latest`);
      
      if (!modelExists) {
        throw new Error(`Model "${model}" not found. Available models: ${models.models.map((m: any) => m.name).join(', ') || 'none'}. Run 'ollama pull ${model}' to download it.`);
      }

      // Build messages
      const messages: any[] = [];
      if (template.systemPrompt) {
        messages.push({ role: 'system', content: template.systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      // Generate with streaming disabled
      const response = await ollama.chat({
        model,
        messages,
        stream: false,
        options: {
          temperature,
          num_predict: maxTokens,
        },
      });

      const content = response.message?.content || '';
      
      // Ollama provides token counts in eval_count and prompt_eval_count
      const promptTokens = response.prompt_eval_count || 0;
      const completionTokens = response.eval_count || 0;
      const totalTokens = promptTokens + completionTokens;

      return {
        content,
        metadata: {
          model,
          provider: 'ollama',
          tokens: {
            prompt: promptTokens,
            completion: completionTokens,
            total: totalTokens,
          },
          cost: 0, // Ollama is free/local!
          duration: response.total_duration ? Math.round(response.total_duration / 1000000) : 0, // Convert nanoseconds to ms
          timestamp: new Date().toISOString(),
        },
      };

    } catch (error: any) {
      if (error.message.includes('ECONNREFUSED')) {
        throw new Error('Ollama server is not running. Please start it with "ollama serve" or check the host configuration.');
      } else if (error.message.includes('not found')) {
        throw error; // Re-throw model not found errors
      }
      throw new Error(`Ollama API error: ${error.message}`);
    }
  }

  /**
   * Calculate OpenAI cost based on model and tokens
   */
  private calculateOpenAICost(model: string, promptTokens: number, completionTokens: number): number {
    // Pricing as of 2024 (per 1K tokens)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 0.0025, output: 0.01 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    };

    const rates = pricing[model] || pricing['gpt-4o-mini']; // Default to mini
    
    return (promptTokens / 1000 * rates.input) + (completionTokens / 1000 * rates.output);
  }

  /**
   * Calculate Anthropic cost
   */
  private calculateAnthropicCost(model: string, inputTokens: number, outputTokens: number): number {
    // Pricing as of 2024
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
      'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
    };

    const rates = pricing[model] || pricing['claude-3-5-sonnet-20241022'];
    
    return (inputTokens / 1000 * rates.input) + (outputTokens / 1000 * rates.output);
  }

  /**
   * Validate template before generation
   */
  async validateTemplate(templateId: string, userId: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check template exists
      const template = await storage.getContentTemplate(templateId, userId);
      if (!template) {
        errors.push('Template not found');
        return { valid: false, errors, warnings };
      }

      // Check template is active
      if (!template.isActive) {
        errors.push('Template is inactive');
      }

      // Check AI credential exists
      const credential = await storage.getDefaultAiCredential(userId);
      if (!credential) {
        errors.push('No AI credential configured');
      } else if (!credential.isActive) {
        errors.push('Default AI credential is inactive');
      }

      // Check for variables in prompt
      const variablesInPrompt = template.aiPrompt.match(/{{([^}]+)}}/g);
      if (variablesInPrompt) {
        const requiredVars = variablesInPrompt.map((v: string) => 
          v.replace(/{{|}}/g, '').trim()
        );
        
        if (template.variables && Array.isArray(template.variables) && template.variables.length > 0) {
          const definedVars = template.variables;
          const missing = requiredVars.filter((v: string) => !definedVars.includes(v));
          
          if (missing.length > 0) {
            warnings.push(`Variables in prompt but not defined: ${missing.join(', ')}`);
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };

    } catch (error: any) {
      errors.push(error.message);
      return { valid: false, errors, warnings };
    }
  }
}

export const contentGenerationService = new ContentGenerationService();

