import crypto from 'crypto';
import * as machineIdModule from 'node-machine-id';
import { storage } from '../storage';

const { machineIdSync } = machineIdModule as any;

/**
 * License Service for $3.50 lifetime license management
 * Handles generation, activation, validation, and deactivation
 */

export interface LicenseStatus {
  isValid: boolean;
  licenseKey?: string;
  status: 'inactive' | 'active' | 'deactivated' | 'expired';
  activatedAt?: Date;
  deviceFingerprint?: string;
  message: string;
}

export class LicenseService {
  private readonly LICENSE_PREFIX = 'AMEOBA';
  private readonly LICENSE_VERSION = 'V1';
  private readonly GRACE_PERIOD_DAYS = 7;

  /**
   * Generate a unique license key for user after $3.50 payment
   */
  async generateLicense(userId: string, paymentId: string): Promise<string> {
    try {
      // Generate unique license key
      const licenseKey = this.createLicenseKey();

      // Store in database
      await storage.createLicense({
        userId,
        licenseKey,
        paymentId,
        status: 'inactive', // Becomes 'active' when user activates it
      });

      console.log(`✅ License generated for user ${userId}: ${licenseKey}`);
      
      return licenseKey;
    } catch (error) {
      console.error('Error generating license:', error);
      throw new Error('Failed to generate license key');
    }
  }

  /**
   * Create formatted license key
   * Format: AMEOBA-V1-XXXX-XXXX-XXXX-XXXX
   */
  private createLicenseKey(): string {
    const randomPart = crypto.randomBytes(16).toString('hex').toUpperCase();
    const formatted = randomPart.match(/.{1,4}/g)?.join('-') || randomPart;
    return `${this.LICENSE_PREFIX}-${this.LICENSE_VERSION}-${formatted}`;
  }

  /**
   * Activate license on a specific device
   * Binds license to device fingerprint
   */
  async activateLicense(licenseKey: string, userId: string): Promise<LicenseStatus> {
    try {
      // Get device fingerprint
      const deviceFingerprint = this.getDeviceFingerprint();

      // Get license from database
      const license = await storage.getLicenseByKey(licenseKey);

      if (!license) {
        return {
          isValid: false,
          status: 'inactive',
          message: 'Invalid license key',
        };
      }

      // Check if license belongs to this user
      if (license.userId !== userId) {
        return {
          isValid: false,
          status: 'inactive',
          message: 'License key does not belong to your account',
        };
      }

      // Check if already deactivated
      if (license.status === 'deactivated') {
        return {
          isValid: false,
          status: 'deactivated',
          message: 'License has been deactivated. Please contact support or purchase a new license.',
        };
      }

      // Check if already activated on another device
      if (license.status === 'active' && license.deviceFingerprint && license.deviceFingerprint !== deviceFingerprint) {
        return {
          isValid: false,
          status: 'active',
          message: `License is already activated on another device. Please deactivate it first.`,
        };
      }

      // Activate license
      await storage.activateLicense(licenseKey, deviceFingerprint);

      console.log(`✅ License activated: ${licenseKey} on device ${deviceFingerprint.substring(0, 8)}...`);

      return {
        isValid: true,
        licenseKey,
        status: 'active',
        activatedAt: new Date(),
        deviceFingerprint: deviceFingerprint.substring(0, 8) + '...',
        message: 'License activated successfully',
      };
    } catch (error) {
      console.error('Error activating license:', error);
      throw new Error('Failed to activate license');
    }
  }

  /**
   * Validate license on app startup
   * Checks if license is valid for current device
   */
  async validateLicense(userId: string): Promise<LicenseStatus> {
    try {
      // Get device fingerprint
      const deviceFingerprint = this.getDeviceFingerprint();

      // Get user's active license
      const license = await storage.getActiveLicense(userId);

      if (!license) {
        return {
          isValid: false,
          status: 'inactive',
          message: 'No active license found. Please purchase a license ($3.50).',
        };
      }

      // Check if license is for this device
      if (license.deviceFingerprint !== deviceFingerprint) {
        return {
          isValid: false,
          status: 'active',
          message: 'License is activated on a different device',
        };
      }

      // Check if license is deactivated
      if (license.status === 'deactivated') {
        return {
          isValid: false,
          status: 'deactivated',
          message: 'License has been deactivated',
        };
      }

      // Update last validated timestamp
      await storage.updateLicenseLastValidated(license.id);

      return {
        isValid: true,
        licenseKey: license.licenseKey,
        status: 'active',
        activatedAt: license.activatedAt || undefined,
        deviceFingerprint: deviceFingerprint.substring(0, 8) + '...',
        message: 'License valid',
      };
    } catch (error) {
      console.error('Error validating license:', error);
      
      // Grace period: Allow operation if last validation was recent
      const gracePeriodMs = this.GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
      // TODO: Check last validation timestamp from cache
      
      return {
        isValid: false,
        status: 'inactive',
        message: 'License validation failed',
      };
    }
  }

  /**
   * Deactivate license (user initiated)
   * Releases device so user can activate on a new device
   */
  async deactivateLicense(userId: string, licenseKey: string): Promise<boolean> {
    try {
      const license = await storage.getLicenseByKey(licenseKey);

      if (!license) {
        throw new Error('License not found');
      }

      if (license.userId !== userId) {
        throw new Error('License does not belong to your account');
      }

      if (license.status !== 'active') {
        throw new Error('License is not active');
      }

      // Deactivate (removes device fingerprint, allows reactivation elsewhere)
      await storage.deactivateLicense(licenseKey);

      console.log(`✅ License deactivated: ${licenseKey}`);

      return true;
    } catch (error) {
      console.error('Error deactivating license:', error);
      throw error;
    }
  }

  /**
   * Get all licenses for a user
   */
  async getUserLicenses(userId: string): Promise<any[]> {
    try {
      const licenses = await storage.getUserLicenses(userId);
      
      // Mask license keys for security (show first 8 and last 4 chars)
      return licenses.map(license => ({
        ...license,
        licenseKey: this.maskLicenseKey(license.licenseKey),
        deviceFingerprint: license.deviceFingerprint 
          ? license.deviceFingerprint.substring(0, 8) + '...'
          : null,
      }));
    } catch (error) {
      console.error('Error getting user licenses:', error);
      return [];
    }
  }

  /**
   * Get device fingerprint (unique identifier for this machine)
   * Uses hardware-based ID that persists across restarts
   */
  private getDeviceFingerprint(): string {
    try {
      // Get machine ID (persistent hardware-based ID)
      const machineId = machineIdSync(true); // true = original machine ID
      
      // Add hostname for additional uniqueness
      const hostname = require('os').hostname();
      
      // Create fingerprint hash
      const fingerprint = crypto
        .createHash('sha256')
        .update(machineId + hostname)
        .digest('hex');
      
      return fingerprint;
    } catch (error) {
      console.error('Error getting device fingerprint:', error);
      throw new Error('Failed to generate device fingerprint');
    }
  }

  /**
   * Mask license key for display
   * Shows: AMEOBA-V1-XXXX-****-****-XXXX
   */
  private maskLicenseKey(licenseKey: string): string {
    if (!licenseKey) return '';
    
    const parts = licenseKey.split('-');
    if (parts.length < 4) return licenseKey;
    
    return `${parts[0]}-${parts[1]}-${parts[2]}-****-****-${parts[parts.length - 1]}`;
  }

  /**
   * Check if license validation is required
   * (Used for grace period logic)
   */
  needsValidation(lastValidatedAt: Date | null): boolean {
    if (!lastValidatedAt) return true;
    
    const now = new Date();
    const hoursSinceValidation = (now.getTime() - lastValidatedAt.getTime()) / (1000 * 60 * 60);
    
    // Validate once per day
    return hoursSinceValidation >= 24;
  }

  /**
   * Get license statistics (for admin dashboard)
   */
  async getLicenseStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    deactivated: number;
  }> {
    try {
      const stats = await storage.getLicenseStats();
      return stats;
    } catch (error) {
      console.error('Error getting license stats:', error);
      return { total: 0, active: 0, inactive: 0, deactivated: 0 };
    }
  }
}

export const licenseService = new LicenseService();

