import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { standardRateLimit, generousRateLimit } from '../middleware/rateLimiter';
import { insertDistributionRuleSchema } from '@shared/schema';
import { storage } from '../storage';

/**
 * DISTRIBUTION RULE ROUTES
 * Manages intelligent routing rules for content delivery
 * Determines which content goes to which outputs based on conditions
 */

export function registerDistributionRoutes(router: Router) {
  
  // Create new distribution rule
  router.post('/distributions', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        
        // Validate request body
        const validatedData = insertDistributionRuleSchema.parse({
          ...req.body,
          userId,
        });
        
        const rule = await storage.createDistributionRule(validatedData);
        
        res.status(201).json({
          success: true,
          rule,
        });
      } catch (error: any) {
        console.error('Error creating distribution rule:', error);
        
        if (error.name === 'ZodError') {
          return res.status(400).json({ 
            message: 'Validation failed', 
            errors: error.errors 
          });
        }
        
        res.status(500).json({ message: 'Failed to create distribution rule' });
      }
    }
  );

  // List distribution rules
  router.get('/distributions', 
    isAuthenticated, 
    generousRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const includeInactive = req.query.includeInactive === 'true';
        const templateId = req.query.templateId as string | undefined;
        
        const rules = await storage.getDistributionRules(userId, {
          includeInactive,
          templateId,
        });
        
        res.json({ rules });
      } catch (error) {
        console.error('Error listing distribution rules:', error);
        res.status(500).json({ message: 'Failed to list distribution rules' });
      }
    }
  );

  // Get single distribution rule
  router.get('/distributions/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        const rule = await storage.getDistributionRule(id, userId);
        
        if (!rule) {
          return res.status(404).json({ message: 'Distribution rule not found' });
        }
        
        res.json(rule);
      } catch (error) {
        console.error('Error fetching distribution rule:', error);
        res.status(500).json({ message: 'Failed to fetch distribution rule' });
      }
    }
  );

  // Update distribution rule
  router.put('/distributions/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const existingRule = await storage.getDistributionRule(id, userId);
        if (!existingRule) {
          return res.status(404).json({ message: 'Distribution rule not found' });
        }
        
        // Update rule
        const updatedRule = await storage.updateDistributionRule(id, req.body);
        
        res.json({
          success: true,
          rule: updatedRule,
        });
      } catch (error) {
        console.error('Error updating distribution rule:', error);
        res.status(500).json({ message: 'Failed to update distribution rule' });
      }
    }
  );

  // Delete distribution rule
  router.delete('/distributions/:id', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        
        // Verify ownership
        const rule = await storage.getDistributionRule(id, userId);
        if (!rule) {
          return res.status(404).json({ message: 'Distribution rule not found' });
        }
        
        await storage.deleteDistributionRule(id);
        
        res.json({ success: true, message: 'Distribution rule deleted' });
      } catch (error) {
        console.error('Error deleting distribution rule:', error);
        res.status(500).json({ message: 'Failed to delete distribution rule' });
      }
    }
  );

  // Test distribution rule (simulate matching)
  router.post('/distributions/:id/test', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;
        const { testContent } = req.body;
        
        const rule = await storage.getDistributionRule(id, userId);
        if (!rule) {
          return res.status(404).json({ message: 'Distribution rule not found' });
        }
        
        // TODO: Implement actual rule matching logic
        // For now, return basic info
        
        res.json({
          ruleId: id,
          ruleName: rule.name,
          conditions: rule.conditions,
          wouldMatch: true, // TODO: Actually evaluate conditions
          targetOutputs: rule.outputChannelIds || [],
          message: 'Rule evaluation simulated successfully',
        });
      } catch (error) {
        console.error('Error testing distribution rule:', error);
        res.status(500).json({ message: 'Failed to test distribution rule' });
      }
    }
  );

  // Reorder distribution rules (priority)
  router.post('/distributions/reorder', 
    isAuthenticated, 
    standardRateLimit,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { ruleIds } = req.body; // Array of rule IDs in desired order
        
        if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
          return res.status(400).json({ message: 'ruleIds array is required' });
        }
        
        // Verify all rules belong to user
        for (const id of ruleIds) {
          const rule = await storage.getDistributionRule(id, userId);
          if (!rule) {
            return res.status(404).json({ message: `Rule ${id} not found` });
          }
        }
        
        // Update priorities
        for (let i = 0; i < ruleIds.length; i++) {
          await storage.updateDistributionRule(ruleIds[i], { priority: i });
        }
        
        res.json({
          success: true,
          message: 'Distribution rules reordered',
          newOrder: ruleIds,
        });
      } catch (error) {
        console.error('Error reordering distribution rules:', error);
        res.status(500).json({ message: 'Failed to reorder rules' });
      }
    }
  );

  // Get available condition types
  router.get('/distributions/conditions/available', 
    isAuthenticated, 
    generousRateLimit,
    async (req: any, res) => {
      try {
        const conditionTypes = [
          {
            type: 'content_contains',
            name: 'Content Contains',
            description: 'Match if content contains specific text',
            parameters: [
              { name: 'text', type: 'string', required: true },
              { name: 'caseSensitive', type: 'boolean', default: false },
            ],
          },
          {
            type: 'content_length',
            name: 'Content Length',
            description: 'Match based on content length',
            parameters: [
              { name: 'operator', type: 'enum', values: ['gt', 'lt', 'eq'], required: true },
              { name: 'value', type: 'number', required: true },
            ],
          },
          {
            type: 'template_name',
            name: 'Template Name',
            description: 'Match based on template name',
            parameters: [
              { name: 'pattern', type: 'string', required: true },
            ],
          },
          {
            type: 'template_category',
            name: 'Template Category',
            description: 'Match based on template category',
            parameters: [
              { name: 'category', type: 'string', required: true },
            ],
          },
          {
            type: 'time_of_day',
            name: 'Time of Day',
            description: 'Match during specific hours',
            parameters: [
              { name: 'startHour', type: 'number', min: 0, max: 23, required: true },
              { name: 'endHour', type: 'number', min: 0, max: 23, required: true },
            ],
          },
          {
            type: 'day_of_week',
            name: 'Day of Week',
            description: 'Match on specific days',
            parameters: [
              { name: 'days', type: 'array', items: 'number', min: 0, max: 6, required: true },
            ],
          },
          {
            type: 'variable_value',
            name: 'Variable Value',
            description: 'Match based on template variable value',
            parameters: [
              { name: 'variableName', type: 'string', required: true },
              { name: 'operator', type: 'enum', values: ['eq', 'neq', 'contains'], required: true },
              { name: 'value', type: 'string', required: true },
            ],
          },
          {
            type: 'always',
            name: 'Always',
            description: 'Always match (catch-all rule)',
            parameters: [],
          },
        ];
        
        res.json({ conditionTypes });
      } catch (error) {
        console.error('Error fetching condition types:', error);
        res.status(500).json({ message: 'Failed to fetch condition types' });
      }
    }
  );
}




