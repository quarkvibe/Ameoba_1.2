import { Ollama } from 'ollama';

/**
 * Ollama Service
 * Provides utilities for managing local Ollama models
 */
export class OllamaService {
  private defaultHost = 'http://localhost:11434';

  /**
   * Check if Ollama server is running and accessible
   */
  async checkHealth(host?: string): Promise<{
    available: boolean;
    host: string;
    models: string[];
    error?: string;
  }> {
    const ollamaHost = host || this.defaultHost;

    try {
      const ollama = new Ollama({ host: ollamaHost });
      const modelList = await ollama.list();
      
      return {
        available: true,
        host: ollamaHost,
        models: modelList.models.map((m: any) => m.name),
      };
    } catch (error: any) {
      return {
        available: false,
        host: ollamaHost,
        models: [],
        error: error.message?.includes('ECONNREFUSED')
          ? 'Ollama server is not running. Start it with "ollama serve".'
          : error.message || 'Failed to connect to Ollama',
      };
    }
  }

  /**
   * Get list of available models
   */
  async listModels(host?: string): Promise<{
    models: Array<{
      name: string;
      size: number;
      modifiedAt: string;
    }>;
  }> {
    const ollamaHost = host || this.defaultHost;
    const ollama = new Ollama({ host: ollamaHost });
    
    try {
      const result = await ollama.list();
      return {
        models: result.models.map((m: any) => ({
          name: m.name,
          size: m.size || 0,
          modifiedAt: m.modified_at || new Date().toISOString(),
        })),
      };
    } catch (error: any) {
      throw new Error(`Failed to list Ollama models: ${error.message}`);
    }
  }

  /**
   * Pull a model from Ollama registry
   * Note: This is a long-running operation
   */
  async pullModel(modelName: string, host?: string): Promise<void> {
    const ollamaHost = host || this.defaultHost;
    const ollama = new Ollama({ host: ollamaHost });
    
    try {
      await ollama.pull({ model: modelName, stream: false });
    } catch (error: any) {
      throw new Error(`Failed to pull Ollama model "${modelName}": ${error.message}`);
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(modelName: string, host?: string): Promise<void> {
    const ollamaHost = host || this.defaultHost;
    const ollama = new Ollama({ host: ollamaHost });
    
    try {
      await ollama.delete({ model: modelName });
    } catch (error: any) {
      throw new Error(`Failed to delete Ollama model "${modelName}": ${error.message}`);
    }
  }

  /**
   * Get recommended models for different use cases
   */
  getRecommendedModels(): Array<{
    name: string;
    description: string;
    size: string;
    useCase: string;
  }> {
    return [
      {
        name: 'llama3.2:1b',
        description: 'Fastest model, lowest resource usage (1B parameters)',
        size: '~1.3 GB',
        useCase: 'Quick tasks, low-power devices, development',
      },
      {
        name: 'llama3.2:3b',
        description: 'Balanced performance and resource usage (3B parameters)',
        size: '~2 GB',
        useCase: 'General purpose, good quality on standard hardware',
      },
      {
        name: 'llama2',
        description: 'Well-rounded model, moderate requirements (7B parameters)',
        size: '~3.8 GB',
        useCase: 'Production workloads, good balance',
      },
      {
        name: 'mistral',
        description: 'High quality, efficient (7B parameters)',
        size: '~4.1 GB',
        useCase: 'Advanced tasks, better quality',
      },
      {
        name: 'llama3:8b',
        description: 'Latest Llama 3 model, high quality (8B parameters)',
        size: '~4.7 GB',
        useCase: 'Best quality for 8GB RAM systems',
      },
      {
        name: 'llama3:70b',
        description: 'Top-tier quality, high resource usage (70B parameters)',
        size: '~40 GB',
        useCase: 'Best quality, requires 32GB+ RAM',
      },
    ];
  }

  /**
   * Get setup instructions for different platforms
   */
  getSetupInstructions(): {
    macos: string[];
    linux: string[];
    windows: string[];
  } {
    return {
      macos: [
        'Download Ollama from https://ollama.ai/download',
        'Install the .dmg file',
        'Open Terminal and run: ollama pull llama3.2:3b',
        'Ollama will run automatically in the background',
      ],
      linux: [
        'Run: curl https://ollama.ai/install.sh | sh',
        'Start the service: systemctl start ollama',
        'Pull a model: ollama pull llama3.2:3b',
        'The service will run in the background',
      ],
      windows: [
        'Download Ollama from https://ollama.ai/download',
        'Run the installer',
        'Open PowerShell or Command Prompt',
        'Run: ollama pull llama3.2:3b',
        'Ollama will run as a Windows service',
      ],
    };
  }
}

export const ollamaService = new OllamaService();




