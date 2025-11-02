import { Command } from 'commander';
import { getConfig, updateConfig, resetConfig, getConfigPath, getConfigValue } from '../utils/config';
import { success, error, info, log } from '../utils/output';

export function registerConfigCommands(program: Command) {
  const config = program.command('config').description('Manage configuration');

  // List
  config
    .command('list')
    .description('Show all configuration')
    .action(() => {
      const cfg = getConfig();
      log('');
      log(`Configuration file: ${getConfigPath()}`);
      log('');
      log(JSON.stringify(cfg, null, 2));
      log('');
    });

  // Get
  config
    .command('get <key>')
    .description('Get configuration value')
    .action((key) => {
      const value = getConfigValue(key);
      
      if (value === undefined) {
        error(`Config key "${key}" not found`);
        process.exit(1);
      }

      if (typeof value === 'object') {
        log(JSON.stringify(value, null, 2));
      } else {
        log(String(value));
      }
    });

  // Set
  config
    .command('set <key> <value>')
    .description('Set configuration value')
    .action((key, value) => {
      try {
        // Try to parse as JSON
        let parsedValue: any = value;
        try {
          parsedValue = JSON.parse(value);
        } catch {
          // Keep as string
        }

        updateConfig(key, parsedValue);
        success(`Config updated: ${key} = ${value}`);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  // Reset
  config
    .command('reset')
    .description('Reset configuration to defaults')
    .option('--yes', 'Skip confirmation')
    .action(async (options) => {
      if (!options.yes) {
        const prompts = require('prompts');
        const response = await prompts({
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to reset configuration?',
          initial: false,
        });

        if (!response.confirm) {
          info('Cancelled');
          return;
        }
      }

      resetConfig();
      success('Configuration reset to defaults');
    });
}




