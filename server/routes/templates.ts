import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { standardRateLimit, generousRateLimit } from '../middleware/rateLimiter';
import { insertContentTemplateSchema } from '@shared/schema';
import { storage } from '../storage';

/**
 * CONTENT TEMPLATE ROUTES
 * Template management for the "anything generator"
 * Templates define what gets generated and how
 */

export function registerTemplateRoutes(router: Router) {
  
  // Create new template
  router.post('/templates', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        
        // Validate request body
        const validatedData = insertContentTemplateSchema.parse({
          ...req.body,
          userId,
        });
        
        const template = await storage.createContentTemplate(validatedData);
        
        res.status(201).json({
          success: true,
          template,
        });
      } catch (error: any) {
        console.error('Error creating template:', error);
        
        if (error.name === 'ZodError') {
          return res.status(400).json({ 
            message: 'Validation failed', 
            errors: error.errors 
          });
        }
        
        res.status(500).json({ message: 'Failed to create template' });
      }
    }
  );

  // List templates
  router.get('/templates', 
    isAuthenticated, 
    generousRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const includeInactive = req.query.includeInactive === 'true';
        const category = req.query.category as string | undefined;
        
        const templates = await storage.getContentTemplates(userId, {
          includeInactive,
          category,
        });
        
        res.json({ templates });
      } catch (error) {
        console.error('Error listing templates:', error);
        res.status(500).json({ message: 'Failed to list templates' });
      }
    }
  );

  // Get single template
  router.get('/templates/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        const template = await storage.getContentTemplate(id, userId);
        
        if (!template) {
          return res.status(404).json({ message: 'Template not found' });
        }
        
        res.json(template);
      } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ message: 'Failed to fetch template' });
      }
    }
  );

  // Update template
  router.put('/templates/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const existingTemplate = await storage.getContentTemplate(id, userId);
        if (!existingTemplate) {
          return res.status(404).json({ message: 'Template not found' });
        }
        
        // Update template
        const updatedTemplate = await storage.updateContentTemplate(id, req.body);
        
        res.json({
          success: true,
          template: updatedTemplate,
        });
      } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ message: 'Failed to update template' });
      }
    }
  );

  // Delete template
  router.delete('/templates/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const template = await storage.getContentTemplate(id, userId);
        if (!template) {
          return res.status(404).json({ message: 'Template not found' });
        }
        
        await storage.deleteContentTemplate(id);
        
        res.json({ success: true, message: 'Template deleted' });
      } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ message: 'Failed to delete template' });
      }
    }
  );

  // Duplicate template
  router.post('/templates/:id/duplicate', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Get original template
        const original = await storage.getContentTemplate(id, userId);
        if (!original) {
          return res.status(404).json({ message: 'Template not found' });
        }
        
        // Create duplicate
        const duplicate = await storage.createContentTemplate({
          userId,
          name: `${original.name} (Copy)`,
          description: original.description,
          category: original.category,
          aiPrompt: original.aiPrompt,
          systemPrompt: original.systemPrompt,
          outputFormat: original.outputFormat,
          variables: original.variables,
          settings: original.settings,
          isActive: false, // Duplicates start inactive
          isPublic: false,
        });
        
        res.status(201).json({
          success: true,
          template: duplicate,
        });
      } catch (error) {
        console.error('Error duplicating template:', error);
        res.status(500).json({ message: 'Failed to duplicate template' });
      }
    }
  );

  // Get template usage statistics
  router.get('/templates/:id/stats', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const template = await storage.getContentTemplate(id, userId);
        if (!template) {
          return res.status(404).json({ message: 'Template not found' });
        }
        
        const stats = await storage.getTemplateStats(id);
        
        res.json({
          templateId: id,
          totalGenerations: stats.total,
          totalTokens: stats.tokens,
          totalCost: stats.cost,
          avgTokensPerGeneration: stats.avgTokens,
          lastUsed: stats.lastUsed,
        });
      } catch (error) {
        console.error('Error fetching template stats:', error);
        res.status(500).json({ message: 'Failed to fetch statistics' });
      }
    }
  );

  // Export template as JSON
  router.get('/templates/:id/export', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        const template = await storage.getContentTemplate(id, userId);
        if (!template) {
          return res.status(404).json({ message: 'Template not found' });
        }
        
        // Strip internal fields for export
        const exportData = {
          name: template.name,
          description: template.description,
          category: template.category,
          aiPrompt: template.aiPrompt,
          systemPrompt: template.systemPrompt,
          outputFormat: template.outputFormat,
          variables: template.variables,
          settings: template.settings,
          exportedAt: new Date().toISOString(),
          version: '1.0',
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="template-${template.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json"`);
        res.json(exportData);
      } catch (error) {
        console.error('Error exporting template:', error);
        res.status(500).json({ message: 'Failed to export template' });
      }
    }
  );

  // Import template from JSON
  router.post('/templates/import', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const importData = req.body;
        
        // Validate import data
        if (!importData.name || !importData.aiPrompt) {
          return res.status(400).json({ 
            message: 'Invalid template data. Required fields: name, aiPrompt' 
          });
        }
        
        // Create template from import
        const template = await storage.createContentTemplate({
          userId,
          name: importData.name,
          description: importData.description || null,
          category: importData.category || null,
          aiPrompt: importData.aiPrompt,
          systemPrompt: importData.systemPrompt || null,
          outputFormat: importData.outputFormat || 'text',
          variables: importData.variables || null,
          settings: importData.settings || null,
          isActive: false, // Imported templates start inactive
          isPublic: false,
        });
        
        res.status(201).json({
          success: true,
          template,
          message: 'Template imported successfully',
        });
      } catch (error) {
        console.error('Error importing template:', error);
        res.status(500).json({ message: 'Failed to import template' });
      }
    }
  );
}



