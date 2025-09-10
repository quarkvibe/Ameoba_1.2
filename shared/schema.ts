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
  id: integer("id").primaryKey(), // 1-12 for Aries to Pisces
  name: varchar("name").notNull().unique(), // 'aries', 'taurus', etc.
  symbol: varchar("symbol").notNull(), // '♈', '♉', etc.
  element: varchar("element").notNull(), // 'fire', 'earth', 'air', 'water'
  quality: varchar("quality").notNull(), // 'cardinal', 'fixed', 'mutable'
  dateRange: varchar("date_range").notNull(), // 'Mar 21 - Apr 19'
  traits: jsonb("traits"), // personality traits, compatibility info
});

// Daily horoscopes for each zodiac sign
export const horoscopes = pgTable("horoscopes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  zodiacSignId: integer("zodiac_sign_id").references(() => zodiacSigns.id).notNull(),
  date: date("date").notNull(),
  content: text("content").notNull(), // generated horoscope text
  mood: varchar("mood"), // 'positive', 'neutral', 'challenging'
  luckNumber: integer("luck_number"),
  luckyColor: varchar("lucky_color"),
  planetaryInfluence: jsonb("planetary_influence"), // relevant planetary data used
  generatedAt: timestamp("generated_at").defaultNow(),
  generationJobId: uuid("generation_job_id").references(() => queueJobs.id),
}, (table) => [
  index("idx_horoscopes_date_sign").on(table.date, table.zodiacSignId),
]);

// Premium user sun chart and astrology data
export const userSunCharts = pgTable("user_sun_charts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  zodiacSignId: integer("zodiac_sign_id").references(() => zodiacSigns.id).notNull(),
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
  astrologyDataId: uuid("astrology_data_id").references(() => astrologyDataCache.id),
  generationJobIds: jsonb("generation_job_ids"), // array of related queue job IDs
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  error: text("error"),
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
  generationJob: one(queueJobs, {
    fields: [horoscopes.generationJobId],
    references: [queueJobs.id],
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

export const horoscopeGenerationsRelations = relations(horoscopeGenerations, ({ one }) => ({
  astrologyData: one(astrologyDataCache, {
    fields: [horoscopeGenerations.astrologyDataId],
    references: [astrologyDataCache.id],
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

export const insertZodiacSignSchema = createInsertSchema(zodiacSigns);

export const insertHoroscopeSchema = createInsertSchema(horoscopes).omit({
  id: true,
  generatedAt: true,
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
