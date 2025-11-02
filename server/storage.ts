import {
  users,
  campaigns,
  emailLogs,
  emailConfigurations,
  queueJobs,
  agentConversations,
  systemConfigurations,
  type User,
  type UpsertUser,
  type Campaign,
  type InsertCampaign,
  type EmailLog,
  type InsertEmailLog,
  type EmailConfiguration,
  type InsertEmailConfiguration,
  type QueueJob,
  type InsertQueueJob,
  type AgentConversation,
  type InsertAgentConversation,
  type SystemConfiguration,
  type InsertSystemConfiguration,
  apiKeys,
  type ApiKey,
  type InsertApiKey,
  webhooks,
  type Webhook,
  type InsertWebhook,
  integrationLogs,
  type IntegrationLog,
  type InsertIntegrationLog,
  contentTemplates,
  type ContentTemplate,
  type InsertContentTemplate,
  dataSources,
  type DataSource,
  type InsertDataSource,
  outputChannels,
  type OutputChannel,
  type InsertOutputChannel,
  distributionRules,
  type DistributionRule,
  type InsertDistributionRule,
  scheduledJobs,
  type ScheduledJob,
  type InsertScheduledJob,
  generatedContent,
  type GeneratedContent,
  type InsertGeneratedContent,
  templateDataSources,
  type TemplateDataSource,
  type InsertTemplateDataSource,
  templateOutputChannels,
  type TemplateOutputChannel,
  type InsertTemplateOutputChannel,
  aiCredentials,
  type AiCredential,
  type InsertAiCredential,
  emailServiceCredentials,
  type EmailServiceCredential,
  type InsertEmailServiceCredential,
  licenses,
  type License,
  type InsertLicense,
  stripeCustomers,
  type StripeCustomer,
  type InsertStripeCustomer,
  subscriptions,
  type Subscription,
  type InsertSubscription,
  managedInstances,
  type ManagedInstance,
  type InsertManagedInstance,
  payments,
  type Payment,
  type InsertPayment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, gte, lte } from "drizzle-orm";
import { encryptionService } from "./services/encryptionService";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Campaign operations
  getCampaigns(userId: string): Promise<Campaign[]>;
  getCampaign(id: string, userId: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, userId: string, updates: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: string, userId: string): Promise<boolean>;
  
  // Email log operations
  getEmailLogs(userId: string, limit?: number): Promise<EmailLog[]>;
  createEmailLog(log: InsertEmailLog): Promise<EmailLog>;
  updateEmailLogStatus(id: string, status: string, metadata?: any): Promise<void>;
  getEmailMetrics(userId: string, startDate?: Date, endDate?: Date): Promise<any>;
  
  // Email configuration operations
  getEmailConfigurations(userId: string): Promise<EmailConfiguration[]>;
  getDefaultEmailConfiguration(userId: string): Promise<EmailConfiguration | undefined>;
  createEmailConfiguration(config: InsertEmailConfiguration): Promise<EmailConfiguration>;
  updateEmailConfiguration(id: string, userId: string, updates: Partial<InsertEmailConfiguration>): Promise<EmailConfiguration | undefined>;
  
  // Queue operations
  getQueueJobs(status?: string, limit?: number): Promise<QueueJob[]>;
  createQueueJob(job: InsertQueueJob): Promise<QueueJob>;
  updateQueueJob(id: string, updates: Partial<QueueJob>): Promise<void>;
  getQueueMetrics(): Promise<any>;
  
  // Agent operations
  getAgentConversations(userId: string, limit?: number): Promise<AgentConversation[]>;
  createAgentConversation(conversation: InsertAgentConversation): Promise<AgentConversation>;
  
  // System configuration operations
  getSystemConfiguration(userId: string, key: string): Promise<SystemConfiguration | undefined>;
  setSystemConfiguration(config: InsertSystemConfiguration): Promise<SystemConfiguration>;

  // Integration operations
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined>;
  updateApiKeyLastUsed(id: string): Promise<void>;
  deactivateApiKey(id: string): Promise<void>;
  getActiveApiKeys(): Promise<ApiKey[]>;
  
  createWebhook(webhook: InsertWebhook): Promise<Webhook>;
  getActiveWebhooks(): Promise<Webhook[]>;
  getActiveWebhooksByEvent(event: string): Promise<Webhook[]>;
  updateWebhookLastTriggered(id: string): Promise<void>;
  
  createIntegrationLog(log: InsertIntegrationLog): Promise<IntegrationLog>;
  getIntegrationLogsSince(since: Date): Promise<IntegrationLog[]>;

  // ===============================================
  // UNIVERSAL CONTENT PLATFORM OPERATIONS
  // ===============================================

  // Content template operations
  getContentTemplates(userId: string): Promise<ContentTemplate[]>;
  getContentTemplate(id: string, userId: string): Promise<ContentTemplate | undefined>;
  getContentTemplateById(id: string): Promise<ContentTemplate | undefined>;
  createContentTemplate(template: InsertContentTemplate): Promise<ContentTemplate>;
  updateContentTemplate(id: string, userId: string, updates: Partial<InsertContentTemplate>): Promise<ContentTemplate | undefined>;
  deleteContentTemplate(id: string, userId: string): Promise<boolean>;

  // Data source operations
  getDataSources(userId: string): Promise<DataSource[]>;
  getDataSource(id: string, userId: string): Promise<DataSource | undefined>;
  createDataSource(dataSource: InsertDataSource): Promise<DataSource>;
  updateDataSource(id: string, userId: string, updates: Partial<InsertDataSource>): Promise<DataSource | undefined>;
  deleteDataSource(id: string, userId: string): Promise<boolean>;
  updateDataSourceFetchStatus(id: string, lastFetch?: Date, lastError?: string): Promise<void>;

  // Output channel operations
  getOutputChannels(userId: string): Promise<OutputChannel[]>;
  getOutputChannel(id: string, userId: string): Promise<OutputChannel | undefined>;
  createOutputChannel(channel: InsertOutputChannel): Promise<OutputChannel>;
  updateOutputChannel(id: string, userId: string, updates: Partial<InsertOutputChannel>): Promise<OutputChannel | undefined>;
  deleteOutputChannel(id: string, userId: string): Promise<boolean>;
  updateOutputChannelUsage(id: string, success: boolean): Promise<void>;

  // Distribution rule operations
  getDistributionRules(userId: string): Promise<DistributionRule[]>;
  getDistributionRule(id: string, userId: string): Promise<DistributionRule | undefined>;
  createDistributionRule(rule: InsertDistributionRule): Promise<DistributionRule>;
  updateDistributionRule(id: string, userId: string, updates: Partial<InsertDistributionRule>): Promise<DistributionRule | undefined>;
  deleteDistributionRule(id: string, userId: string): Promise<boolean>;

  // Scheduled job operations
  getScheduledJobs(userId: string): Promise<ScheduledJob[]>;
  getScheduledJob(id: string, userId: string): Promise<ScheduledJob | undefined>;
  getScheduledJobById(id: string): Promise<ScheduledJob | undefined>;
  getActiveScheduledJobs(): Promise<ScheduledJob[]>;
  createScheduledJob(job: InsertScheduledJob): Promise<ScheduledJob>;
  updateScheduledJob(id: string, userId: string, updates: Partial<InsertScheduledJob>): Promise<ScheduledJob | undefined>;
  deleteScheduledJob(id: string, userId: string): Promise<boolean>;
  updateScheduledJobStatus(id: string, status: string, error?: string): Promise<void>;
  updateScheduledJobNextRun(id: string, nextRun: Date): Promise<void>;
  updateScheduledJobLastRun(id: string, lastRun: Date): Promise<void>;
  updateScheduledJobRunHistory(id: string, success: boolean, nextRun?: Date): Promise<void>;
  incrementScheduledJobSuccessCount(id: string): Promise<void>;
  incrementScheduledJobErrorCount(id: string): Promise<void>;

  // Generated content operations
  getGeneratedContent(userId: string, limit?: number): Promise<GeneratedContent[]>;
  getGeneratedContentByTemplate(templateId: string, userId: string, limit?: number): Promise<GeneratedContent[]>;
  createGeneratedContent(content: InsertGeneratedContent): Promise<GeneratedContent>;

  // Template relationship operations
  getTemplateDataSources(templateId: string): Promise<TemplateDataSource[]>;
  createTemplateDataSource(relation: InsertTemplateDataSource): Promise<TemplateDataSource>;
  deleteTemplateDataSource(templateId: string, dataSourceId: string): Promise<boolean>;

  getTemplateOutputChannels(templateId: string): Promise<TemplateOutputChannel[]>;
  createTemplateOutputChannel(relation: InsertTemplateOutputChannel): Promise<TemplateOutputChannel>;
  deleteTemplateOutputChannel(templateId: string, channelId: string): Promise<boolean>;

  // ===============================================
  // BYOK CREDENTIALS (with encryption)
  // ===============================================
  
  // AI Credentials operations
  getAiCredentials(userId: string): Promise<AiCredential[]>;
  getAiCredential(id: string, userId: string): Promise<AiCredential | undefined>;
  getDefaultAiCredential(userId: string, provider?: string): Promise<AiCredential | undefined>;
  createAiCredential(credential: InsertAiCredential): Promise<AiCredential>;
  updateAiCredential(id: string, userId: string, updates: Partial<InsertAiCredential>): Promise<AiCredential | undefined>;
  deleteAiCredential(id: string, userId: string): Promise<boolean>;
  
  // Email Service Credentials operations
  getEmailServiceCredentials(userId: string): Promise<EmailServiceCredential[]>;
  getEmailServiceCredential(id: string, userId: string): Promise<EmailServiceCredential | undefined>;
  getDefaultEmailServiceCredential(userId: string): Promise<EmailServiceCredential | undefined>;
  createEmailServiceCredential(credential: InsertEmailServiceCredential): Promise<EmailServiceCredential>;
  updateEmailServiceCredential(id: string, userId: string, updates: Partial<InsertEmailServiceCredential>): Promise<EmailServiceCredential | undefined>;
  deleteEmailServiceCredential(id: string, userId: string): Promise<boolean>;

  // Monetization operations (Tree Fiddy! 🦕)
  // License operations
  createLicense(license: InsertLicense): Promise<License>;
  getLicenseByKey(licenseKey: string): Promise<License | undefined>;
  getActiveLicense(userId: string): Promise<License | undefined>;
  activateLicense(licenseKey: string, deviceFingerprint: string): Promise<void>;
  deactivateLicense(licenseKey: string): Promise<void>;
  getUserLicenses(userId: string): Promise<License[]>;
  updateLicenseLastValidated(id: string): Promise<void>;
  getLicenseStats(): Promise<{ total: number; active: number; inactive: number; deactivated: number }>;
  
  // Stripe customer operations
  createStripeCustomer(customer: InsertStripeCustomer): Promise<StripeCustomer>;
  getStripeCustomer(userId: string): Promise<StripeCustomer | undefined>;
  getStripeCustomerByStripeId(stripeCustomerId: string): Promise<StripeCustomer | undefined>;
  
  // Subscription operations
  upsertSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  updateSubscriptionStatus(stripeSubscriptionId: string, status: string): Promise<void>;
  updateSubscriptionCancelAtPeriodEnd(id: string, cancelAtPeriodEnd: boolean): Promise<void>;
  
  // Managed instance operations
  createManagedInstance(instance: InsertManagedInstance): Promise<ManagedInstance>;
  getManagedInstances(userId: string): Promise<ManagedInstance[]>;
  getManagedInstance(id: string, userId: string): Promise<ManagedInstance | undefined>;
  updateManagedInstanceStatus(id: string, status: string, healthStatus?: any): Promise<void>;
  deleteManagedInstance(id: string, userId: string): Promise<boolean>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getUserPayments(userId: string, limit?: number): Promise<Payment[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Campaign operations
  async getCampaigns(userId: string): Promise<Campaign[]> {
    return await db.select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: string, userId: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select()
      .from(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
    return campaign;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db.insert(campaigns).values(campaign).returning();
    return newCampaign;
  }

  async updateCampaign(id: string, userId: string, updates: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const [updated] = await db.update(campaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)))
      .returning();
    return updated;
  }

  async deleteCampaign(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Email log operations
  async getEmailLogs(userId: string, limit = 50): Promise<EmailLog[]> {
    return await db.select()
      .from(emailLogs)
      .where(eq(emailLogs.userId, userId))
      .orderBy(desc(emailLogs.queuedAt))
      .limit(limit);
  }

  async createEmailLog(log: InsertEmailLog): Promise<EmailLog> {
    const [newLog] = await db.insert(emailLogs).values(log).returning();
    return newLog;
  }

  async updateEmailLogStatus(id: string, status: string, metadata?: any): Promise<void> {
    const updates: any = { status };
    
    if (status === 'sent') updates.sentAt = new Date();
    if (status === 'delivered') updates.deliveredAt = new Date();
    if (status === 'bounced') updates.bouncedAt = new Date();
    if (status === 'failed') updates.failedAt = new Date();
    if (metadata) updates.metadata = metadata;

    await db.update(emailLogs)
      .set(updates)
      .where(eq(emailLogs.id, id));
  }

  async getEmailMetrics(userId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const whereClause = startDate && endDate 
      ? and(
          eq(emailLogs.userId, userId),
          gte(emailLogs.queuedAt, startDate),
          lte(emailLogs.queuedAt, endDate)
        )
      : eq(emailLogs.userId, userId);

    const [metrics] = await db.select({
      total: count(),
      sent: sql<number>`sum(case when status = 'sent' then 1 else 0 end)`,
      delivered: sql<number>`sum(case when status = 'delivered' then 1 else 0 end)`,
      bounced: sql<number>`sum(case when status = 'bounced' then 1 else 0 end)`,
      failed: sql<number>`sum(case when status = 'failed' then 1 else 0 end)`,
    }).from(emailLogs).where(whereClause);

    return metrics;
  }

  // Email configuration operations (with encryption)
  async getEmailConfigurations(userId: string): Promise<EmailConfiguration[]> {
    const configs = await db.select()
      .from(emailConfigurations)
      .where(eq(emailConfigurations.userId, userId))
      .orderBy(desc(emailConfigurations.isDefault));
    
    // Decrypt API keys before returning
    return configs.map(config => ({
      ...config,
      apiKey: encryptionService.decrypt(config.apiKey),
    }));
  }

  async getDefaultEmailConfiguration(userId: string): Promise<EmailConfiguration | undefined> {
    const [config] = await db.select()
      .from(emailConfigurations)
      .where(and(
        eq(emailConfigurations.userId, userId),
        eq(emailConfigurations.isDefault, true),
        eq(emailConfigurations.isActive, true)
      ));
    
    if (!config) return undefined;
    
    // Decrypt API key before returning
    return {
      ...config,
      apiKey: encryptionService.decrypt(config.apiKey),
    };
  }

  async createEmailConfiguration(config: InsertEmailConfiguration): Promise<EmailConfiguration> {
    // Encrypt API key before storing
    const encryptedConfig = {
      ...config,
      apiKey: encryptionService.encrypt(config.apiKey),
    };
    
    const [newConfig] = await db.insert(emailConfigurations)
      .values(encryptedConfig)
      .returning();
    
    // Return decrypted version to caller
    return {
      ...newConfig,
      apiKey: encryptionService.decrypt(newConfig.apiKey),
    };
  }

  async updateEmailConfiguration(id: string, userId: string, updates: Partial<InsertEmailConfiguration>): Promise<EmailConfiguration | undefined> {
    // Encrypt API key if it's being updated
    const encryptedUpdates = {
      ...updates,
      ...(updates.apiKey && { apiKey: encryptionService.encrypt(updates.apiKey) }),
      updatedAt: new Date(),
    };
    
    const [updated] = await db.update(emailConfigurations)
      .set(encryptedUpdates)
      .where(and(eq(emailConfigurations.id, id), eq(emailConfigurations.userId, userId)))
      .returning();
    
    if (!updated) return undefined;
    
    // Return decrypted version
    return {
      ...updated,
      apiKey: encryptionService.decrypt(updated.apiKey),
    };
  }

  // Queue operations
  async getQueueJobs(status?: string, limit = 100): Promise<QueueJob[]> {
    const whereClause = status ? eq(queueJobs.status, status) : undefined;
    
    return await db.select()
      .from(queueJobs)
      .where(whereClause)
      .orderBy(desc(queueJobs.createdAt))
      .limit(limit);
  }

  async createQueueJob(job: InsertQueueJob): Promise<QueueJob> {
    const [newJob] = await db.insert(queueJobs).values(job).returning();
    return newJob;
  }

  async updateQueueJob(id: string, updates: Partial<QueueJob>): Promise<void> {
    await db.update(queueJobs)
      .set(updates)
      .where(eq(queueJobs.id, id));
  }

  async getQueueMetrics(): Promise<any> {
    const [metrics] = await db.select({
      total: count(),
      pending: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
      processing: sql<number>`sum(case when status = 'processing' then 1 else 0 end)`,
      completed: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
      failed: sql<number>`sum(case when status = 'failed' then 1 else 0 end)`,
    }).from(queueJobs);

    return metrics;
  }

  // Agent operations
  async getAgentConversations(userId: string, limit = 20): Promise<AgentConversation[]> {
    return await db.select()
      .from(agentConversations)
      .where(eq(agentConversations.userId, userId))
      .orderBy(desc(agentConversations.createdAt))
      .limit(limit);
  }

  async createAgentConversation(conversation: InsertAgentConversation): Promise<AgentConversation> {
    const [newConversation] = await db.insert(agentConversations).values(conversation).returning();
    return newConversation;
  }

  // System configuration operations
  async getSystemConfiguration(userId: string, key: string): Promise<SystemConfiguration | undefined> {
    const [config] = await db.select()
      .from(systemConfigurations)
      .where(and(eq(systemConfigurations.userId, userId), eq(systemConfigurations.key, key)));
    return config;
  }

  async setSystemConfiguration(config: InsertSystemConfiguration): Promise<SystemConfiguration> {
    const [newConfig] = await db.insert(systemConfigurations)
      .values(config)
      .onConflictDoUpdate({
        target: [systemConfigurations.userId, systemConfigurations.key],
        set: {
          value: config.value,
          updatedAt: new Date(),
        },
      })
      .returning();
    return newConfig;
  }

  // Integration operations
  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const [newApiKey] = await db.insert(apiKeys).values(apiKey).returning();
    return newApiKey;
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select()
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash));
    return apiKey;
  }

  async updateApiKeyLastUsed(id: string): Promise<void> {
    await db.update(apiKeys)
      .set({ lastUsed: new Date() })
      .where(eq(apiKeys.id, id));
  }

  async deactivateApiKey(id: string): Promise<void> {
    await db.update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, id));
  }

  async getActiveApiKeys(): Promise<ApiKey[]> {
    return await db.select()
      .from(apiKeys)
      .where(eq(apiKeys.isActive, true))
      .orderBy(desc(apiKeys.createdAt));
  }

  async createWebhook(webhook: InsertWebhook): Promise<Webhook> {
    const [newWebhook] = await db.insert(webhooks).values(webhook).returning();
    return newWebhook;
  }

  async getActiveWebhooks(): Promise<Webhook[]> {
    return await db.select()
      .from(webhooks)
      .where(eq(webhooks.isActive, true))
      .orderBy(desc(webhooks.createdAt));
  }

  async getActiveWebhooksByEvent(event: string): Promise<Webhook[]> {
    return await db.select()
      .from(webhooks)
      .where(and(
        eq(webhooks.isActive, true),
        sql`${webhooks.events} @> ${JSON.stringify([event])}`
      ));
  }

  async updateWebhookLastTriggered(id: string): Promise<void> {
    await db.update(webhooks)
      .set({ lastTriggered: new Date() })
      .where(eq(webhooks.id, id));
  }

  async createIntegrationLog(log: InsertIntegrationLog): Promise<IntegrationLog> {
    const [newLog] = await db.insert(integrationLogs).values(log).returning();
    return newLog;
  }

  async getIntegrationLogsSince(since: Date): Promise<IntegrationLog[]> {
    return await db.select()
      .from(integrationLogs)
      .where(gte(integrationLogs.createdAt, since))
      .orderBy(desc(integrationLogs.createdAt));
  }

  // ===============================================
  // UNIVERSAL CONTENT PLATFORM IMPLEMENTATIONS
  // ===============================================

  // Content template operations
  async getContentTemplates(userId: string): Promise<ContentTemplate[]> {
    return await db.select()
      .from(contentTemplates)
      .where(eq(contentTemplates.userId, userId))
      .orderBy(desc(contentTemplates.updatedAt));
  }

  async getContentTemplate(id: string, userId: string): Promise<ContentTemplate | undefined> {
    const [template] = await db.select()
      .from(contentTemplates)
      .where(and(eq(contentTemplates.id, id), eq(contentTemplates.userId, userId)));
    return template;
  }

  async getContentTemplateById(id: string): Promise<ContentTemplate | undefined> {
    const [template] = await db.select()
      .from(contentTemplates)
      .where(eq(contentTemplates.id, id));
    return template;
  }

  async createContentTemplate(template: InsertContentTemplate): Promise<ContentTemplate> {
    const [newTemplate] = await db.insert(contentTemplates).values(template).returning();
    return newTemplate;
  }

  async updateContentTemplate(id: string, userId: string, updates: Partial<InsertContentTemplate>): Promise<ContentTemplate | undefined> {
    const [updated] = await db.update(contentTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(contentTemplates.id, id), eq(contentTemplates.userId, userId)))
      .returning();
    return updated;
  }

  async deleteContentTemplate(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(contentTemplates)
      .where(and(eq(contentTemplates.id, id), eq(contentTemplates.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Data source operations
  async getDataSources(userId: string): Promise<DataSource[]> {
    return await db.select()
      .from(dataSources)
      .where(eq(dataSources.userId, userId))
      .orderBy(desc(dataSources.updatedAt));
  }

  async getDataSource(id: string, userId: string): Promise<DataSource | undefined> {
    const [dataSource] = await db.select()
      .from(dataSources)
      .where(and(eq(dataSources.id, id), eq(dataSources.userId, userId)));
    return dataSource;
  }

  async createDataSource(dataSource: InsertDataSource): Promise<DataSource> {
    const [newDataSource] = await db.insert(dataSources).values(dataSource).returning();
    return newDataSource;
  }

  async updateDataSource(id: string, userId: string, updates: Partial<InsertDataSource>): Promise<DataSource | undefined> {
    const [updated] = await db.update(dataSources)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(dataSources.id, id), eq(dataSources.userId, userId)))
      .returning();
    return updated;
  }

  async deleteDataSource(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(dataSources)
      .where(and(eq(dataSources.id, id), eq(dataSources.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateDataSourceFetchStatus(id: string, lastFetch?: Date, lastError?: string): Promise<void> {
    const updates: any = {
      lastFetch: lastFetch || new Date(),
      fetchCount: sql`${dataSources.fetchCount} + 1`,
    };
    
    if (lastError) {
      updates.lastError = lastError;
      updates.errorCount = sql`${dataSources.errorCount} + 1`;
    } else {
      updates.lastError = null;
    }

    await db.update(dataSources)
      .set(updates)
      .where(eq(dataSources.id, id));
  }

  // Output channel operations
  async getOutputChannels(userId: string): Promise<OutputChannel[]> {
    return await db.select()
      .from(outputChannels)
      .where(eq(outputChannels.userId, userId))
      .orderBy(desc(outputChannels.updatedAt));
  }

  async getOutputChannel(id: string, userId: string): Promise<OutputChannel | undefined> {
    const [channel] = await db.select()
      .from(outputChannels)
      .where(and(eq(outputChannels.id, id), eq(outputChannels.userId, userId)));
    return channel;
  }

  async createOutputChannel(channel: InsertOutputChannel): Promise<OutputChannel> {
    const [newChannel] = await db.insert(outputChannels).values(channel).returning();
    return newChannel;
  }

  async updateOutputChannel(id: string, userId: string, updates: Partial<InsertOutputChannel>): Promise<OutputChannel | undefined> {
    const [updated] = await db.update(outputChannels)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(outputChannels.id, id), eq(outputChannels.userId, userId)))
      .returning();
    return updated;
  }

  async deleteOutputChannel(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(outputChannels)
      .where(and(eq(outputChannels.id, id), eq(outputChannels.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateOutputChannelUsage(id: string, success: boolean): Promise<void> {
    const updates: any = {
      lastUsed: new Date(),
      totalDeliveries: sql`${outputChannels.totalDeliveries} + 1`,
    };
    
    if (!success) {
      updates.failureCount = sql`${outputChannels.failureCount} + 1`;
    }

    await db.update(outputChannels)
      .set(updates)
      .where(eq(outputChannels.id, id));
  }

  // Distribution rule operations
  async getDistributionRules(userId: string): Promise<DistributionRule[]> {
    return await db.select()
      .from(distributionRules)
      .where(eq(distributionRules.userId, userId))
      .orderBy(desc(distributionRules.priority), desc(distributionRules.updatedAt));
  }

  async getDistributionRule(id: string, userId: string): Promise<DistributionRule | undefined> {
    const [rule] = await db.select()
      .from(distributionRules)
      .where(and(eq(distributionRules.id, id), eq(distributionRules.userId, userId)));
    return rule;
  }

  async createDistributionRule(rule: InsertDistributionRule): Promise<DistributionRule> {
    const [newRule] = await db.insert(distributionRules).values(rule).returning();
    return newRule;
  }

  async updateDistributionRule(id: string, userId: string, updates: Partial<InsertDistributionRule>): Promise<DistributionRule | undefined> {
    const [updated] = await db.update(distributionRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(distributionRules.id, id), eq(distributionRules.userId, userId)))
      .returning();
    return updated;
  }

  async deleteDistributionRule(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(distributionRules)
      .where(and(eq(distributionRules.id, id), eq(distributionRules.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Scheduled job operations
  async getScheduledJobs(userId: string): Promise<ScheduledJob[]> {
    return await db.select()
      .from(scheduledJobs)
      .where(eq(scheduledJobs.userId, userId))
      .orderBy(desc(scheduledJobs.updatedAt));
  }

  async getScheduledJob(id: string, userId: string): Promise<ScheduledJob | undefined> {
    const [job] = await db.select()
      .from(scheduledJobs)
      .where(and(eq(scheduledJobs.id, id), eq(scheduledJobs.userId, userId)));
    return job;
  }

  async createScheduledJob(job: InsertScheduledJob): Promise<ScheduledJob> {
    const [newJob] = await db.insert(scheduledJobs).values(job).returning();
    return newJob;
  }

  async updateScheduledJob(id: string, userId: string, updates: Partial<InsertScheduledJob>): Promise<ScheduledJob | undefined> {
    const [updated] = await db.update(scheduledJobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(scheduledJobs.id, id), eq(scheduledJobs.userId, userId)))
      .returning();
    return updated;
  }

  async deleteScheduledJob(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(scheduledJobs)
      .where(and(eq(scheduledJobs.id, id), eq(scheduledJobs.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateScheduledJobStatus(id: string, status: string, error?: string): Promise<void> {
    const updates: any = {
      lastStatus: status,
      lastRun: new Date(),
      totalRuns: sql`${scheduledJobs.totalRuns} + 1`,
    };
    
    if (status === 'success') {
      updates.successCount = sql`${scheduledJobs.successCount} + 1`;
      updates.lastError = null;
    } else if (status === 'error') {
      updates.errorCount = sql`${scheduledJobs.errorCount} + 1`;
      updates.lastError = error || 'Unknown error';
    }

    await db.update(scheduledJobs)
      .set(updates)
      .where(eq(scheduledJobs.id, id));
  }

  async updateScheduledJobRunHistory(id: string, success: boolean, nextRun?: Date): Promise<void> {
    const updates: any = {
      lastRun: new Date(),
      totalRuns: sql`${scheduledJobs.totalRuns} + 1`,
    };
    
    if (success) {
      updates.successCount = sql`${scheduledJobs.successCount} + 1`;
      updates.lastStatus = 'success';
      updates.lastError = null;
    } else {
      updates.errorCount = sql`${scheduledJobs.errorCount} + 1`;
      updates.lastStatus = 'error';
    }
    
    if (nextRun) {
      updates.nextRun = nextRun;
    }

    await db.update(scheduledJobs)
      .set(updates)
      .where(eq(scheduledJobs.id, id));
  }

  async getScheduledJobById(id: string): Promise<ScheduledJob | undefined> {
    const [job] = await db.select()
      .from(scheduledJobs)
      .where(eq(scheduledJobs.id, id));
    return job;
  }

  async getActiveScheduledJobs(): Promise<ScheduledJob[]> {
    return await db.select()
      .from(scheduledJobs)
      .where(eq(scheduledJobs.isActive, true))
      .orderBy(desc(scheduledJobs.nextRun));
  }

  async updateScheduledJobNextRun(id: string, nextRun: Date): Promise<void> {
    await db.update(scheduledJobs)
      .set({ nextRun })
      .where(eq(scheduledJobs.id, id));
  }

  async updateScheduledJobLastRun(id: string, lastRun: Date): Promise<void> {
    await db.update(scheduledJobs)
      .set({ lastRun, totalRuns: sql`${scheduledJobs.totalRuns} + 1` })
      .where(eq(scheduledJobs.id, id));
  }

  async incrementScheduledJobSuccessCount(id: string): Promise<void> {
    await db.update(scheduledJobs)
      .set({ 
        successCount: sql`${scheduledJobs.successCount} + 1`,
        lastStatus: 'success'
      })
      .where(eq(scheduledJobs.id, id));
  }

  async incrementScheduledJobErrorCount(id: string): Promise<void> {
    await db.update(scheduledJobs)
      .set({ 
        errorCount: sql`${scheduledJobs.errorCount} + 1`,
        lastStatus: 'error'
      })
      .where(eq(scheduledJobs.id, id));
  }

  // Generated content operations
  async getGeneratedContent(userId: string, limit = 50): Promise<GeneratedContent[]> {
    return await db.select()
      .from(generatedContent)
      .where(eq(generatedContent.userId, userId))
      .orderBy(desc(generatedContent.generatedAt))
      .limit(limit);
  }

  async getGeneratedContentByTemplate(templateId: string, userId: string, limit = 50): Promise<GeneratedContent[]> {
    return await db.select()
      .from(generatedContent)
      .where(and(
        eq(generatedContent.templateId, templateId),
        eq(generatedContent.userId, userId)
      ))
      .orderBy(desc(generatedContent.generatedAt))
      .limit(limit);
  }

  async createGeneratedContent(content: InsertGeneratedContent): Promise<GeneratedContent> {
    const [newContent] = await db.insert(generatedContent).values(content).returning();
    return newContent;
  }

  // Template relationship operations
  async getTemplateDataSources(templateId: string): Promise<TemplateDataSource[]> {
    return await db.select()
      .from(templateDataSources)
      .where(eq(templateDataSources.templateId, templateId))
      .orderBy(templateDataSources.createdAt);
  }

  async createTemplateDataSource(relation: InsertTemplateDataSource): Promise<TemplateDataSource> {
    const [newRelation] = await db.insert(templateDataSources).values(relation).returning();
    return newRelation;
  }

  async deleteTemplateDataSource(templateId: string, dataSourceId: string): Promise<boolean> {
    const result = await db.delete(templateDataSources)
      .where(and(
        eq(templateDataSources.templateId, templateId),
        eq(templateDataSources.dataSourceId, dataSourceId)
      ));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getTemplateOutputChannels(templateId: string): Promise<TemplateOutputChannel[]> {
    return await db.select()
      .from(templateOutputChannels)
      .where(eq(templateOutputChannels.templateId, templateId))
      .orderBy(templateOutputChannels.createdAt);
  }

  async createTemplateOutputChannel(relation: InsertTemplateOutputChannel): Promise<TemplateOutputChannel> {
    const [newRelation] = await db.insert(templateOutputChannels).values(relation).returning();
    return newRelation;
  }

  async deleteTemplateOutputChannel(templateId: string, channelId: string): Promise<boolean> {
    const result = await db.delete(templateOutputChannels)
      .where(and(
        eq(templateOutputChannels.templateId, templateId),
        eq(templateOutputChannels.channelId, channelId)
      ));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ===============================================
  // BYOK CREDENTIALS (with encryption)
  // ===============================================

  // AI Credentials operations
  async getAiCredentials(userId: string): Promise<AiCredential[]> {
    const credentials = await db.select()
      .from(aiCredentials)
      .where(eq(aiCredentials.userId, userId))
      .orderBy(desc(aiCredentials.createdAt));
    
    // Decrypt API keys before returning
    return credentials.map(cred => ({
      ...cred,
      apiKey: encryptionService.decrypt(cred.apiKey),
    }));
  }

  async getAiCredential(id: string, userId: string): Promise<AiCredential | undefined> {
    const [credential] = await db.select()
      .from(aiCredentials)
      .where(and(eq(aiCredentials.id, id), eq(aiCredentials.userId, userId)));
    
    if (!credential) return undefined;
    
    // Decrypt API key before returning
    return {
      ...credential,
      apiKey: encryptionService.decrypt(credential.apiKey),
    };
  }

  async getDefaultAiCredential(userId: string, provider?: string): Promise<AiCredential | undefined> {
    const query = db.select()
      .from(aiCredentials)
      .where(and(
        eq(aiCredentials.userId, userId),
        eq(aiCredentials.isActive, true),
        eq(aiCredentials.isDefault, true),
        provider ? eq(aiCredentials.provider, provider) : sql`true`
      ))
      .limit(1);
    
    const [credential] = await query;
    
    if (!credential) return undefined;
    
    // Decrypt API key before returning
    return {
      ...credential,
      apiKey: encryptionService.decrypt(credential.apiKey),
    };
  }

  async createAiCredential(credential: InsertAiCredential): Promise<AiCredential> {
    // Encrypt API key before storing
    const encryptedCredential = {
      ...credential,
      apiKey: encryptionService.encrypt(credential.apiKey),
    };
    
    const [newCredential] = await db.insert(aiCredentials)
      .values(encryptedCredential)
      .returning();
    
    // Return decrypted version to caller
    return {
      ...newCredential,
      apiKey: encryptionService.decrypt(newCredential.apiKey),
    };
  }

  async updateAiCredential(id: string, userId: string, updates: Partial<InsertAiCredential>): Promise<AiCredential | undefined> {
    // Encrypt API key if it's being updated
    const encryptedUpdates = {
      ...updates,
      ...(updates.apiKey && { apiKey: encryptionService.encrypt(updates.apiKey) }),
      updatedAt: new Date(),
    };
    
    const [updated] = await db.update(aiCredentials)
      .set(encryptedUpdates)
      .where(and(eq(aiCredentials.id, id), eq(aiCredentials.userId, userId)))
      .returning();
    
    if (!updated) return undefined;
    
    // Return decrypted version
    return {
      ...updated,
      apiKey: encryptionService.decrypt(updated.apiKey),
    };
  }

  async deleteAiCredential(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(aiCredentials)
      .where(and(eq(aiCredentials.id, id), eq(aiCredentials.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Email Service Credentials operations
  async getEmailServiceCredentials(userId: string): Promise<EmailServiceCredential[]> {
    const credentials = await db.select()
      .from(emailServiceCredentials)
      .where(eq(emailServiceCredentials.userId, userId))
      .orderBy(desc(emailServiceCredentials.createdAt));
    
    // Decrypt sensitive fields before returning
    return credentials.map(cred => ({
      ...cred,
      apiKey: cred.apiKey ? encryptionService.decrypt(cred.apiKey) : null,
      awsSecretAccessKey: cred.awsSecretAccessKey ? encryptionService.decrypt(cred.awsSecretAccessKey) : null,
    }));
  }

  async getEmailServiceCredential(id: string, userId: string): Promise<EmailServiceCredential | undefined> {
    const [credential] = await db.select()
      .from(emailServiceCredentials)
      .where(and(eq(emailServiceCredentials.id, id), eq(emailServiceCredentials.userId, userId)));
    
    if (!credential) return undefined;
    
    // Decrypt sensitive fields before returning
    return {
      ...credential,
      apiKey: credential.apiKey ? encryptionService.decrypt(credential.apiKey) : null,
      awsSecretAccessKey: credential.awsSecretAccessKey ? encryptionService.decrypt(credential.awsSecretAccessKey) : null,
    };
  }

  async getDefaultEmailServiceCredential(userId: string): Promise<EmailServiceCredential | undefined> {
    const [credential] = await db.select()
      .from(emailServiceCredentials)
      .where(and(
        eq(emailServiceCredentials.userId, userId),
        eq(emailServiceCredentials.isActive, true),
        eq(emailServiceCredentials.isDefault, true)
      ))
      .limit(1);
    
    if (!credential) return undefined;
    
    // Decrypt sensitive fields before returning
    return {
      ...credential,
      apiKey: credential.apiKey ? encryptionService.decrypt(credential.apiKey) : null,
      awsSecretAccessKey: credential.awsSecretAccessKey ? encryptionService.decrypt(credential.awsSecretAccessKey) : null,
    };
  }

  async createEmailServiceCredential(credential: InsertEmailServiceCredential): Promise<EmailServiceCredential> {
    // Encrypt sensitive fields before storing
    const encryptedCredential = {
      ...credential,
      apiKey: credential.apiKey ? encryptionService.encrypt(credential.apiKey) : null,
      awsSecretAccessKey: credential.awsSecretAccessKey ? encryptionService.encrypt(credential.awsSecretAccessKey) : null,
    };
    
    const [newCredential] = await db.insert(emailServiceCredentials)
      .values(encryptedCredential)
      .returning();
    
    // Return decrypted version to caller
    return {
      ...newCredential,
      apiKey: newCredential.apiKey ? encryptionService.decrypt(newCredential.apiKey) : null,
      awsSecretAccessKey: newCredential.awsSecretAccessKey ? encryptionService.decrypt(newCredential.awsSecretAccessKey) : null,
    };
  }

  async updateEmailServiceCredential(id: string, userId: string, updates: Partial<InsertEmailServiceCredential>): Promise<EmailServiceCredential | undefined> {
    // Encrypt sensitive fields if they're being updated
    const encryptedUpdates = {
      ...updates,
      ...(updates.apiKey && { apiKey: encryptionService.encrypt(updates.apiKey) }),
      ...(updates.awsSecretAccessKey && { awsSecretAccessKey: encryptionService.encrypt(updates.awsSecretAccessKey) }),
      updatedAt: new Date(),
    };
    
    const [updated] = await db.update(emailServiceCredentials)
      .set(encryptedUpdates)
      .where(and(eq(emailServiceCredentials.id, id), eq(emailServiceCredentials.userId, userId)))
      .returning();
    
    if (!updated) return undefined;
    
    // Return decrypted version
    return {
      ...updated,
      apiKey: updated.apiKey ? encryptionService.decrypt(updated.apiKey) : null,
      awsSecretAccessKey: updated.awsSecretAccessKey ? encryptionService.decrypt(updated.awsSecretAccessKey) : null,
    };
  }

  async deleteEmailServiceCredential(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(emailServiceCredentials)
      .where(and(eq(emailServiceCredentials.id, id), eq(emailServiceCredentials.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // =============================================================================
  // MONETIZATION OPERATIONS (Tree Fiddy! 🦕)
  // =============================================================================

  // License operations
  async createLicense(license: InsertLicense): Promise<License> {
    const [newLicense] = await db.insert(licenses)
      .values(license)
      .returning();
    return newLicense;
  }

  async getLicenseByKey(licenseKey: string): Promise<License | undefined> {
    const [license] = await db.select()
      .from(licenses)
      .where(eq(licenses.licenseKey, licenseKey));
    return license;
  }

  async getActiveLicense(userId: string): Promise<License | undefined> {
    const [license] = await db.select()
      .from(licenses)
      .where(and(
        eq(licenses.userId, userId),
        eq(licenses.status, 'active')
      ))
      .orderBy(desc(licenses.activatedAt))
      .limit(1);
    return license;
  }

  async activateLicense(licenseKey: string, deviceFingerprint: string): Promise<void> {
    await db.update(licenses)
      .set({
        deviceFingerprint,
        activatedAt: new Date(),
        status: 'active',
        lastValidated: new Date(),
      })
      .where(eq(licenses.licenseKey, licenseKey));
  }

  async deactivateLicense(licenseKey: string): Promise<void> {
    await db.update(licenses)
      .set({
        deviceFingerprint: null,
        deactivatedAt: new Date(),
        status: 'inactive',
      })
      .where(eq(licenses.licenseKey, licenseKey));
  }

  async getUserLicenses(userId: string): Promise<License[]> {
    return await db.select()
      .from(licenses)
      .where(eq(licenses.userId, userId))
      .orderBy(desc(licenses.createdAt));
  }

  async updateLicenseLastValidated(id: string): Promise<void> {
    await db.update(licenses)
      .set({ lastValidated: new Date() })
      .where(eq(licenses.id, id));
  }

  async getLicenseStats(): Promise<{ total: number; active: number; inactive: number; deactivated: number }> {
    const result = await db.select({
      total: count(),
      active: sql<number>`count(*) filter (where status = 'active')`,
      inactive: sql<number>`count(*) filter (where status = 'inactive')`,
      deactivated: sql<number>`count(*) filter (where status = 'deactivated')`,
    }).from(licenses);
    
    return result[0] || { total: 0, active: 0, inactive: 0, deactivated: 0 };
  }

  // Stripe customer operations
  async createStripeCustomer(customer: InsertStripeCustomer): Promise<StripeCustomer> {
    const [newCustomer] = await db.insert(stripeCustomers)
      .values(customer)
      .returning();
    return newCustomer;
  }

  async getStripeCustomer(userId: string): Promise<StripeCustomer | undefined> {
    const [customer] = await db.select()
      .from(stripeCustomers)
      .where(eq(stripeCustomers.userId, userId));
    return customer;
  }

  async getStripeCustomerByStripeId(stripeCustomerId: string): Promise<StripeCustomer | undefined> {
    const [customer] = await db.select()
      .from(stripeCustomers)
      .where(eq(stripeCustomers.stripeCustomerId, stripeCustomerId));
    return customer;
  }

  // Subscription operations
  async upsertSubscription(subscription: InsertSubscription): Promise<Subscription> {
    // Check if subscription exists
    const existing = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscription.stripeSubscriptionId || ''))
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      const [updated] = await db.update(subscriptions)
        .set({
          ...subscription,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, existing[0].id))
        .returning();
      return updated;
    } else {
      // Create new
      const [newSubscription] = await db.insert(subscriptions)
        .values(subscription)
        .returning();
      return newSubscription;
    }
  }

  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active')
      ))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return subscription;
  }

  async updateSubscriptionStatus(stripeSubscriptionId: string, status: string): Promise<void> {
    await db.update(subscriptions)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
  }

  async updateSubscriptionCancelAtPeriodEnd(id: string, cancelAtPeriodEnd: boolean): Promise<void> {
    await db.update(subscriptions)
      .set({
        cancelAtPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id));
  }

  // Managed instance operations
  async createManagedInstance(instance: InsertManagedInstance): Promise<ManagedInstance> {
    const [newInstance] = await db.insert(managedInstances)
      .values(instance)
      .returning();
    return newInstance;
  }

  async getManagedInstances(userId: string): Promise<ManagedInstance[]> {
    return await db.select()
      .from(managedInstances)
      .where(and(
        eq(managedInstances.userId, userId),
        sql`${managedInstances.destroyedAt} IS NULL`
      ))
      .orderBy(desc(managedInstances.createdAt));
  }

  async getManagedInstance(id: string, userId: string): Promise<ManagedInstance | undefined> {
    const [instance] = await db.select()
      .from(managedInstances)
      .where(and(
        eq(managedInstances.id, id),
        eq(managedInstances.userId, userId)
      ));
    return instance;
  }

  async updateManagedInstanceStatus(id: string, status: string, healthStatus?: any): Promise<void> {
    await db.update(managedInstances)
      .set({
        status,
        lastHealthCheck: new Date(),
        ...(healthStatus && { healthStatus }),
      })
      .where(eq(managedInstances.id, id));
  }

  async deleteManagedInstance(id: string, userId: string): Promise<boolean> {
    // Soft delete by setting destroyedAt
    const result = await db.update(managedInstances)
      .set({
        status: 'destroyed',
        destroyedAt: new Date(),
      })
      .where(and(
        eq(managedInstances.id, id),
        eq(managedInstances.userId, userId)
      ));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getUserPayments(userId: string, limit: number = 50): Promise<Payment[]> {
    return await db.select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
