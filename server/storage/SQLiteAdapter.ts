import Database from 'better-sqlite3';
import * as path from 'path';
import { IStorage, User, AICredential, EmailServiceCredential, PhoneServiceCredential, ContentTemplate, GeneratedContent } from './IStorage';

/**
 * SQLite Adapter - Serverless Baseline Storage
 * 
 * Following ARCHITECTURE.md:
 * - This is a CILIUM (database implementation)
 * - Pluggable, swappable via .env
 * - Self-contained (creates own tables)
 * 
 * Features:
 * - Zero configuration (file-based)
 * - Built-in to Node.js ecosystem
 * - Perfect for development, testing, single-user
 * - Serverless (no DB server needed!)
 * - Fast (in-process)
 * 
 * Use cases:
 * - Development/testing
 * - Single-user deployments
 * - Edge deployments
 * - Embedded use cases
 */

export class SQLiteAdapter implements IStorage {
  
  private db!: Database.Database;
  private dbPath: string;
  
  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'amoeba.db');
  }
  
  /**
   * Initialize SQLite database and create tables
   */
  async initialize(): Promise<void> {
    this.db = new Database(this.dbPath);
    
    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');
    
    // Create tables
    this.createTables();
    
    console.log(`✅ SQLite storage initialized: ${this.dbPath}`);
  }
  
  /**
   * Create all tables if they don't exist
   */
  private createTables(): void {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        first_name TEXT,
        last_name TEXT,
        profile_image_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // AI Credentials
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_credentials (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        name TEXT NOT NULL,
        api_key TEXT NOT NULL,
        additional_config TEXT,
        is_default INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        last_used TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_ai_creds_user ON ai_credentials(user_id);
    `);
    
    // Email Service Credentials
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS email_service_credentials (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        name TEXT NOT NULL,
        api_key TEXT,
        from_email TEXT NOT NULL,
        from_name TEXT,
        aws_access_key_id TEXT,
        aws_secret_access_key TEXT,
        aws_region TEXT,
        is_default INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        last_used TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_email_creds_user ON email_service_credentials(user_id);
    `);
    
    // Phone Service Credentials (NEW)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS phone_service_credentials (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        name TEXT NOT NULL,
        account_sid TEXT,
        api_key TEXT,
        phone_number TEXT,
        aws_access_key_id TEXT,
        aws_secret_access_key TEXT,
        aws_region TEXT,
        config TEXT,
        is_default INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        last_used TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_phone_creds_user ON phone_service_credentials(user_id);
    `);
    
    // Content Templates
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS content_templates (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        ai_prompt TEXT NOT NULL,
        system_prompt TEXT,
        variables TEXT,
        settings TEXT,
        output_format TEXT DEFAULT 'text',
        is_active INTEGER DEFAULT 1,
        last_used TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_templates_user ON content_templates(user_id);
    `);
    
    // Generated Content
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS generated_content (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        template_id TEXT REFERENCES content_templates(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        title TEXT,
        metadata TEXT,
        job_id TEXT,
        distribution_status TEXT,
        generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        review_status TEXT,
        review_metadata TEXT,
        reviewed_at TEXT,
        reviewed_by TEXT,
        review_notes TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_content_user ON generated_content(user_id);
      CREATE INDEX IF NOT EXISTS idx_content_review ON generated_content(review_status);
    `);
    
    console.log('✅ SQLite tables created/verified');
  }
  
  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      const result = this.db.prepare('SELECT 1 as test').get();
      return { healthy: !!result, message: 'SQLite healthy' };
    } catch (error: any) {
      return { healthy: false, message: error.message };
    }
  }
  
  /**
   * Close connection
   */
  async close(): Promise<void> {
    this.db.close();
  }
  
  // ===========================================================================
  // USER METHODS
  // ===========================================================================
  
  async getUser(userId: string): Promise<User | null> {
    const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    return user ? this.mapUser(user) : null;
  }
  
  async getUserByEmail(email: string): Promise<User | null> {
    const user = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    return user ? this.mapUser(user) : null;
  }
  
  async getUserByPhoneNumber(phoneNumber: string): Promise<User[]> {
    // For SQLite, we'd need to store phone in users table or join
    // For now, return empty (can enhance later)
    return [];
  }
  
  async createUser(data: Partial<User>): Promise<User> {
    const id = data.id || this.generateId();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO users (id, email, first_name, last_name, profile_image_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.email, data.firstName, data.lastName, data.profileImageUrl, now, now);
    
    return (await this.getUser(id))!;
  }
  
  // ===========================================================================
  // PHONE SERVICE CREDENTIALS (NEW - IMPLEMENTS MISSING METHODS)
  // ===========================================================================
  
  async getPhoneServiceCredentials(userId: string): Promise<PhoneServiceCredential[]> {
    const rows = this.db.prepare('SELECT * FROM phone_service_credentials WHERE user_id = ?').all(userId) as any[];
    return rows.map(r => this.mapPhoneCredential(r));
  }
  
  async getPhoneServiceCredential(id: string, userId: string): Promise<PhoneServiceCredential | null> {
    const row = this.db.prepare('SELECT * FROM phone_service_credentials WHERE id = ? AND user_id = ?').get(id, userId) as any;
    return row ? this.mapPhoneCredential(row) : null;
  }
  
  async getDefaultPhoneServiceCredential(userId: string): Promise<PhoneServiceCredential | null> {
    const row = this.db.prepare('SELECT * FROM phone_service_credentials WHERE user_id = ? AND is_default = 1 LIMIT 1').get(userId) as any;
    return row ? this.mapPhoneCredential(row) : null;
  }
  
  async createPhoneServiceCredential(data: Partial<PhoneServiceCredential>): Promise<PhoneServiceCredential> {
    const id = data.id || this.generateId();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO phone_service_credentials 
      (id, user_id, provider, name, account_sid, api_key, phone_number, aws_access_key_id, aws_secret_access_key, aws_region, config, is_default, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.userId,
      data.provider,
      data.name,
      data.accountSid,
      data.apiKey,
      data.phoneNumber,
      data.awsAccessKeyId,
      data.awsSecretAccessKey,
      data.awsRegion,
      JSON.stringify(data.config || {}),
      data.isDefault ? 1 : 0,
      data.isActive !== false ? 1 : 0,
      now,
      now
    );
    
    return (await this.getPhoneServiceCredential(id, data.userId!))!;
  }
  
  async updatePhoneServiceCredential(id: string, userId: string, data: Partial<PhoneServiceCredential>): Promise<PhoneServiceCredential | null> {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.accountSid !== undefined) { updates.push('account_sid = ?'); values.push(data.accountSid); }
    if (data.apiKey !== undefined) { updates.push('api_key = ?'); values.push(data.apiKey); }
    if (data.phoneNumber !== undefined) { updates.push('phone_number = ?'); values.push(data.phoneNumber); }
    if (data.config !== undefined) { updates.push('config = ?'); values.push(JSON.stringify(data.config)); }
    if (data.isDefault !== undefined) { updates.push('is_default = ?'); values.push(data.isDefault ? 1 : 0); }
    if (data.isActive !== undefined) { updates.push('is_active = ?'); values.push(data.isActive ? 1 : 0); }
    
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    
    values.push(id, userId);
    
    this.db.prepare(`
      UPDATE phone_service_credentials 
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).run(...values);
    
    return await this.getPhoneServiceCredential(id, userId);
  }
  
  async deletePhoneServiceCredential(id: string, userId: string): Promise<void> {
    this.db.prepare('DELETE FROM phone_service_credentials WHERE id = ? AND user_id = ?').run(id, userId);
  }
  
  // ===========================================================================
  // CONTENT TEMPLATES
  // ===========================================================================
  
  async getContentTemplates(userId: string): Promise<ContentTemplate[]> {
    const rows = this.db.prepare('SELECT * FROM content_templates WHERE user_id = ?').all(userId) as any[];
    return rows.map(r => this.mapTemplate(r));
  }
  
  async getContentTemplate(id: string, userId: string): Promise<ContentTemplate | null> {
    const row = this.db.prepare('SELECT * FROM content_templates WHERE id = ? AND user_id = ?').get(id, userId) as any;
    return row ? this.mapTemplate(row) : null;
  }
  
  async createContentTemplate(data: Partial<ContentTemplate>): Promise<ContentTemplate> {
    const id = data.id || this.generateId();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO content_templates 
      (id, user_id, name, description, ai_prompt, system_prompt, variables, settings, output_format, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.userId,
      data.name,
      data.description,
      data.aiPrompt,
      data.systemPrompt,
      JSON.stringify(data.variables || []),
      JSON.stringify(data.settings || {}),
      data.outputFormat || 'text',
      data.isActive !== false ? 1 : 0,
      now,
      now
    );
    
    return (await this.getContentTemplate(id, data.userId!))!;
  }
  
  async updateContentTemplate(id: string, userId: string, data: Partial<ContentTemplate>): Promise<ContentTemplate | null> {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.aiPrompt !== undefined) { updates.push('ai_prompt = ?'); values.push(data.aiPrompt); }
    if (data.systemPrompt !== undefined) { updates.push('system_prompt = ?'); values.push(data.systemPrompt); }
    if (data.variables !== undefined) { updates.push('variables = ?'); values.push(JSON.stringify(data.variables)); }
    if (data.settings !== undefined) { updates.push('settings = ?'); values.push(JSON.stringify(data.settings)); }
    if (data.outputFormat !== undefined) { updates.push('output_format = ?'); values.push(data.outputFormat); }
    if (data.isActive !== undefined) { updates.push('is_active = ?'); values.push(data.isActive ? 1 : 0); }
    
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    
    values.push(id, userId);
    
    this.db.prepare(`
      UPDATE content_templates 
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).run(...values);
    
    return await this.getContentTemplate(id, userId);
  }
  
  async deleteContentTemplate(id: string, userId: string): Promise<void> {
    this.db.prepare('DELETE FROM content_templates WHERE id = ? AND user_id = ?').run(id, userId);
  }
  
  // ===========================================================================
  // GENERATED CONTENT
  // ===========================================================================
  
  async getGeneratedContent(userId: string, options?: any): Promise<GeneratedContent[]> {
    const rows = this.db.prepare('SELECT * FROM generated_content WHERE user_id = ? ORDER BY generated_at DESC LIMIT 100').all(userId) as any[];
    return rows.map(r => this.mapGeneratedContent(r));
  }
  
  async getGeneratedContentById(id: string, userId: string): Promise<GeneratedContent | null> {
    const row = this.db.prepare('SELECT * FROM generated_content WHERE id = ? AND user_id = ?').get(id, userId) as any;
    return row ? this.mapGeneratedContent(row) : null;
  }
  
  async createGeneratedContent(data: Partial<GeneratedContent>): Promise<GeneratedContent> {
    const id = data.id || this.generateId();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO generated_content 
      (id, user_id, template_id, content, title, metadata, job_id, distribution_status, generated_at, review_status, review_metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.userId,
      data.templateId,
      data.content,
      data.title,
      JSON.stringify(data.metadata || {}),
      data.jobId,
      JSON.stringify(data.distributionStatus || {}),
      now,
      data.reviewStatus || 'approved',
      JSON.stringify(data.reviewMetadata || {})
    );
    
    return (await this.getGeneratedContentById(id, data.userId!))!;
  }
  
  async updateGeneratedContent(id: string, userId: string, data: Partial<GeneratedContent>): Promise<GeneratedContent | null> {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.content !== undefined) { updates.push('content = ?'); values.push(data.content); }
    if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
    if (data.metadata !== undefined) { updates.push('metadata = ?'); values.push(JSON.stringify(data.metadata)); }
    if (data.reviewStatus !== undefined) { updates.push('review_status = ?'); values.push(data.reviewStatus); }
    if (data.reviewMetadata !== undefined) { updates.push('review_metadata = ?'); values.push(JSON.stringify(data.reviewMetadata)); }
    if (data.reviewedAt !== undefined) { updates.push('reviewed_at = ?'); values.push(data.reviewedAt?.toISOString()); }
    if (data.reviewedBy !== undefined) { updates.push('reviewed_by = ?'); values.push(data.reviewedBy); }
    if (data.reviewNotes !== undefined) { updates.push('review_notes = ?'); values.push(data.reviewNotes); }
    
    if (updates.length === 0) return await this.getGeneratedContentById(id, userId);
    
    values.push(id, userId);
    
    this.db.prepare(`
      UPDATE generated_content 
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).run(...values);
    
    return await this.getGeneratedContentById(id, userId);
  }
  
  async deleteGeneratedContent(id: string, userId: string): Promise<void> {
    this.db.prepare('DELETE FROM generated_content WHERE id = ? AND user_id = ?').run(id, userId);
  }
  
  // ===========================================================================
  // AI CREDENTIALS - Implement remaining methods
  // ===========================================================================
  
  async getAiCredentials(userId: string): Promise<AICredential[]> {
    const rows = this.db.prepare('SELECT * FROM ai_credentials WHERE user_id = ?').all(userId) as any[];
    return rows.map(r => this.mapAICredential(r));
  }
  
  async getAiCredential(id: string, userId: string): Promise<AICredential | null> {
    const row = this.db.prepare('SELECT * FROM ai_credentials WHERE id = ? AND user_id = ?').get(id, userId) as any;
    return row ? this.mapAICredential(row) : null;
  }
  
  async getDefaultAiCredential(userId: string): Promise<AICredential | null> {
    const row = this.db.prepare('SELECT * FROM ai_credentials WHERE user_id = ? AND is_default = 1 LIMIT 1').get(userId) as any;
    return row ? this.mapAICredential(row) : null;
  }
  
  async createAiCredential(data: Partial<AICredential>): Promise<AICredential> {
    const id = data.id || this.generateId();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO ai_credentials 
      (id, user_id, provider, name, api_key, additional_config, is_default, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.userId,
      data.provider,
      data.name,
      data.apiKey,
      JSON.stringify(data.additionalConfig || {}),
      data.isDefault ? 1 : 0,
      data.isActive !== false ? 1 : 0,
      now,
      now
    );
    
    return (await this.getAiCredential(id, data.userId!))!;
  }
  
  async updateAiCredential(id: string, userId: string, data: Partial<AICredential>): Promise<AICredential | null> {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.apiKey !== undefined) { updates.push('api_key = ?'); values.push(data.apiKey); }
    if (data.isDefault !== undefined) { updates.push('is_default = ?'); values.push(data.isDefault ? 1 : 0); }
    if (data.isActive !== undefined) { updates.push('is_active = ?'); values.push(data.isActive ? 1 : 0); }
    
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id, userId);
    
    this.db.prepare(`
      UPDATE ai_credentials 
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).run(...values);
    
    return await this.getAiCredential(id, userId);
  }
  
  async deleteAiCredential(id: string, userId: string): Promise<void> {
    this.db.prepare('DELETE FROM ai_credentials WHERE id = ? AND user_id = ?').run(id, userId);
  }
  
  // ===========================================================================
  // EMAIL SERVICE CREDENTIALS
  // ===========================================================================
  
  async getEmailServiceCredentials(userId: string): Promise<EmailServiceCredential[]> {
    const rows = this.db.prepare('SELECT * FROM email_service_credentials WHERE user_id = ?').all(userId) as any[];
    return rows.map(r => this.mapEmailCredential(r));
  }
  
  async getEmailServiceCredential(id: string, userId: string): Promise<EmailServiceCredential | null> {
    const row = this.db.prepare('SELECT * FROM email_service_credentials WHERE id = ? AND user_id = ?').get(id, userId) as any;
    return row ? this.mapEmailCredential(row) : null;
  }
  
  async getDefaultEmailServiceCredential(userId: string): Promise<EmailServiceCredential | null> {
    const row = this.db.prepare('SELECT * FROM email_service_credentials WHERE user_id = ? AND is_default = 1 LIMIT 1').get(userId) as any;
    return row ? this.mapEmailCredential(row) : null;
  }
  
  async createEmailServiceCredential(data: Partial<EmailServiceCredential>): Promise<EmailServiceCredential> {
    const id = data.id || this.generateId();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO email_service_credentials 
      (id, user_id, provider, name, api_key, from_email, from_name, aws_access_key_id, aws_secret_access_key, aws_region, is_default, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.userId,
      data.provider,
      data.name,
      data.apiKey,
      data.fromEmail,
      data.fromName,
      data.awsAccessKeyId,
      data.awsSecretAccessKey,
      data.awsRegion,
      data.isDefault ? 1 : 0,
      data.isActive !== false ? 1 : 0,
      now,
      now
    );
    
    return (await this.getEmailServiceCredential(id, data.userId!))!;
  }
  
  async updateEmailServiceCredential(id: string, userId: string, data: Partial<EmailServiceCredential>): Promise<EmailServiceCredential | null> {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.apiKey !== undefined) { updates.push('api_key = ?'); values.push(data.apiKey); }
    if (data.fromEmail !== undefined) { updates.push('from_email = ?'); values.push(data.fromEmail); }
    if (data.fromName !== undefined) { updates.push('from_name = ?'); values.push(data.fromName); }
    if (data.isDefault !== undefined) { updates.push('is_default = ?'); values.push(data.isDefault ? 1 : 0); }
    if (data.isActive !== undefined) { updates.push('is_active = ?'); values.push(data.isActive ? 1 : 0); }
    
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id, userId);
    
    this.db.prepare(`
      UPDATE email_service_credentials 
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).run(...values);
    
    return await this.getEmailServiceCredential(id, userId);
  }
  
  async deleteEmailServiceCredential(id: string, userId: string): Promise<void> {
    this.db.prepare('DELETE FROM email_service_credentials WHERE id = ? AND user_id = ?').run(id, userId);
  }
  
  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================
  
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private mapUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      profileImageUrl: row.profile_image_url,
      createdAt: row.created_at ? new Date(row.created_at) : null,
      updatedAt: row.updated_at ? new Date(row.updated_at) : null,
    };
  }
  
  private mapAICredential(row: any): AICredential {
    return {
      id: row.id,
      userId: row.user_id,
      provider: row.provider,
      name: row.name,
      apiKey: row.api_key,
      additionalConfig: row.additional_config ? JSON.parse(row.additional_config) : null,
      isDefault: row.is_default === 1,
      isActive: row.is_active === 1,
      lastUsed: row.last_used ? new Date(row.last_used) : null,
      createdAt: row.created_at ? new Date(row.created_at) : null,
      updatedAt: row.updated_at ? new Date(row.updated_at) : null,
    };
  }
  
  private mapEmailCredential(row: any): EmailServiceCredential {
    return {
      id: row.id,
      userId: row.user_id,
      provider: row.provider,
      name: row.name,
      apiKey: row.api_key,
      fromEmail: row.from_email,
      fromName: row.from_name,
      awsAccessKeyId: row.aws_access_key_id,
      awsSecretAccessKey: row.aws_secret_access_key,
      awsRegion: row.aws_region,
      isDefault: row.is_default === 1,
      isActive: row.is_active === 1,
      lastUsed: row.last_used ? new Date(row.last_used) : null,
      createdAt: row.created_at ? new Date(row.created_at) : null,
      updatedAt: row.updated_at ? new Date(row.updated_at) : null,
    };
  }
  
  private mapPhoneCredential(row: any): PhoneServiceCredential {
    return {
      id: row.id,
      userId: row.user_id,
      provider: row.provider,
      name: row.name,
      accountSid: row.account_sid,
      apiKey: row.api_key,
      phoneNumber: row.phone_number,
      awsAccessKeyId: row.aws_access_key_id,
      awsSecretAccessKey: row.aws_secret_access_key,
      awsRegion: row.aws_region,
      config: row.config ? JSON.parse(row.config) : {},
      isDefault: row.is_default === 1,
      isActive: row.is_active === 1,
      lastUsed: row.last_used ? new Date(row.last_used) : null,
      createdAt: row.created_at ? new Date(row.created_at) : null,
      updatedAt: row.updated_at ? new Date(row.updated_at) : null,
    };
  }
  
  private mapTemplate(row: any): ContentTemplate {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      aiPrompt: row.ai_prompt,
      systemPrompt: row.system_prompt,
      variables: row.variables ? JSON.parse(row.variables) : [],
      settings: row.settings ? JSON.parse(row.settings) : {},
      outputFormat: row.output_format,
      isActive: row.is_active === 1,
      lastUsed: row.last_used ? new Date(row.last_used) : null,
      createdAt: row.created_at ? new Date(row.created_at) : null,
      updatedAt: row.updated_at ? new Date(row.updated_at) : null,
    };
  }
  
  private mapGeneratedContent(row: any): GeneratedContent {
    return {
      id: row.id,
      userId: row.user_id,
      templateId: row.template_id,
      content: row.content,
      title: row.title,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      jobId: row.job_id,
      distributionStatus: row.distribution_status ? JSON.parse(row.distribution_status) : {},
      generatedAt: row.generated_at ? new Date(row.generated_at) : null,
      reviewStatus: row.review_status,
      reviewMetadata: row.review_metadata ? JSON.parse(row.review_metadata) : {},
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
      reviewedBy: row.reviewed_by,
      reviewNotes: row.review_notes,
    };
  }
}

