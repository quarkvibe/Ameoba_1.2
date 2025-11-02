import fs from 'fs';
import path from 'path';
import os from 'os';

interface AmoebaConfig {
  apiUrl?: string;
  auth?: {
    token?: string;
    userId?: string;
  };
  defaults?: {
    aiProvider?: string;
    outputFormat?: string;
  };
  output?: {
    color?: boolean;
    json?: boolean;
    quiet?: boolean;
    verbose?: boolean;
  };
}

const CONFIG_FILENAME = '.amoebarc';

/**
 * Get config file paths in order of precedence
 */
function getConfigPaths(): string[] {
  return [
    path.join(process.cwd(), CONFIG_FILENAME),           // Project
    path.join(os.homedir(), CONFIG_FILENAME),            // Home
    path.join('/etc', CONFIG_FILENAME),                  // Global
  ];
}

/**
 * Find and read config file
 */
export function getConfig(): AmoebaConfig {
  for (const configPath of getConfigPaths()) {
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        console.error(`Warning: Failed to parse config file at ${configPath}`);
      }
    }
  }
  
  // Return default config
  return {
    apiUrl: process.env.AMOEBA_API_URL || 'http://localhost:5000',
    output: {
      color: true,
      json: false,
      quiet: false,
      verbose: false,
    },
  };
}

/**
 * Save config to home directory
 */
export function saveConfig(config: AmoebaConfig): void {
  const configPath = path.join(os.homedir(), CONFIG_FILENAME);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Update specific config value
 */
export function updateConfig(key: string, value: any): void {
  const config = getConfig();
  
  // Handle nested keys like "auth.token"
  const keys = key.split('.');
  let current: any = config;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
  
  saveConfig(config);
}

/**
 * Get specific config value
 */
export function getConfigValue(key: string): any {
  const config = getConfig();
  
  // Handle nested keys
  const keys = key.split('.');
  let current: any = config;
  
  for (const k of keys) {
    if (current[k] === undefined) {
      return undefined;
    }
    current = current[k];
  }
  
  return current;
}

/**
 * Reset config to defaults
 */
export function resetConfig(): void {
  const configPath = path.join(os.homedir(), CONFIG_FILENAME);
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
}

/**
 * Get config file path (for display)
 */
export function getConfigPath(): string {
  for (const configPath of getConfigPaths()) {
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }
  return path.join(os.homedir(), CONFIG_FILENAME);
}





