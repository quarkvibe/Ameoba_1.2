import { z } from 'zod';

/**
 * Input validation schemas for API requests
 * Using Zod for runtime validation
 */

// ============================================
// CONTENT TEMPLATE VALIDATION
// ============================================

export const createContentTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  aiPrompt: z.string().min(10, 'AI prompt must be at least 10 characters'),
  systemPrompt: z.string().optional().nullable(),
  outputFormat: z.enum(['text', 'json', 'markdown', 'html']).default('text'),
  variables: z.array(z.string()).optional().nullable(),
  settings: z.record(z.any()).optional().nullable(),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(false),
});

export const updateContentTemplateSchema = createContentTemplateSchema.partial();

// ============================================
// DATA SOURCE VALIDATION
// ============================================

export const createDataSourceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  type: z.enum(['api', 'database', 'file', 'webhook', 'rss', 'static']),
  config: z.record(z.any()),
  parsingRules: z.record(z.any()),
  schedule: z.string().optional().nullable(), // Cron expression - validated separately
  isActive: z.boolean().default(true),
});

export const updateDataSourceSchema = createDataSourceSchema.partial();

// ============================================
// OUTPUT CHANNEL VALIDATION
// ============================================

export const createOutputChannelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  type: z.enum(['api', 'email', 'webhook', 'file', 'database', 'redis', 's3']),
  config: z.record(z.any()),
  outputFormat: z.record(z.any()),
  isActive: z.boolean().default(true),
});

export const updateOutputChannelSchema = createOutputChannelSchema.partial();

// ============================================
// SCHEDULED JOB VALIDATION
// ============================================

export const createScheduledJobSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  templateId: z.string().uuid('Invalid template ID'),
  cronExpression: z.string()
    .min(9, 'Invalid cron expression')
    .max(100)
    .refine(
      (expr) => {
        // Basic cron validation: should have 5 or 6 parts
        const parts = expr.trim().split(/\s+/);
        return parts.length >= 5 && parts.length <= 6;
      },
      { message: 'Invalid cron expression format' }
    ),
  timezone: z.string().max(50).default('UTC'),
  isActive: z.boolean().default(true),
});

export const updateScheduledJobSchema = createScheduledJobSchema.partial();

// ============================================
// CAMPAIGN VALIDATION
// ============================================

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  subject: z.string().min(1, 'Subject is required').max(500),
  content: z.string().min(1, 'Content is required'),
  htmlContent: z.string().optional().nullable(),
  type: z.enum(['broadcast', 'sequence', 'trigger']),
  status: z.enum(['draft', 'active', 'paused', 'completed']).default('draft'),
  triggerEvent: z.string().optional().nullable(),
  scheduleType: z.enum(['immediate', 'scheduled', 'recurring']).optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  cronExpression: z.string().optional().nullable(),
  recipients: z.array(z.any()).optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

// ============================================
// AI CREDENTIALS VALIDATION
// ============================================

export const createAiCredentialSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'cohere', 'google', 'huggingface', 'replicate']),
  name: z.string().min(1, 'Name is required').max(200),
  apiKey: z.string().min(10, 'API key is required'),
  additionalConfig: z.record(z.any()).optional().nullable(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

// ============================================
// EMAIL SERVICE CREDENTIALS VALIDATION
// ============================================

export const createEmailServiceCredentialSchema = z.object({
  provider: z.enum(['sendgrid', 'aws_ses', 'mailgun', 'postmark', 'smtp']),
  name: z.string().min(1, 'Name is required').max(200),
  apiKey: z.string().optional().nullable(),
  awsAccessKeyId: z.string().optional().nullable(),
  awsSecretAccessKey: z.string().optional().nullable(),
  awsRegion: z.string().optional().nullable(),
  fromEmail: z.string().email('Invalid email address').max(255),
  fromName: z.string().max(200).optional().nullable(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    // Validate provider-specific required fields
    if (data.provider === 'sendgrid' || data.provider === 'mailgun') {
      return !!data.apiKey;
    }
    if (data.provider === 'aws_ses') {
      return !!data.awsAccessKeyId && !!data.awsSecretAccessKey && !!data.awsRegion;
    }
    return true;
  },
  { message: 'Missing required credentials for selected provider' }
);

// ============================================
// API KEY GENERATION VALIDATION
// ============================================

export const generateApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  permissions: z.array(z.string()).min(1, 'At least one permission required'),
  expiresAt: z.string().datetime().optional().nullable(),
});

// ============================================
// CONTENT GENERATION VALIDATION
// ============================================

export const generateContentSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  variables: z.record(z.any()).optional().nullable(),
});

// ============================================
// PAGINATION VALIDATION
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// QUERY PARAMETER HELPERS
// ============================================

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

// ============================================
// WEBHOOK VALIDATION
// ============================================

export const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url('Invalid webhook URL').max(500),
  events: z.array(z.string()).min(1, 'At least one event required'),
  secret: z.string().min(16).max(255).optional(),
  retryAttempts: z.number().int().min(0).max(10).default(3),
  isActive: z.boolean().default(true),
});

// ============================================
// EMAIL SENDING VALIDATION
// ============================================

export const sendEmailSchema = z.object({
  to: z.union([
    z.string().email(),
    z.array(z.string().email()).min(1),
  ]),
  subject: z.string().min(1).max(500),
  content: z.string().min(1),
  htmlContent: z.string().optional(),
  from: z.string().email().optional(),
  replyTo: z.string().email().optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================
// DISTRIBUTION RULE VALIDATION
// ============================================

export const createDistributionRuleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  conditions: z.array(z.record(z.any())),
  channels: z.array(z.string().uuid()).min(1, 'At least one channel required'),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateDistributionRuleSchema = createDistributionRuleSchema.partial();



