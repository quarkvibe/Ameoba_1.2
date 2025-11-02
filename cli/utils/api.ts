import axios, { AxiosInstance, AxiosError } from 'axios';
import { getConfig } from './config';

/**
 * API Client for Amoeba platform
 */
export class AmoebaAPI {
  private client: AxiosInstance;

  constructor() {
    const config = getConfig();
    const apiUrl = config.apiUrl || 'http://localhost:5000';

    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token if available
    if (config.auth?.token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${config.auth.token}`;
    }
  }

  /**
   * Handle API errors uniformly
   */
  private handleError(error: any): never {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      if (status === 401) {
        throw new Error('Authentication required. Run: amoeba auth login');
      } else if (status === 403) {
        throw new Error('Permission denied');
      } else if (status === 404) {
        throw new Error('Resource not found');
      } else {
        throw new Error(`API Error (${status}): ${message}`);
      }
    } else if (error.request) {
      throw new Error('No response from server. Is the server running?');
    } else {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  /**
   * Authentication
   */
  async login(username: string, password: string): Promise<{ token: string; userId: string }> {
    try {
      const response = await this.client.post('/api/auth/login', { username, password });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async whoami(): Promise<any> {
    try {
      const response = await this.client.get('/api/auth/user');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * System Status
   */
  async getSystemReadiness(): Promise<any> {
    try {
      const response = await this.client.get('/api/system/readiness');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getHealth(): Promise<any> {
    try {
      const response = await this.client.get('/api/health');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Templates
   */
  async listTemplates(): Promise<any[]> {
    try {
      const response = await this.client.get('/api/templates');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getTemplate(id: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/templates/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createTemplate(data: any): Promise<any> {
    try {
      const response = await this.client.post('/api/templates', data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateTemplate(id: string, data: any): Promise<any> {
    try {
      const response = await this.client.put(`/api/templates/${id}`, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      await this.client.delete(`/api/templates/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Content Generation
   */
  async generateContent(templateId: string, data?: any): Promise<any> {
    try {
      const response = await this.client.post('/api/content/generate', { templateId, ...data });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async listContent(limit: number = 50): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/generated-content?limit=${limit}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getContent(id: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/generated-content/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Scheduled Jobs
   */
  async listJobs(): Promise<any[]> {
    try {
      const response = await this.client.get('/api/schedule/jobs');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getJob(id: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/schedule/jobs/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createJob(data: any): Promise<any> {
    try {
      const response = await this.client.post('/api/schedule/jobs', data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateJob(id: string, data: any): Promise<any> {
    try {
      const response = await this.client.put(`/api/schedule/jobs/${id}`, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteJob(id: string): Promise<void> {
    try {
      await this.client.delete(`/api/schedule/jobs/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  async runJob(id: string): Promise<any> {
    try {
      const response = await this.client.post(`/api/schedule/jobs/${id}/run`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * AI Credentials
   */
  async listAICredentials(): Promise<any[]> {
    try {
      const response = await this.client.get('/api/ai-credentials');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createAICredential(data: any): Promise<any> {
    try {
      const response = await this.client.post('/api/ai-credentials', data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteAICredential(id: string): Promise<void> {
    try {
      await this.client.delete(`/api/ai-credentials/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Email Credentials
   */
  async listEmailCredentials(): Promise<any[]> {
    try {
      const response = await this.client.get('/api/email-credentials');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createEmailCredential(data: any): Promise<any> {
    try {
      const response = await this.client.post('/api/email-credentials', data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteEmailCredential(id: string): Promise<void> {
    try {
      await this.client.delete(`/api/email-credentials/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Statistics
   */
  async getStats(): Promise<any> {
    try {
      const response = await this.client.get('/api/dashboard/metrics');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Queue
   */
  async getQueueMetrics(): Promise<any> {
    try {
      const response = await this.client.get('/api/queue/metrics');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const api = new AmoebaAPI();

