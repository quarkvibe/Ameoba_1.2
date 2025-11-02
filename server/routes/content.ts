import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { aiGenerationRateLimit, standardRateLimit, generousRateLimit } from '../middleware/rateLimiter';
import { contentGenerationService } from '../services/contentGenerationService';
import { deliveryService } from '../services/deliveryService';
import { storage } from '../storage';

/**
 * CONTENT GENERATION ROUTES
 * The core "anything generator" functionality
 * Handles AI-powered content generation and delivery
 */

export function registerContentRoutes(router: Router) {
  
  // Generate content from template
  router.post('/content/generate', 
    isAuthenticated, 
    aiGenerationRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { templateId, variables, credentialId } = req.body;
        
        if (!templateId) {
          return res.status(400).json({ message: 'templateId is required' });
        }
        
        // Verify template exists and user owns it
        const template = await storage.getContentTemplate(templateId, userId);
        if (!template) {
          return res.status(404).json({ message: 'Template not found' });
        }

        // Generate content using AI
        const generationResult = await contentGenerationService.generate({
          templateId,
          userId,
          variables: variables || {},
          credentialId,
        });
        
        // Store generated content
        const generatedContent = await storage.createGeneratedContent({
          templateId,
          userId,
          content: generationResult.content,
          metadata: generationResult.metadata,
        });

        // Attempt delivery (non-blocking for response)
        try {
          const deliveryResult = await deliveryService.deliver({
            content: generationResult.content,
            contentId: generatedContent.id,
            userId,
            templateId,
          });

          return res.json({ 
            success: true,
            contentId: generatedContent.id,
            templateName: template.name,
            tokens: generationResult.metadata.tokens.total,
            cost: generationResult.metadata.cost,
            duration: generationResult.metadata.duration,
            delivery: {
              attempted: deliveryResult.delivered.length,
              succeeded: deliveryResult.delivered.filter(d => d.success).length,
              failed: deliveryResult.delivered.filter(d => !d.success).length,
            },
          });
        } catch (deliveryError: any) {
          // Content generated successfully but delivery failed
          return res.json({
            success: true,
            contentId: generatedContent.id,
            templateName: template.name,
            tokens: generationResult.metadata.tokens.total,
            cost: generationResult.metadata.cost,
            warning: `Content generated but delivery failed: ${deliveryError.message}`,
          });
        }
      } catch (error) {
        console.error('Error generating content:', error);
        res.status(500).json({ 
          message: 'Failed to generate content', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  );

  // Get generated content by ID
  router.get('/content/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        const content = await storage.getGeneratedContentById(id, userId);
        
        if (!content) {
          return res.status(404).json({ message: 'Content not found' });
        }
        
        res.json(content);
      } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({ message: 'Failed to fetch content' });
      }
    }
  );

  // List generated content (paginated)
  router.get('/content', 
    isAuthenticated, 
    generousRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;
        const templateId = req.query.templateId as string | undefined;
        
        const content = await storage.getGeneratedContent(userId, { 
          limit, 
          offset, 
          templateId 
        });
        
        res.json({
          content,
          pagination: {
            limit,
            offset,
            hasMore: content.length === limit,
          },
        });
      } catch (error) {
        console.error('Error listing content:', error);
        res.status(500).json({ message: 'Failed to list content' });
      }
    }
  );

  // Delete generated content
  router.delete('/content/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const content = await storage.getGeneratedContentById(id, userId);
        if (!content) {
          return res.status(404).json({ message: 'Content not found' });
        }
        
        await storage.deleteGeneratedContent(id);
        
        res.json({ success: true, message: 'Content deleted' });
      } catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({ message: 'Failed to delete content' });
      }
    }
  );

  // Get content generation statistics
  router.get('/content/stats/overview', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        
        const stats = await storage.getContentStats(userId);
        
        res.json({
          totalGenerated: stats.total,
          totalTokens: stats.tokens,
          totalCost: stats.cost,
          byTemplate: stats.byTemplate,
          byDate: stats.byDate,
        });
      } catch (error) {
        console.error('Error fetching content stats:', error);
        res.status(500).json({ message: 'Failed to fetch statistics' });
      }
    }
  );

  // Regenerate content (uses same template and variables)
  router.post('/content/:id/regenerate', 
    isAuthenticated, 
    aiGenerationRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Get original content
        const originalContent = await storage.getGeneratedContentById(id, userId);
        if (!originalContent) {
          return res.status(404).json({ message: 'Original content not found' });
        }
        
        // Get template
        const template = await storage.getContentTemplate(originalContent.templateId!, userId);
        if (!template) {
          return res.status(404).json({ message: 'Template no longer exists' });
        }
        
        // Extract variables from original metadata
        const variables = (originalContent.metadata as any)?.variables || {};
        
        // Generate new content
        const generationResult = await contentGenerationService.generate({
          templateId: originalContent.templateId!,
          userId,
          variables,
        });
        
        // Store as new content
        const newContent = await storage.createGeneratedContent({
          templateId: originalContent.templateId!,
          userId,
          content: generationResult.content,
          metadata: {
            ...generationResult.metadata,
            regeneratedFrom: id,
          },
        });
        
        res.json({
          success: true,
          contentId: newContent.id,
          originalId: id,
          tokens: generationResult.metadata.tokens.total,
          cost: generationResult.metadata.cost,
        });
      } catch (error) {
        console.error('Error regenerating content:', error);
        res.status(500).json({ message: 'Failed to regenerate content' });
      }
    }
  );
}




