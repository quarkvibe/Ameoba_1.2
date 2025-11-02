import chalk from 'chalk';
import Table from 'cli-table3';
import { getConfig } from './config';

/**
 * Output utilities with color support
 */

export function shouldUseColor(): boolean {
  const config = getConfig();
  return config.output?.color !== false && process.stdout.isTTY;
}

export function success(message: string): void {
  const config = getConfig();
  if (config.output?.quiet) return;
  
  if (shouldUseColor()) {
    console.log(chalk.green('✓'), message);
  } else {
    console.log('✓', message);
  }
}

export function error(message: string): void {
  const config = getConfig();
  if (config.output?.quiet) return;
  
  if (shouldUseColor()) {
    console.error(chalk.red('✗'), message);
  } else {
    console.error('✗', message);
  }
}

export function warning(message: string): void {
  const config = getConfig();
  if (config.output?.quiet) return;
  
  if (shouldUseColor()) {
    console.warn(chalk.yellow('⚠'), message);
  } else {
    console.warn('⚠', message);
  }
}

export function info(message: string): void {
  const config = getConfig();
  if (config.output?.quiet) return;
  
  if (shouldUseColor()) {
    console.log(chalk.blue('ℹ'), message);
  } else {
    console.log('ℹ', message);
  }
}

export function log(message: string): void {
  const config = getConfig();
  if (config.output?.quiet) return;
  console.log(message);
}

export function verbose(message: string): void {
  const config = getConfig();
  if (config.output?.verbose) {
    console.log(chalk.gray(message));
  }
}

export function json(data: any): void {
  console.log(JSON.stringify(data, null, 2));
}

export function outputData(data: any, formatFn?: () => void): void {
  const config = getConfig();
  
  if (config.output?.json) {
    json(data);
  } else if (formatFn) {
    formatFn();
  } else {
    console.log(data);
  }
}

/**
 * Create a formatted table
 */
export function createTable(head: string[]): Table.Table {
  return new Table({
    head: shouldUseColor() ? head.map(h => chalk.bold(h)) : head,
    style: {
      head: [],
      border: shouldUseColor() ? ['gray'] : [],
    },
  });
}

/**
 * Format status indicators
 */
export function statusIndicator(status: 'healthy' | 'degraded' | 'critical' | boolean): string {
  if (typeof status === 'boolean') {
    return status ? (shouldUseColor() ? chalk.green('✓') : '✓') : (shouldUseColor() ? chalk.red('✗') : '✗');
  }
  
  if (!shouldUseColor()) {
    return status === 'healthy' ? '🟢' : status === 'degraded' ? '🟡' : '🔴';
  }
  
  switch (status) {
    case 'healthy':
      return chalk.green('🟢');
    case 'degraded':
      return chalk.yellow('🟡');
    case 'critical':
      return chalk.red('🔴');
  }
}

/**
 * Format durations
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Format file sizes
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(amount < 0.01 ? 4 : 2)}`;
}

/**
 * Truncate string
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Format date
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
}

/**
 * Progress indicator
 */
export function progress(current: number, total: number): string {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * 20);
  const empty = 20 - filled;
  
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  if (shouldUseColor()) {
    return `${chalk.cyan(bar)} ${chalk.bold(percentage + '%')} (${current}/${total})`;
  }
  
  return `${bar} ${percentage}% (${current}/${total})`;
}





