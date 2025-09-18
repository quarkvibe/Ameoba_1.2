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
  userId: varchar("user_id").references(() => users.id),
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
  userId: varchar("user_id").references(() => users.id),
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
});

// Email logs
export const emailLogs = pgTable("email_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: uuid("campaign_id").references(() => campaigns.id),
  userId: varchar("user_id").references(() => users.id),
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
  userId: varchar("user_id").references(() => users.id),
  message: text("message").notNull(),
  response: text("response").notNull(),
  context: jsonb("context"), // conversation context and metadata
  createdAt: timestamp("created_at").defaultNow(),
});

// System configurations
export const systemConfigurations = pgTable("system_configurations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  key: varchar("key").notNull(),
  value: jsonb("value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zodiac signs reference table
export const zodiacSigns = pgTable("zodiac_signs", {
  id: varchar("id").primaryKey(), // 'aries', 'taurus', etc.
  name: varchar("name").notNull().unique(), // 'Aries', 'Taurus', etc.
  // Simplified to core fields that exist in production database
  // Removed: symbol, element, quality, dateRange, traits
});

// Daily horoscopes for each zodiac sign
export const horoscopes = pgTable("horoscopes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  zodiacSignId: varchar("zodiac_sign_id").references(() => zodiacSigns.id).notNull(),
  date: date("date").notNull(),
  content: text("content").notNull(), // generated horoscope text
  // Temporarily removed optional fields that don't exist in production:
  // mood, luckNumber, luckyColor, planetaryInfluence, generatedAt, generationJobId
}, (table) => [
  index("idx_horoscopes_date_sign").on(table.date, table.zodiacSignId),
]);

// Premium user sun chart and astrology data
export const userSunCharts = pgTable("user_sun_charts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  zodiacSignId: varchar("zodiac_sign_id").references(() => zodiacSigns.id).notNull(),
  birthDate: date("birth_date").notNull(),
  birthTime: varchar("birth_time"), // HH:MM format
  birthLocation: varchar("birth_location"), // city, country
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  timezone: varchar("timezone"),
  ascendant: varchar("ascendant"), // rising sign
  moonSign: varchar("moon_sign"),
  planetaryPositions: jsonb("planetary_positions"), // birth chart planetary positions
  houses: jsonb("houses"), // astrological houses data
  aspects: jsonb("aspects"), // planetary aspects
  isPremium: boolean("is_premium").default(true),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cached astrology data from external APIs
export const astrologyDataCache = pgTable("astrology_data_cache", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull().unique(),
  planetaryPositions: jsonb("planetary_positions").notNull(), // current planetary data
  aspects: jsonb("aspects"), // planetary aspects for the day
  moonPhase: varchar("moon_phase"),
  apiSource: varchar("api_source").notNull(), // 'freeastrology', 'astrologyapi', etc.
  rawData: jsonb("raw_data"), // complete API response for reference
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_astrology_cache_date").on(table.date),
  index("idx_astrology_cache_expires").on(table.expiresAt),
]);

// Daily horoscope generation tracking
export const horoscopeGenerations = pgTable("horoscope_generations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull().unique(),
  status: varchar("status").notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed'
  totalSigns: integer("total_signs").default(12),
  completedSigns: integer("completed_signs").default(0),
  // Removed astrologyDataId to match production database schema
  // Removed generationJobIds to match production database schema
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  // Removed error column to match production database schema
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_horoscope_gen_date").on(table.date),
  index("idx_horoscope_gen_status").on(table.status),
]);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  emailConfigurations: many(emailConfigurations),
  campaigns: many(campaigns),
  emailLogs: many(emailLogs),
  agentConversations: many(agentConversations),
  systemConfigurations: many(systemConfigurations),
  sunChart: one(userSunCharts),
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

export const zodiacSignsRelations = relations(zodiacSigns, ({ many }) => ({
  horoscopes: many(horoscopes),
  userSunCharts: many(userSunCharts),
}));

export const horoscopesRelations = relations(horoscopes, ({ one }) => ({
  zodiacSign: one(zodiacSigns, {
    fields: [horoscopes.zodiacSignId],
    references: [zodiacSigns.id],
  }),
}));

export const userSunChartsRelations = relations(userSunCharts, ({ one }) => ({
  user: one(users, {
    fields: [userSunCharts.userId],
    references: [users.id],
  }),
  zodiacSign: one(zodiacSigns, {
    fields: [userSunCharts.zodiacSignId],
    references: [zodiacSigns.id],
  }),
}));

// Removed horoscopeGenerationsRelations because astrologyDataId field was removed to match production schema
// export const horoscopeGenerationsRelations = relations(horoscopeGenerations, ({ one }) => ({
//   astrologyData: one(astrologyDataCache, {
//     fields: [horoscopeGenerations.astrologyDataId],
//     references: [astrologyDataCache.id],
//   }),
// }));


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

export const insertZodiacSignSchema = createInsertSchema(zodiacSigns);

export const insertHoroscopeSchema = createInsertSchema(horoscopes).omit({
  id: true,
});

export const insertUserSunChartSchema = createInsertSchema(userSunCharts).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

export const insertAstrologyDataCacheSchema = createInsertSchema(astrologyDataCache).omit({
  id: true,
  createdAt: true,
});

export const insertHoroscopeGenerationSchema = createInsertSchema(horoscopeGenerations).omit({
  id: true,
  createdAt: true,
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
// UNIVERSAL AI CONTENT PLATFORM TABLES
// ===============================================

// Content templates for AI generation
export const contentTemplates = pgTable("content_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }), // 'horoscope', 'blog', 'newsletter', etc.
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
});

// Data sources for content generation
export const dataSources = pgTable("data_sources", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
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
  userId: varchar("user_id").references(() => users.id),
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
  userId: varchar("user_id").references(() => users.id),
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
  userId: varchar("user_id").references(() => users.id),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  templateId: uuid("template_id").references(() => contentTemplates.id).notNull(),
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
});

// Generated content history
export const generatedContent = pgTable("generated_content", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  templateId: uuid("template_id").references(() => contentTemplates.id),
  jobId: uuid("job_id").references(() => scheduledJobs.id),
  title: varchar("title", { length: 500 }),
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // Source data, generation parameters, etc.
  distributionStatus: jsonb("distribution_status"), // Status per output channel
  generatedAt: timestamp("generated_at").defaultNow(),
}, (table) => [
  index("idx_generated_content_template").on(table.templateId),
  index("idx_generated_content_job").on(table.jobId),
  index("idx_generated_content_date").on(table.generatedAt),
]);

// Template to data source relationships (many-to-many)
export const templateDataSources = pgTable("template_data_sources", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: uuid("template_id").references(() => contentTemplates.id).notNull(),
  dataSourceId: uuid("data_source_id").references(() => dataSources.id).notNull(),
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
  templateId: uuid("template_id").references(() => contentTemplates.id).notNull(),
  channelId: uuid("channel_id").references(() => outputChannels.id).notNull(),
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

// Horoscope types
export type ZodiacSign = typeof zodiacSigns.$inferSelect;
export type InsertZodiacSign = z.infer<typeof insertZodiacSignSchema>;
export type Horoscope = typeof horoscopes.$inferSelect;
export type InsertHoroscope = z.infer<typeof insertHoroscopeSchema>;
export type UserSunChart = typeof userSunCharts.$inferSelect;
export type InsertUserSunChart = z.infer<typeof insertUserSunChartSchema>;
export type AstrologyDataCache = typeof astrologyDataCache.$inferSelect;
export type InsertAstrologyDataCache = z.infer<typeof insertAstrologyDataCacheSchema>;
export type HoroscopeGeneration = typeof horoscopeGenerations.$inferSelect;
export type InsertHoroscopeGeneration = z.infer<typeof insertHoroscopeGenerationSchema>;

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
