import { Command } from 'commander';
import { apiRequest, getConfig } from '../utils/api';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';

/**
 * Environment Commands
 * Full parity with Environment Manager UI
 * 
 * Robust, professional, scriptable
 */

export function registerEnvironmentCommands(program: Command) {
  
  const env = program
    .command('environment')
    .alias('env')
    .description('Environment variable management');
  
  /**
   * List all environment variables
   * amoeba env:list
   */
  env
    .command('list')
    .alias('ls')
    .description('List all environment variables')
    .option('--category <category>', 'Filter by category (core|ai|email|phone|deployment)')
    .option('--show-values', 'Show actual values (masked by default)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const config = await getConfig();
        const response = await apiRequest('GET', '/api/environment/variables', {}, config);
        const data = await response.json();
        
        let variables = data.variables || [];
        
        // Filter by category if specified
        if (options.category) {
          variables = variables.filter((v: any) => v.category === options.category);
        }
        
        if (options.json) {
          console.log(JSON.stringify(variables, null, 2));
          return;
        }
        
        // Group by category
        const grouped = variables.reduce((acc: any, v: any) => {
          const cat = v.category || 'other';
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(v);
          return acc;
        }, {});
        
        console.log(`\n${chalk.bold('Environment Variables')}\n`);
        
        for (const [category, vars] of Object.entries(grouped)) {
          console.log(chalk.cyan(`\n${category.toUpperCase()}:`));
          (vars as any[]).forEach((v: any) => {
            const value = options.showValues ? v.value : (v.value ? '***SET***' : '(not set)');
            const required = v.required ? chalk.red('*') : ' ';
            console.log(`  ${required} ${chalk.bold(v.key)}: ${value}`);
            if (v.description) {
              console.log(`    ${chalk.dim(v.description)}`);
            }
          });
        }
        
        console.log(chalk.dim(`\n${chalk.red('*')} = required\n`));
        
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  /**
   * Get specific environment variable
   * amoeba env:get <key>
   */
  env
    .command('get <key>')
    .description('Get value of environment variable')
    .option('--show-value', 'Show actual value (masked by default)')
    .option('--json', 'Output as JSON')
    .action(async (key: string, options) => {
      try {
        const config = await getConfig();
        const response = await apiRequest('GET', `/api/environment/variables/${key}`, {}, config);
        const data = await response.json();
        
        if (!data.variable) {
          console.error(chalk.red(`Variable not found: ${key}`));
          process.exit(1);
        }
        
        if (options.json) {
          console.log(JSON.stringify(data.variable, null, 2));
          return;
        }
        
        console.log(`\n${chalk.bold(key)}`);
        console.log(`Value: ${options.showValue ? data.variable.value : (data.variable.value ? '***MASKED***' : '(not set)')}`);
        if (data.variable.description) {
          console.log(`Description: ${chalk.dim(data.variable.description)}`);
        }
        if (data.variable.required) {
          console.log(chalk.red('Required: Yes'));
        }
        console.log('');
        
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  /**
   * Set environment variable
   * amoeba env:set <key> <value>
   */
  env
    .command('set <key> [value]')
    .description('Set environment variable')
    .option('--interactive', 'Interactive mode with prompts')
    .option('--json', 'Output as JSON')
    .action(async (key: string, value: string | undefined, options) => {
      try {
        let actualValue = value;
        
        // Interactive mode
        if (options.interactive || !value) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'value',
              message: `Enter value for ${key}:`,
              default: value,
            },
          ]);
          actualValue = answers.value;
        }
        
        if (!actualValue) {
          console.error(chalk.red('Value is required'));
          process.exit(1);
        }
        
        const spinner = ora(`Setting ${key}...`).start();
        
        const config = await getConfig();
        const response = await apiRequest('PUT', `/api/environment/variables/${key}`, {
          value: actualValue,
        }, config);
        
        const data = await response.json();
        
        spinner.succeed(chalk.green(`${key} set successfully`));
        
        if (data.requiresRestart) {
          console.log(chalk.yellow('\n⚠️  Server restart required'));
          console.log(chalk.dim('Run: npm restart or pm2 restart amoeba\n'));
        }
        
        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
        }
        
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  /**
   * Delete environment variable
   * amoeba env:delete <key>
   */
  env
    .command('delete <key>')
    .alias('rm')
    .description('Delete environment variable')
    .option('--force', 'Skip confirmation')
    .option('--json', 'Output as JSON')
    .action(async (key: string, options) => {
      try {
        // Confirm unless --force
        if (!options.force) {
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Delete ${key}?`,
              default: false,
            },
          ]);
          
          if (!answers.confirm) {
            console.log(chalk.dim('Cancelled'));
            return;
          }
        }
        
        const spinner = ora(`Deleting ${key}...`).start();
        
        const config = await getConfig();
        const response = await apiRequest('DELETE', `/api/environment/variables/${key}`, {}, config);
        const data = await response.json();
        
        spinner.succeed(chalk.green(`${key} deleted`));
        
        if (data.requiresRestart) {
          console.log(chalk.yellow('\n⚠️  Server restart required\n'));
        }
        
        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
        }
        
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  /**
   * Generate encryption key
   * amoeba env:generate-key <type>
   */
  env
    .command('generate-key <type>')
    .description('Generate encryption or session key (encryption|session)')
    .option('--set', 'Automatically set in environment')
    .option('--json', 'Output as JSON')
    .action(async (type: string, options) => {
      if (!['encryption', 'session'].includes(type)) {
        console.error(chalk.red('Type must be: encryption or session'));
        process.exit(1);
      }
      
      try {
        const config = await getConfig();
        const response = await apiRequest('POST', '/api/environment/generate-key', { type }, config);
        const data = await response.json();
        
        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
          return;
        }
        
        console.log(`\n${chalk.bold(`Generated ${type} key:`)}\n`);
        console.log(chalk.cyan(data.key));
        
        if (options.set) {
          const spinner = ora(`Setting ${type === 'encryption' ? 'ENCRYPTION_KEY' : 'SESSION_SECRET'}...`).start();
          const keyName = type === 'encryption' ? 'ENCRYPTION_KEY' : 'SESSION_SECRET';
          
          await apiRequest('PUT', `/api/environment/variables/${keyName}`, {
            value: data.key,
          }, config);
          
          spinner.succeed(chalk.green('Key set in environment'));
          console.log(chalk.yellow('\n⚠️  Server restart required\n'));
        } else {
          console.log(chalk.dim(`\nTo set: amoeba env:set ${type === 'encryption' ? 'ENCRYPTION_KEY' : 'SESSION_SECRET'} <key>\n`));
        }
        
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  /**
   * Validate environment configuration
   * amoeba env:validate
   */
  env
    .command('validate')
    .description('Validate environment configuration')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Validating environment...').start();
      
      try {
        const config = await getConfig();
        const response = await apiRequest('GET', '/api/environment/validate', {}, config);
        const data = await response.json();
        
        spinner.stop();
        
        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
          return;
        }
        
        if (data.valid) {
          console.log(chalk.green('\n✅ Environment validation passed\n'));
        } else {
          console.log(chalk.red('\n❌ Environment validation failed\n'));
          
          if (data.errors && data.errors.length > 0) {
            console.log(chalk.red('Errors:'));
            data.errors.forEach((err: string) => console.log(`  ${chalk.red('✗')} ${err}`));
          }
        }
        
        if (data.warnings && data.warnings.length > 0) {
          console.log(chalk.yellow('\nWarnings:'));
          data.warnings.forEach((warn: string) => console.log(`  ${chalk.yellow('⚠')} ${warn}`));
        }
        
        if (data.suggestions && data.suggestions.length > 0) {
          console.log(chalk.cyan('\nSuggestions:'));
          data.suggestions.forEach((sug: string) => console.log(`  ${chalk.cyan('ℹ')} ${sug}`));
        }
        
        console.log('');
        
        if (!data.valid) {
          process.exit(1);
        }
        
      } catch (error: any) {
        spinner.fail(chalk.red('Validation failed'));
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  /**
   * Show change log
   * amoeba env:changelog
   */
  env
    .command('changelog')
    .description('Show environment variable change history')
    .option('--limit <n>', 'Number of entries to show', '20')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const config = await getConfig();
        const response = await apiRequest('GET', `/api/environment/changelog?limit=${options.limit}`, {}, config);
        const data = await response.json();
        
        if (options.json) {
          console.log(JSON.stringify(data.changelog, null, 2));
          return;
        }
        
        console.log(`\n${chalk.bold('Environment Change Log')}\n`);
        
        if (!data.changelog || data.changelog.length === 0) {
          console.log(chalk.dim('No changes recorded yet\n'));
          return;
        }
        
        data.changelog.forEach((entry: any) => {
          const action = entry.action === 'create' ? chalk.green('CREATE') :
                        entry.action === 'update' ? chalk.yellow('UPDATE') :
                        chalk.red('DELETE');
          
          console.log(`${action} ${chalk.bold(entry.key)}`);
          console.log(`  ${chalk.dim(new Date(entry.timestamp).toLocaleString())}`);
          if (entry.userId) {
            console.log(`  ${chalk.dim(`By: ${entry.userId}`)}`);
          }
          console.log('');
        });
        
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}

