import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { standardRateLimit, generousRateLimit, strictRateLimit } from '../middleware/rateLimiter';
import { insertDataSourceSchema } from '@shared/schema';
import { storage } from '../storage';
import { dataSourceService } from '../services/dataSourceService';

/**
 * DATA SOURCE ROUTES
 * Manages input sources for content generation
 * Types: RSS feeds, REST APIs, Webhooks, Static data
 */

export function registerDataSourceRoutes(router: Router) {
  
  // Create new data source
  router.post('/data-sources', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        
        // Validate request body
        const validatedData = insertDataSourceSchema.parse({
          ...req.body,
          userId,
        });
        
        const dataSource = await storage.createDataSource(validatedData);
        
        res.status(201).json({
          success: true,
          dataSource,
        });
      } catch (error: any) {
        console.error('Error creating data source:', error);
        
        if (error.name === 'ZodError') {
          return res.status(400).json({ 
            message: 'Validation failed', 
            errors: error.errors 
          });
        }
        
        res.status(500).json({ message: 'Failed to create data source' });
      }
    }
  );

  // List data sources
  router.get('/data-sources', 
    isAuthenticated, 
    generousRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const type = req.query.type as string | undefined;
        const includeInactive = req.query.includeInactive === 'true';
        
        const dataSources = await storage.getDataSources(userId, {
          type,
          includeInactive,
        });
        
        res.json({ dataSources });
      } catch (error) {
        console.error('Error listing data sources:', error);
        res.status(500).json({ message: 'Failed to list data sources' });
      }
    }
  );

  // Get single data source
  router.get('/data-sources/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        const dataSource = await storage.getDataSource(id, userId);
        
        if (!dataSource) {
          return res.status(404).json({ message: 'Data source not found' });
        }
        
        res.json(dataSource);
      } catch (error) {
        console.error('Error fetching data source:', error);
        res.status(500).json({ message: 'Failed to fetch data source' });
      }
    }
  );

  // Update data source
  router.put('/data-sources/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const existingDataSource = await storage.getDataSource(id, userId);
        if (!existingDataSource) {
          return res.status(404).json({ message: 'Data source not found' });
        }
        
        // Update data source
        const updatedDataSource = await storage.updateDataSource(id, req.body);
        
        res.json({
          success: true,
          dataSource: updatedDataSource,
        });
      } catch (error) {
        console.error('Error updating data source:', error);
        res.status(500).json({ message: 'Failed to update data source' });
      }
    }
  );

  // Delete data source
  router.delete('/data-sources/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const dataSource = await storage.getDataSource(id, userId);
        if (!dataSource) {
          return res.status(404).json({ message: 'Data source not found' });
        }
        
        await storage.deleteDataSource(id);
        
        res.json({ success: true, message: 'Data source deleted' });
      } catch (error) {
        console.error('Error deleting data source:', error);
        res.status(500).json({ message: 'Failed to delete data source' });
      }
    }
  );

  // Test data source connection
  router.post('/data-sources/:id/test', 
    isAuthenticated, 
    strictRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        const dataSource = await storage.getDataSource(id, userId);
        if (!dataSource) {
          return res.status(404).json({ message: 'Data source not found' });
        }
        
        // Test data source
        const result = await dataSourceService.testDataSource(dataSource);
        
        res.json({
          success: result.success,
          message: result.message,
          sampleData: result.sampleData,
        });
      } catch (error: any) {
        console.error('Error testing data source:', error);
        res.status(500).json({ 
          success: false,
          message: error.message || 'Data source test failed' 
        });
      }
    }
  );

  // Fetch data from source (manual trigger)
  router.post('/data-sources/:id/fetch', 
    isAuthenticated, 
    strictRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        const dataSource = await storage.getDataSource(id, userId);
        if (!dataSource) {
          return res.status(404).json({ message: 'Data source not found' });
        }
        
        // Fetch data
        const data = await dataSourceService.fetchData(dataSource);
        
        // Update last fetch time
        await storage.updateDataSourceLastFetch(id, new Date());
        
        res.json({
          success: true,
          itemCount: Array.isArray(data) ? data.length : 1,
          data: Array.isArray(data) ? data.slice(0, 10) : data, // Return max 10 items
        });
      } catch (error: any) {
        console.error('Error fetching data:', error);
        
        // Update error count
        await storage.incrementDataSourceErrorCount(id);
        
        res.status(500).json({ 
          success: false,
          message: error.message || 'Failed to fetch data' 
        });
      }
    }
  );

  // Get data source statistics
  router.get('/data-sources/:id/stats', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const dataSource = await storage.getDataSource(id, userId);
        if (!dataSource) {
          return res.status(404).json({ message: 'Data source not found' });
        }
        
        res.json({
          id,
          name: dataSource.name,
          type: dataSource.type,
          fetchCount: dataSource.fetchCount || 0,
          errorCount: dataSource.errorCount || 0,
          lastFetch: dataSource.lastFetch,
          lastError: dataSource.lastError,
          isActive: dataSource.isActive,
        });
      } catch (error) {
        console.error('Error fetching data source stats:', error);
        res.status(500).json({ message: 'Failed to fetch statistics' });
      }
    }
  );

  // Get data source types and their schemas
  router.get('/data-sources/types/available', 
    isAuthenticated, 
    generousRateLimit,
    async (req: any, res) => {
      try {
        const types = [
          {
            type: 'rss',
            name: 'RSS Feed',
            description: 'Fetch data from RSS/Atom feeds',
            configSchema: {
              url: { type: 'string', required: true, description: 'Feed URL' },
              updateInterval: { type: 'number', required: false, description: 'Check interval in minutes' },
            },
          },
          {
            type: 'api',
            name: 'REST API',
            description: 'Fetch data from REST API endpoints',
            configSchema: {
              url: { type: 'string', required: true, description: 'API endpoint URL' },
              method: { type: 'string', required: false, default: 'GET', description: 'HTTP method' },
              headers: { type: 'object', required: false, description: 'HTTP headers' },
              body: { type: 'object', required: false, description: 'Request body (for POST/PUT)' },
              jsonPath: { type: 'string', required: false, description: 'JSONPath to extract data' },
            },
          },
          {
            type: 'webhook',
            name: 'Webhook',
            description: 'Receive data via webhook callbacks',
            configSchema: {
              secret: { type: 'string', required: false, description: 'Webhook secret for validation' },
              webhookUrl: { type: 'string', readOnly: true, description: 'Generated webhook URL' },
            },
          },
          {
            type: 'static',
            name: 'Static Data',
            description: 'Use static JSON or CSV data',
            configSchema: {
              data: { type: 'string', required: true, description: 'JSON or CSV data' },
              format: { type: 'string', required: true, enum: ['json', 'csv'], description: 'Data format' },
            },
          },
        ];
        
        res.json({ types });
      } catch (error) {
        console.error('Error fetching data source types:', error);
        res.status(500).json({ message: 'Failed to fetch types' });
      }
    }
  );

  // Link data source to template
  router.post('/data-sources/:id/link-template', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        const { templateId } = req.body;
        
        if (!templateId) {
          return res.status(400).json({ message: 'templateId is required' });
        }
        
        // Verify ownership of both
        const dataSource = await storage.getDataSource(id, userId);
        if (!dataSource) {
          return res.status(404).json({ message: 'Data source not found' });
        }
        
        const template = await storage.getContentTemplate(templateId, userId);
        if (!template) {
          return res.status(404).json({ message: 'Template not found' });
        }
        
        // Create link
        await storage.linkTemplateDataSource(templateId, id);
        
        res.json({ 
          success: true, 
          message: 'Data source linked to template',
        });
      } catch (error) {
        console.error('Error linking data source:', error);
        res.status(500).json({ message: 'Failed to link data source' });
      }
    }
  );

  // Unlink data source from template
  router.delete('/data-sources/:id/unlink-template/:templateId', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id, templateId } = req.params;
        
        // Verify ownership
        const dataSource = await storage.getDataSource(id, userId);
        if (!dataSource) {
          return res.status(404).json({ message: 'Data source not found' });
        }
        
        // Unlink
        await storage.unlinkTemplateDataSource(templateId, id);
        
        res.json({ 
          success: true, 
          message: 'Data source unlinked from template' 
        });
      } catch (error) {
        console.error('Error unlinking data source:', error);
        res.status(500).json({ message: 'Failed to unlink data source' });
      }
    }
  );
}




