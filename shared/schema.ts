import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  uuid,
  date,
  decimal
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email configurations
export const emailConfigurations = pgTable("email_configurations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar("provider").notNull(), // 'sendgrid', 'ses', etc.
  apiKey: text("api_key").notNull(),
  fromEmail: varchar("from_email").notNull(),
  fromName: varchar("from_name"),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email campaigns
export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  subject: varchar("subject").notNull(),
  content: text("content").notNull(),
  htmlContent: text("html_content"),
  status: varchar("status").notNull().default('draft'), // 'draft', 'active', 'paused', 'completed'
  type: varchar("type").notNull(), // 'broadcast', 'sequence', 'trigger'
  triggerEvent: varchar("trigger_event"), // 'signup', 'purchase', etc.
  scheduleType: varchar("schedule_type"), // 'immediate', 'scheduled', 'recurring'
  scheduledAt: timestamp("scheduled_at"),
  cronExpression: varchar("cron_expression"),
  recipients: jsonb("recipients"), // array of email addresses or query conditions
  metadata: jsonb("metadata"), // additional campaign data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_campaigns_user").on(table.userId),
  index("idx_campaigns_status").on(table.status),
  index("idx_campaigns_user_status").on(table.userId, table.status),
]);

// Email logs
export const emailLogs = pgTable("email_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  recipient: varchar("recipient").notNull(),
  subject: varchar("subject").notNull(),
  provider: varchar("provider").notNull(),
  status: varchar("status").notNull(), // 'queued', 'sent', 'delivered', 'bounced', 'failed'
  providerMessageId: varchar("provider_message_id"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  queuedAt: timestamp("queued_at").defaultNow(),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  bouncedAt: timestamp("bounced_at"),
  failedAt: timestamp("failed_at"),
});

// Queue jobs
export const queueJobs = pgTable("queue_jobs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // 'email', 'campaign', 'cleanup'
  status: varchar("status").notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed'
  priority: integer("priority").default(0),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  data: jsonb("data").notNull(),
  result: jsonb("result"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  failedAt: timestamp("failed_at"),
});

// Agent conversations
export const agentConversations = pgTable("agent_conversations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  message: text("message").notNull(),
  response: text("response").notNull(),
  context: jsonb("context"), // conversation context and metadata
  createdAt: timestamp("created_at").defaultNow(),
});

// System configurations
export const systemConfigurations = pgTable("system_configurations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  key: varchar("key").notNull(),
  value: jsonb("value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  emailConfigurations: many(emailConfigurations),
  campaigns: many(campaigns),
  emailLogs: many(emailLogs),
  agentConversations: many(agentConversations),
  systemConfigurations: many(systemConfigurations),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(users, {
    fields: [campaigns.userId],
    references: [users.id],
  }),
  emailLogs: many(emailLogs),
}));

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [emailLogs.campaignId],
    references: [campaigns.id],
  }),
  user: one(users, {
    fields: [emailLogs.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertEmailConfigurationSchema = createInsertSchema(emailConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  queuedAt: true,
  sentAt: true,
  deliveredAt: true,
  bouncedAt: true,
  failedAt: true,
});

export const insertQueueJobSchema = createInsertSchema(queueJobs).omit({
  id: true,
  createdAt: true,
  processedAt: true,
  completedAt: true,
  failedAt: true,
});

export const insertAgentConversationSchema = createInsertSchema(agentConversations).omit({
  id: true,
  createdAt: true,
});

export const insertSystemConfigurationSchema = createInsertSchema(systemConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// API Keys for external integrations
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  keyHash: varchar("key_hash", { length: 255 }).notNull(),
  permissions: jsonb("permissions").notNull(),
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Webhook configurations for external notifications
export const webhooks = pgTable("webhooks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  events: jsonb("events").notNull(), // Array of event types to listen for
  isActive: boolean("is_active").default(true),
  secret: varchar("secret", { length: 255 }), // For webhook signature verification
  retryAttempts: integer("retry_attempts").default(3),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Integration logs for monitoring
export const integrationLogs = pgTable("integration_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 50 }).notNull(), // 'api_call', 'webhook', 'sync'
  source: varchar("source", { length: 100 }), // API key name or webhook name
  endpoint: varchar("endpoint", { length: 200 }),
  method: varchar("method", { length: 10 }),
  statusCode: integer("status_code"),
  responseTime: integer("response_time"), // in milliseconds
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWebhookSchema = createInsertSchema(webhooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIntegrationLogSchema = createInsertSchema(integrationLogs).omit({
  id: true,
  createdAt: true,
});

// ===============================================
// BRING YOUR OWN KEYS (BYOK) WORKFLOW SYSTEM
// ===============================================

// AI provider credentials (user-supplied API keys)
// SECURITY: apiKey field MUST be encrypted at-rest using server-side encryption
// The service layer handles encryption/decryption transparently
export const aiCredentials = pgTable("ai_credentials", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(), // 'openai', 'anthropic', 'cohere', 'google', etc.
  name: varchar("name", { length: 200 }).notNull(), // user-friendly name
  apiKey: text("api_key").notNull(), // ENCRYPTED - decrypted only in memory when needed
  additionalConfig: jsonb("additional_config"), // org ID, project ID, etc. (public data)
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ai_credentials_user").on(table.userId),
  index("idx_ai_credentials_provider").on(table.provider),
]);

// Email service credentials (user-supplied)
// SECURITY: All secret fields (apiKey, awsSecretAccessKey) MUST be encrypted at-rest
// The service layer handles encryption/decryption transparently
export const emailServiceCredentials = pgTable("email_service_credentials", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(), // 'sendgrid', 'aws_ses', 'mailgun', etc.
  name: varchar("name", { length: 200 }).notNull(),
  apiKey: text("api_key"), // ENCRYPTED - for SendGrid, Mailgun
  awsAccessKeyId: text("aws_access_key_id"), // for AWS SES (public, not secret)
  awsSecretAccessKey: text("aws_secret_access_key"), // ENCRYPTED - for AWS SES
  awsRegion: varchar("aws_region", { length: 50 }), // for AWS SES (public)
  fromEmail: varchar("from_email", { length: 255 }).notNull(),
  fromName: varchar("from_name", { length: 200 }),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_email_creds_user").on(table.userId),
]);

// Workflows - AI content generation configurations
export const workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  aiCredentialId: uuid("ai_credential_id").references(() => aiCredentials.id, { onDelete: 'cascade' }).notNull(),
  model: varchar("model", { length: 100 }).notNull(), // 'gpt-4', 'claude-3-opus', etc.
  systemPrompt: text("system_prompt"),
  userPrompt: text("user_prompt").notNull(),
  temperature: decimal("temperature", { precision: 3, scale: 2 }).default('0.7'),
  maxTokens: integer("max_tokens").default(1000),
  topP: decimal("top_p", { precision: 3, scale: 2 }),
  frequencyPenalty: decimal("frequency_penalty", { precision: 3, scale: 2 }),
  presencePenalty: decimal("presence_penalty", { precision: 3, scale: 2 }),
  variables: jsonb("variables"), // dynamic variables to substitute in prompts
  outputFormat: varchar("output_format", { length: 50 }).default('text'), // 'text', 'json', 'markdown'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_workflows_user").on(table.userId),
  index("idx_workflows_ai_cred").on(table.aiCredentialId),
]);

// Workflow executions - history and results
export const workflowExecutions = pgTable("workflow_executions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: uuid("workflow_id").references(() => workflows.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // 'pending', 'running', 'completed', 'failed'
  input: jsonb("input"), // variable values used
  output: text("output"), // generated content
  tokenUsage: jsonb("token_usage"), // prompt_tokens, completion_tokens, total_tokens
  executionTime: integer("execution_time"), // milliseconds
  error: text("error"),
  metadata: jsonb("metadata"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_executions_workflow").on(table.workflowId),
  index("idx_executions_status").on(table.status),
  index("idx_executions_created").on(table.createdAt),
]);

// Delivery configurations - scheduled or API-based
export const deliveryConfigs = pgTable("delivery_configs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: uuid("workflow_id").references(() => workflows.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'scheduled_email', 'api', 'webhook'
  // Email delivery fields
  emailCredentialId: uuid("email_credential_id").references(() => emailServiceCredentials.id, { onDelete: 'set null' }),
  recipientEmails: jsonb("recipient_emails"), // array of email addresses
  emailSubject: varchar("email_subject", { length: 500 }),
  cronExpression: varchar("cron_expression", { length: 100 }),
  timezone: varchar("timezone", { length: 50 }).default('UTC'),
  // API delivery fields
  apiKeyId: uuid("api_key_id").references(() => apiKeys.id, { onDelete: 'set null' }), // reference to generated API key
  // Webhook delivery fields
  webhookUrl: varchar("webhook_url", { length: 500 }),
  webhookHeaders: jsonb("webhook_headers"),
  // Common fields
  isActive: boolean("is_active").default(true),
  lastDelivery: timestamp("last_delivery"),
  nextDelivery: timestamp("next_delivery"),
  totalDeliveries: integer("total_deliveries").default(0),
  failedDeliveries: integer("failed_deliveries").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_delivery_configs_workflow").on(table.workflowId),
  index("idx_delivery_configs_type").on(table.type),
]);

// Delivery logs
export const deliveryLogs = pgTable("delivery_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  deliveryConfigId: uuid("delivery_config_id").references(() => deliveryConfigs.id, { onDelete: 'cascade' }).notNull(),
  executionId: uuid("execution_id").references(() => workflowExecutions.id, { onDelete: 'set null' }),
  status: varchar("status", { length: 20 }).notNull(), // 'success', 'failed', 'pending'
  recipientEmail: varchar("recipient_email", { length: 255 }),
  statusCode: integer("status_code"),
  response: jsonb("response"),
  error: text("error"),
  deliveredAt: timestamp("delivered_at").defaultNow(),
}, (table) => [
  index("idx_delivery_logs_config").on(table.deliveryConfigId),
  index("idx_delivery_logs_status").on(table.status),
]);

// Insert schemas for BYOK tables
export const insertAiCredentialSchema = createInsertSchema(aiCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailServiceCredentialSchema = createInsertSchema(emailServiceCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowExecutionSchema = createInsertSchema(workflowExecutions).omit({
  id: true,
  createdAt: true,
});

export const insertDeliveryConfigSchema = createInsertSchema(deliveryConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeliveryLogSchema = createInsertSchema(deliveryLogs).omit({
  id: true,
});

// Types for BYOK tables
export type AiCredential = typeof aiCredentials.$inferSelect;
export type InsertAiCredential = z.infer<typeof insertAiCredentialSchema>;
export type EmailServiceCredential = typeof emailServiceCredentials.$inferSelect;
export type InsertEmailServiceCredential = z.infer<typeof insertEmailServiceCredentialSchema>;
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type InsertWorkflowExecution = z.infer<typeof insertWorkflowExecutionSchema>;
export type DeliveryConfig = typeof deliveryConfigs.$inferSelect;
export type InsertDeliveryConfig = z.infer<typeof insertDeliveryConfigSchema>;
export type DeliveryLog = typeof deliveryLogs.$inferSelect;
export type InsertDeliveryLog = z.infer<typeof insertDeliveryLogSchema>;

// ===============================================
// UNIVERSAL AI CONTENT PLATFORM TABLES
// ===============================================

// Content templates for AI generation
export const contentTemplates = pgTable("content_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }), // 'blog', 'newsletter', 'social', 'report', 'email', etc.
  aiPrompt: text("ai_prompt").notNull(),
  systemPrompt: text("system_prompt"),
  outputFormat: varchar("output_format", { length: 50 }).default('text'), // 'text', 'json', 'markdown', 'html'
  variables: jsonb("variables"), // Array of variable names expected in prompt
  settings: jsonb("settings"), // AI model settings, temperature, etc.
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(false),
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_content_templates_user").on(table.userId),
  index("idx_content_templates_user_active").on(table.userId, table.isActive),
  index("idx_content_templates_category").on(table.category),
]);

// Data sources for content generation
export const dataSources = pgTable("data_sources", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // 'api', 'database', 'file', 'astronomy', 'webhook', 'rss'
  config: jsonb("config").notNull(), // Connection configuration (endpoint, headers, auth, etc.)
  parsingRules: jsonb("parsing_rules").notNull(), // JSONPath, mappings, transformations
  schedule: varchar("schedule"), // Cron expression for automatic data refresh
  isActive: boolean("is_active").default(true),
  lastFetch: timestamp("last_fetch"),
  lastError: text("last_error"),
  fetchCount: integer("fetch_count").default(0),
  errorCount: integer("error_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Output channels for content distribution
export const outputChannels = pgTable("output_channels", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // 'api', 'email', 'webhook', 'file', 'database', 'redis', 's3'
  config: jsonb("config").notNull(), // Channel-specific configuration
  outputFormat: jsonb("output_format").notNull(), // Content formatting and template
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used"),
  totalDeliveries: integer("total_deliveries").default(0),
  failureCount: integer("failure_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Distribution rules for conditional routing
export const distributionRules = pgTable("distribution_rules", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  conditions: jsonb("conditions").notNull(), // Array of condition objects
  channels: jsonb("channels").notNull(), // Array of output channel IDs
  priority: integer("priority").default(0),
  isActive: boolean("is_active").default(true),
  appliedCount: integer("applied_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Scheduled content generation jobs
export const scheduledJobs = pgTable("scheduled_jobs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  templateId: uuid("template_id").references(() => contentTemplates.id, { onDelete: 'cascade' }).notNull(),
  cronExpression: varchar("cron_expression", { length: 100 }).notNull(),
  timezone: varchar("timezone", { length: 50 }).default('UTC'),
  isActive: boolean("is_active").default(true),
  nextRun: timestamp("next_run"),
  lastRun: timestamp("last_run"),
  lastStatus: varchar("last_status", { length: 20 }), // 'success', 'error', 'running'
  lastError: text("last_error"),
  totalRuns: integer("total_runs").default(0),
  successCount: integer("success_count").default(0),
  errorCount: integer("error_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_scheduled_jobs_next_run_active").on(table.nextRun, table.isActive),
  index("idx_scheduled_jobs_user_active").on(table.userId, table.isActive),
  index("idx_scheduled_jobs_template").on(table.templateId),
]);

// Generated content history
export const generatedContent = pgTable("generated_content", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  templateId: uuid("template_id").references(() => contentTemplates.id, { onDelete: 'set null' }),
  jobId: uuid("job_id").references(() => scheduledJobs.id, { onDelete: 'set null' }),
  title: varchar("title", { length: 500 }),
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // Source data, generation parameters, etc.
  distributionStatus: jsonb("distribution_status"), // Status per output channel
  generatedAt: timestamp("generated_at").defaultNow(),
}, (table) => [
  index("idx_generated_content_user").on(table.userId),
  index("idx_generated_content_template").on(table.templateId),
  index("idx_generated_content_job").on(table.jobId),
  index("idx_generated_content_date").on(table.generatedAt),
  index("idx_generated_content_user_date").on(table.userId, table.generatedAt),
]);

// Template to data source relationships (many-to-many)
export const templateDataSources = pgTable("template_data_sources", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: uuid("template_id").references(() => contentTemplates.id, { onDelete: 'cascade' }).notNull(),
  dataSourceId: uuid("data_source_id").references(() => dataSources.id, { onDelete: 'cascade' }).notNull(),
  variableMapping: jsonb("variable_mapping"), // How data source fields map to template variables
  isRequired: boolean("is_required").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_template_datasources_template").on(table.templateId),
  index("idx_template_datasources_datasource").on(table.dataSourceId),
]);

// Template to output channel relationships (many-to-many)
export const templateOutputChannels = pgTable("template_output_channels", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: uuid("template_id").references(() => contentTemplates.id, { onDelete: 'cascade' }).notNull(),
  channelId: uuid("channel_id").references(() => outputChannels.id, { onDelete: 'cascade' }).notNull(),
  isEnabled: boolean("is_enabled").default(true),
  channelConfig: jsonb("channel_config"), // Override channel settings for this template
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_template_channels_template").on(table.templateId),
  index("idx_template_channels_channel").on(table.channelId),
]);

// Insert schemas for new tables
export const insertContentTemplateSchema = createInsertSchema(contentTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDataSourceSchema = createInsertSchema(dataSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOutputChannelSchema = createInsertSchema(outputChannels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDistributionRuleSchema = createInsertSchema(distributionRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScheduledJobSchema = createInsertSchema(scheduledJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGeneratedContentSchema = createInsertSchema(generatedContent).omit({
  id: true,
  generatedAt: true,
});

export const insertTemplateDataSourceSchema = createInsertSchema(templateDataSources).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateOutputChannelSchema = createInsertSchema(templateOutputChannels).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type EmailConfiguration = typeof emailConfigurations.$inferSelect;
export type InsertEmailConfiguration = z.infer<typeof insertEmailConfigurationSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type QueueJob = typeof queueJobs.$inferSelect;
export type InsertQueueJob = z.infer<typeof insertQueueJobSchema>;
export type AgentConversation = typeof agentConversations.$inferSelect;
export type InsertAgentConversation = z.infer<typeof insertAgentConversationSchema>;
export type SystemConfiguration = typeof systemConfigurations.$inferSelect;
export type InsertSystemConfiguration = z.infer<typeof insertSystemConfigurationSchema>;

// Integration types
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type IntegrationLog = typeof integrationLogs.$inferSelect;
export type InsertIntegrationLog = z.infer<typeof insertIntegrationLogSchema>;

// Universal content platform relations
export const contentTemplatesRelations = relations(contentTemplates, ({ one, many }) => ({
  user: one(users, {
    fields: [contentTemplates.userId],
    references: [users.id],
  }),
  dataSources: many(templateDataSources),
  outputChannels: many(templateOutputChannels),
  scheduledJobs: many(scheduledJobs),
  generatedContent: many(generatedContent),
}));

export const dataSourcesRelations = relations(dataSources, ({ one, many }) => ({
  user: one(users, {
    fields: [dataSources.userId],
    references: [users.id],
  }),
  templates: many(templateDataSources),
}));

export const outputChannelsRelations = relations(outputChannels, ({ one, many }) => ({
  user: one(users, {
    fields: [outputChannels.userId],
    references: [users.id],
  }),
  templates: many(templateOutputChannels),
}));

export const distributionRulesRelations = relations(distributionRules, ({ one }) => ({
  user: one(users, {
    fields: [distributionRules.userId],
    references: [users.id],
  }),
}));

export const scheduledJobsRelations = relations(scheduledJobs, ({ one, many }) => ({
  user: one(users, {
    fields: [scheduledJobs.userId],
    references: [users.id],
  }),
  template: one(contentTemplates, {
    fields: [scheduledJobs.templateId],
    references: [contentTemplates.id],
  }),
  generatedContent: many(generatedContent),
}));

export const generatedContentRelations = relations(generatedContent, ({ one }) => ({
  user: one(users, {
    fields: [generatedContent.userId],
    references: [users.id],
  }),
  template: one(contentTemplates, {
    fields: [generatedContent.templateId],
    references: [contentTemplates.id],
  }),
  job: one(scheduledJobs, {
    fields: [generatedContent.jobId],
    references: [scheduledJobs.id],
  }),
}));

export const templateDataSourcesRelations = relations(templateDataSources, ({ one }) => ({
  template: one(contentTemplates, {
    fields: [templateDataSources.templateId],
    references: [contentTemplates.id],
  }),
  dataSource: one(dataSources, {
    fields: [templateDataSources.dataSourceId],
    references: [dataSources.id],
  }),
}));

export const templateOutputChannelsRelations = relations(templateOutputChannels, ({ one }) => ({
  template: one(contentTemplates, {
    fields: [templateOutputChannels.templateId],
    references: [contentTemplates.id],
  }),
  outputChannel: one(outputChannels, {
    fields: [templateOutputChannels.channelId],
    references: [outputChannels.id],
  }),
}));

// =============================================================================
// MONETIZATION & LICENSING (Tree Fiddy! 🦕)
// =============================================================================

// License keys ($3.50 lifetime per device)
export const licenses = pgTable("licenses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  licenseKey: varchar("license_key", { length: 255 }).unique().notNull(),
  deviceFingerprint: varchar("device_fingerprint", { length: 255 }),
  activatedAt: timestamp("activated_at"),
  deactivatedAt: timestamp("deactivated_at"),
  lastValidated: timestamp("last_validated"),
  paymentId: varchar("payment_id"),
  status: varchar("status").notNull().default('inactive'), // inactive, active, deactivated
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_licenses_user").on(table.userId),
  index("idx_licenses_key").on(table.licenseKey),
  index("idx_licenses_status").on(table.status),
]);

// Stripe customers
export const stripeCustomers = pgTable("stripe_customers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique().notNull(),
  email: varchar("email"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_stripe_customers_user").on(table.userId),
  index("idx_stripe_customers_stripe_id").on(table.stripeCustomerId),
]);

// Managed hosting subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).unique(),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  tier: varchar("tier").notNull(), // lite, standard, pro, business
  status: varchar("status").notNull(), // active, canceled, past_due, unpaid, etc.
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_subscriptions_user").on(table.userId),
  index("idx_subscriptions_stripe_id").on(table.stripeSubscriptionId),
  index("idx_subscriptions_status").on(table.status),
]);

// Managed DigitalOcean droplet instances
export const managedInstances = pgTable("managed_instances", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
  dropletId: varchar("droplet_id").notNull(),
  name: varchar("name").notNull(),
  ipAddress: varchar("ip_address"),
  domain: varchar("domain"),
  size: varchar("size").notNull(), // s-1vcpu-1gb, s-2vcpu-2gb, etc.
  region: varchar("region").notNull(), // nyc1, sfo3, etc.
  status: varchar("status").notNull(), // provisioning, active, stopped, error, destroyed
  lastHealthCheck: timestamp("last_health_check"),
  healthStatus: jsonb("health_status"), // CPU, memory, disk metrics
  createdAt: timestamp("created_at").defaultNow(),
  destroyedAt: timestamp("destroyed_at"),
}, (table) => [
  index("idx_managed_instances_user").on(table.userId),
  index("idx_managed_instances_subscription").on(table.subscriptionId),
  index("idx_managed_instances_status").on(table.status),
]);

// Payment history
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }).unique(),
  amount: integer("amount").notNull(), // Amount in cents
  currency: varchar("currency").default('usd'),
  status: varchar("status").notNull(), // succeeded, failed, pending, etc.
  description: varchar("description"),
  receiptUrl: varchar("receipt_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_payments_user").on(table.userId),
  index("idx_payments_status").on(table.status),
]);

// Insert schemas for monetization tables
export const insertLicenseSchema = createInsertSchema(licenses);
export const insertStripeCustomerSchema = createInsertSchema(stripeCustomers);
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const insertManagedInstanceSchema = createInsertSchema(managedInstances);
export const insertPaymentSchema = createInsertSchema(payments);

// Relations for monetization tables
export const licensesRelations = relations(licenses, ({ one }) => ({
  user: one(users, {
    fields: [licenses.userId],
    references: [users.id],
  }),
}));

export const stripeCustomersRelations = relations(stripeCustomers, ({ one }) => ({
  user: one(users, {
    fields: [stripeCustomers.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  managedInstances: many(managedInstances),
}));

export const managedInstancesRelations = relations(managedInstances, ({ one }) => ({
  user: one(users, {
    fields: [managedInstances.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [managedInstances.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Universal content platform types
export type ContentTemplate = typeof contentTemplates.$inferSelect;
export type InsertContentTemplate = z.infer<typeof insertContentTemplateSchema>;
export type DataSource = typeof dataSources.$inferSelect;
export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;
export type OutputChannel = typeof outputChannels.$inferSelect;
export type InsertOutputChannel = z.infer<typeof insertOutputChannelSchema>;
export type DistributionRule = typeof distributionRules.$inferSelect;
export type InsertDistributionRule = z.infer<typeof insertDistributionRuleSchema>;
export type ScheduledJob = typeof scheduledJobs.$inferSelect;
export type InsertScheduledJob = z.infer<typeof insertScheduledJobSchema>;
export type GeneratedContent = typeof generatedContent.$inferSelect;
export type InsertGeneratedContent = z.infer<typeof insertGeneratedContentSchema>;
export type TemplateDataSource = typeof templateDataSources.$inferSelect;
export type InsertTemplateDataSource = z.infer<typeof insertTemplateDataSourceSchema>;
export type TemplateOutputChannel = typeof templateOutputChannels.$inferSelect;
export type InsertTemplateOutputChannel = z.infer<typeof insertTemplateOutputChannelSchema>;

// Monetization types
export type License = typeof licenses.$inferSelect;
export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type StripeCustomer = typeof stripeCustomers.$inferSelect;
export type InsertStripeCustomer = z.infer<typeof insertStripeCustomerSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type ManagedInstance = typeof managedInstances.$inferSelect;
export type InsertManagedInstance = z.infer<typeof insertManagedInstanceSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
