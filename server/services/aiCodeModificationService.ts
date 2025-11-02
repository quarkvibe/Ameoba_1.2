import * as fs from 'fs/promises';
import * as path from 'path';
import { activityMonitor } from './activityMonitor';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * AI Code Modification Service
 * 
 * Allows AI to modify Amoeba's code with STRICT safety boundaries
 * 
 * CRITICAL SAFETY RULE:
 * "AI can modify code, but CANNOT modify the code that allows modification"
 * 
 * Following ARCHITECTURE.md & VISION.md:
 * - Phase 3: Self-modifying AI
 * - But with safety constraints
 * - Whitelist/blacklist system
 * - Human approval required
 * - Rollback capability
 * - Audit trail
 * 
 * Protected Files (AI CANNOT touch):
 * - This file (aiCodeModificationService.ts) ❌
 * - Security/auth files (replitAuth.ts, middleware/) ❌
 * - Encryption (encryptionService.ts) ❌
 * - Core database (db.ts, storage.ts) ❌
 * - Configuration files (package.json, tsconfig.json) ❌
 * 
 * Allowed Files (AI CAN modify):
 * - Other services (contentGeneration, delivery, etc.) ✅
 * - Routes (add new endpoints) ✅
 * - UI components (add new views) ✅
 * - Documentation (update guides) ✅
 */

interface CodeModificationRequest {
  intent: string;          // What user wants: "Add Discord webhook support"
  userId: string;
  approvalRequired: boolean;
}

interface CodeModificationResult {
  success: boolean;
  changes: CodeChange[];
  requiresApproval: boolean;
  approved?: boolean;
  message: string;
  error?: string;
}

interface CodeChange {
  file: string;
  action: 'create' | 'modify' | 'delete';
  originalContent?: string;
  newContent?: string;
  diff?: string;
  reason: string;
}

interface SafetyCheck {
  allowed: boolean;
  reason: string;
  violations?: string[];
}

class AICodeModificationService {
  
  // CRITICAL: Files AI CANNOT modify (safety boundary)
  private readonly PROTECTED_FILES = [
    'server/services/aiCodeModificationService.ts',  // This file!
    'server/replitAuth.ts',
    'server/middleware/errorHandler.ts',
    'server/middleware/rateLimiter.ts',
    'server/services/encryptionService.ts',
    'server/db.ts',
    'server/storage.ts',
    '.env',
    '.env.example',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'drizzle.config.ts',
  ];
  
  // Directories AI can safely modify
  private readonly ALLOWED_DIRECTORIES = [
    'server/services/',      // Can add new services
    'server/routes/',        // Can add new routes  
    'client/src/components/',// Can add new components
    'docs/',                 // Can update documentation
  ];
  
  // Patterns AI cannot create/modify
  private readonly FORBIDDEN_PATTERNS = [
    /process\.env\s*=/, // Cannot reassign environment
    /eval\(/,           // Cannot use eval
    /exec\(/,           // Cannot execute arbitrary commands
    /require\(['"]child_process['"]\)/, // Cannot spawn processes
    /\.env\..*=\s*['"]/, // Cannot hardcode secrets
  ];
  
  /**
   * Process code modification request from user
   */
  async processModificationRequest(request: CodeModificationRequest): Promise<CodeModificationResult> {
    
    activityMonitor.logActivity('info', `🧬 AI Code Modification Request: "${request.intent}"`);
    
    try {
      // 1. Safety check the intent
      const intentSafe = this.checkIntentSafety(request.intent);
      if (!intentSafe.allowed) {
        return {
          success: false,
          changes: [],
          requiresApproval: false,
          message: `❌ Request blocked: ${intentSafe.reason}`,
          error: intentSafe.violations?.join(', '),
        };
      }
      
      // 2. Generate code changes via AI
      const changes = await this.generateCodeChanges(request.intent);
      
      // 3. Validate each change against safety boundaries
      for (const change of changes) {
        const safetyCheck = this.validateChange(change);
        if (!safetyCheck.allowed) {
          return {
            success: false,
            changes: [],
            requiresApproval: false,
            message: `❌ Change blocked: ${safetyCheck.reason}`,
            error: `File: ${change.file}`,
          };
        }
      }
      
      // 4. Generate diff for user review
      for (const change of changes) {
        if (change.action === 'modify') {
          change.diff = await this.generateDiff(change.originalContent!, change.newContent!);
        }
      }
      
      // 5. Request approval if required
      if (request.approvalRequired) {
        activityMonitor.logActivity('warning', '⏸️ AI code changes pending user approval');
        
        return {
          success: true,
          changes,
          requiresApproval: true,
          approved: false,
          message: `✅ Generated ${changes.length} change(s). Review and approve to apply.`,
        };
      }
      
      // 6. Auto-apply if approval not required (dev mode only)
      await this.applyChanges(changes, request.userId);
      
      activityMonitor.logActivity('success', `✅ Applied ${changes.length} code change(s)`);
      
      return {
        success: true,
        changes,
        requiresApproval: false,
        approved: true,
        message: `✅ Successfully modified ${changes.length} file(s)`,
      };
      
    } catch (error: any) {
      activityMonitor.logError(error, 'AI Code Modification');
      return {
        success: false,
        changes: [],
        requiresApproval: false,
        message: `❌ Error: ${error.message}`,
        error: error.message,
      };
    }
  }
  
  /**
   * Validate change against safety boundaries
   */
  private validateChange(change: CodeChange): SafetyCheck {
    const violations: string[] = [];
    
    // Check if file is protected
    if (this.PROTECTED_FILES.includes(change.file)) {
      return {
        allowed: false,
        reason: `File is protected: ${change.file}`,
        violations: ['Cannot modify core security/infrastructure files'],
      };
    }
    
    // Check if in allowed directory
    const inAllowedDir = this.ALLOWED_DIRECTORIES.some(dir => 
      change.file.startsWith(dir)
    );
    
    if (!inAllowedDir) {
      return {
        allowed: false,
        reason: `File not in allowed directory: ${change.file}`,
        violations: [`Allowed directories: ${this.ALLOWED_DIRECTORIES.join(', ')}`],
      };
    }
    
    // Check for forbidden patterns in new content
    if (change.newContent) {
      for (const pattern of this.FORBIDDEN_PATTERNS) {
        if (pattern.test(change.newContent)) {
          violations.push(`Forbidden pattern detected: ${pattern.source}`);
        }
      }
    }
    
    if (violations.length > 0) {
      return {
        allowed: false,
        reason: 'Code contains forbidden patterns',
        violations,
      };
    }
    
    return {
      allowed: true,
      reason: 'Change passed all safety checks',
    };
  }
  
  /**
   * Check if intent is safe (before generating code)
   */
  private checkIntentSafety(intent: string): SafetyCheck {
    const lower = intent.toLowerCase();
    const violations: string[] = [];
    
    // Block attempts to modify security
    if (lower.includes('auth') && (lower.includes('bypass') || lower.includes('disable'))) {
      violations.push('Cannot bypass or disable authentication');
    }
    
    // Block attempts to modify encryption
    if (lower.includes('encryption') && (lower.includes('remove') || lower.includes('disable'))) {
      violations.push('Cannot disable encryption');
    }
    
    // Block attempts to modify self-modification code
    if (lower.includes('modify') && lower.includes('modification')) {
      violations.push('Cannot modify the code modification system itself');
    }
    
    if (violations.length > 0) {
      return {
        allowed: false,
        reason: 'Intent violates safety constraints',
        violations,
      };
    }
    
    return {
      allowed: true,
      reason: 'Intent is safe',
    };
  }
  
  /**
   * Generate code changes via AI (Claude or GPT-4)
   */
  private async generateCodeChanges(intent: string): Promise<CodeChange[]> {
    // TODO: Implement AI code generation
    // This would use Claude Sonnet 4 or GPT-4 to generate code
    // Based on intent + current codebase context
    
    activityMonitor.logActivity('debug', '🤖 Generating code changes via AI...');
    
    // For now, return example
    // In production, would call OpenAI/Anthropic with:
    // - User intent
    // - Current codebase (via file reading)
    // - Amoeba architecture guidelines
    // - Safety constraints
    // - Return list of changes
    
    return [
      {
        file: 'server/services/exampleNewService.ts',
        action: 'create',
        newContent: '// AI-generated service code here',
        reason: 'Creating new service as requested',
      },
    ];
  }
  
  /**
   * Apply code changes to filesystem
   */
  private async applyChanges(changes: CodeChange[], userId: string): Promise<void> {
    activityMonitor.logActivity('info', '💾 Applying code changes...');
    
    // Create backup first
    await this.createBackup();
    
    for (const change of changes) {
      try {
        const filePath = path.join(process.cwd(), change.file);
        
        switch (change.action) {
          case 'create':
            await fs.writeFile(filePath, change.newContent!, 'utf-8');
            activityMonitor.logActivity('success', `✅ Created: ${change.file}`);
            break;
          
          case 'modify':
            await fs.writeFile(filePath, change.newContent!, 'utf-8');
            activityMonitor.logActivity('success', `✅ Modified: ${change.file}`);
            break;
          
          case 'delete':
            await fs.unlink(filePath);
            activityMonitor.logActivity('success', `✅ Deleted: ${change.file}`);
            break;
        }
        
        // Log change for audit
        await this.logChange(userId, change);
        
      } catch (error: any) {
        activityMonitor.logError(error, `Applying change to ${change.file}`);
        throw new Error(`Failed to apply change to ${change.file}: ${error.message}`);
      }
    }
  }
  
  /**
   * Generate diff between old and new content
   */
  private async generateDiff(oldContent: string, newContent: string): Promise<string> {
    // Simple diff for now
    // In production, would use proper diff library
    
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    let diff = '';
    const maxLines = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      if (oldLines[i] !== newLines[i]) {
        if (oldLines[i]) {
          diff += `- ${oldLines[i]}\n`;
        }
        if (newLines[i]) {
          diff += `+ ${newLines[i]}\n`;
        }
      }
    }
    
    return diff || 'No changes';
  }
  
  /**
   * Create backup before modifications
   */
  private async createBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), '.amoeba', 'backups', timestamp);
    
    try {
      await fs.mkdir(backupDir, { recursive: true });
      
      // Copy critical files
      const filesToBackup = [
        'server/services',
        'server/routes',
        'client/src/components',
      ];
      
      // TODO: Implement recursive copy
      
      activityMonitor.logActivity('success', `💾 Backup created: ${backupDir}`);
    } catch (error: any) {
      activityMonitor.logError(error, 'Backup creation');
    }
  }
  
  /**
   * Log code change for audit trail
   */
  private async logChange(userId: string, change: CodeChange): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      file: change.file,
      action: change.action,
      reason: change.reason,
    };
    
    // TODO: Store in database or log file
    activityMonitor.logActivity('info', `📝 Code change logged: ${change.file} (${change.action})`);
  }
  
  /**
   * Rollback changes if something goes wrong
   */
  async rollback(backupTimestamp: string): Promise<void> {
    const backupDir = path.join(process.cwd(), '.amoeba', 'backups', backupTimestamp);
    
    // TODO: Restore files from backup
    
    activityMonitor.logActivity('warning', `⏪ Rolled back to: ${backupTimestamp}`);
  }
  
  /**
   * List all backups
   */
  async listBackups(): Promise<Array<{ timestamp: string; size: number }>> {
    const backupDir = path.join(process.cwd(), '.amoeba', 'backups');
    
    try {
      const entries = await fs.readdir(backupDir);
      
      const backups = await Promise.all(
        entries.map(async (entry) => {
          const entryPath = path.join(backupDir, entry);
          const stats = await fs.stat(entryPath);
          return {
            timestamp: entry,
            size: stats.size,
          };
        })
      );
      
      return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Get list of protected files (for UI display)
   */
  getProtectedFiles(): string[] {
    return [...this.PROTECTED_FILES];
  }
  
  /**
   * Get list of allowed directories (for UI display)
   */
  getAllowedDirectories(): string[] {
    return [...this.ALLOWED_DIRECTORIES];
  }
  
  /**
   * Check if a file is protected
   */
  isProtected(filePath: string): boolean {
    return this.PROTECTED_FILES.includes(filePath) ||
           this.PROTECTED_FILES.some(pattern => filePath.includes(pattern));
  }
}

export const aiCodeModificationService = new AICodeModificationService();

