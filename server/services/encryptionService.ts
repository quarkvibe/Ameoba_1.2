import crypto from 'crypto';

/**
 * Encryption service for sensitive data (API keys, credentials)
 * Uses AES-256-GCM for authenticated encryption
 */
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits
  
  /**
   * Get encryption key from environment
   * Falls back to a default key for development (NOT FOR PRODUCTION!)
   */
  private getEncryptionKey(): Buffer {
    const envKey = process.env.ENCRYPTION_KEY;
    
    if (!envKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ENCRYPTION_KEY environment variable is required in production');
      }
      
      // Development fallback - DO NOT USE IN PRODUCTION
      console.warn('⚠️  WARNING: Using default encryption key. Set ENCRYPTION_KEY in production!');
      return crypto.scryptSync('development-key-do-not-use-in-production', 'salt', this.keyLength);
    }
    
    // Derive key from environment variable using scrypt
    return crypto.scryptSync(envKey, 'amoeba-salt-v1', this.keyLength);
  }

  /**
   * Encrypt sensitive text
   * @param plaintext - Text to encrypt
   * @returns Encrypted string in format: iv:authTag:ciphertext (all hex)
   */
  encrypt(plaintext: string): string {
    if (!plaintext) {
      throw new Error('Cannot encrypt empty value');
    }

    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(16); // 128-bit IV
      const cipher = crypto.createCipheriv(this.algorithm, key, iv) as crypto.CipherGCM;
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Format: iv:authTag:ciphertext (all hex)
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt encrypted text
   * @param encrypted - Encrypted string from encrypt()
   * @returns Decrypted plaintext
   */
  decrypt(encrypted: string): string {
    if (!encrypted) {
      throw new Error('Cannot decrypt empty value');
    }

    try {
      const parts = encrypted.split(':');
      
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted format');
      }
      
      const key = this.getEncryptionKey();
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const ciphertext = parts[2];
      
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv) as crypto.DecipherGCM;
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data - data may be corrupted or key changed');
    }
  }

  /**
   * Hash a value (one-way, for API keys)
   * @param value - Value to hash
   * @returns SHA-256 hash in hex
   */
  hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * Generate a random API key
   * @param prefix - Optional prefix (e.g., 'amoeba_')
   * @returns Random API key
   */
  generateApiKey(prefix = 'amoeba_'): string {
    const randomBytes = crypto.randomBytes(32);
    const key = randomBytes.toString('hex');
    return `${prefix}${key}`;
  }

  /**
   * Securely compare two values (constant time)
   * Prevents timing attacks
   */
  secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    try {
      return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
      return false;
    }
  }
}

export const encryptionService = new EncryptionService();

