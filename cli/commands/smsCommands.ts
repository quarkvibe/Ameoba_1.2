import { Command } from 'commander';
import { apiRequest, getConfig } from '../utils/api';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';

/**
 * SMS Commands Management
 * Configure SMS command interface from CLI
 * 
 * Meta: Using CLI to configure SMS commands ✅
 */

export function registerSMSCommandsManagement(program: Command) {
  
  const sms = program
    .command('sms-commands')
    .alias('sms-cmd')
    .description('SMS command interface configuration');
  
  /**
   * Authorize phone number for SMS commands
   * amoeba sms-commands:authorize <phone>
   */
  sms
    .command('authorize <phone>')
    .description('Authorize phone number to send commands via SMS')
    .option('--json', 'Output as JSON')
    .action(async (phone: string, options) => {
      const spinner = ora(`Authorizing ${phone}...`).start();
      
      try {
        const config = await getConfig();
        const response = await apiRequest('POST', '/api/sms-commands/authorize', {
          phoneNumber: phone,
        }, config);
        
        const data = await response.json();
        
        spinner.succeed(chalk.green(`${phone} authorized for SMS commands`));
        
        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
          return;
        }
        
        console.log(chalk.dim('\nYou can now text commands to your Twilio number:\n'));
        console.log('  • "status" - System health');
        console.log('  • "generate <template>" - Generate content');
        console.log('  • "queue" - Review queue');
        console.log('  • "approve all" - Approve pending');
        console.log('  • And more! Text "help" for full list\n');
        
      } catch (error: any) {
        spinner.fail(chalk.red('Authorization failed'));
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  /**
   * Remove authorized phone
   * amoeba sms-commands:remove <phone>
   */
  sms
    .command('remove <phone>')
    .description('Remove phone authorization')
    .option('--force', 'Skip confirmation')
    .option('--json', 'Output as JSON')
    .action(async (phone: string, options) => {
      try {
        if (!options.force) {
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Remove authorization for ${phone}?`,
              default: false,
            },
          ]);
          
          if (!answers.confirm) {
            console.log(chalk.dim('Cancelled'));
            return;
          }
        }
        
        const spinner = ora(`Removing ${phone}...`).start();
        
        const config = await getConfig();
        await apiRequest('DELETE', `/api/sms-commands/authorize/${encodeURIComponent(phone)}`, {}, config);
        
        spinner.succeed(chalk.green(`${phone} unauthorized`));
        
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  /**
   * List authorized phones
   * amoeba sms-commands:list
   */
  sms
    .command('list')
    .description('List authorized phone numbers')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const config = await getConfig();
        const response = await apiRequest('GET', '/api/sms-commands/settings', {}, config);
        const data = await response.json();
        
        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
          return;
        }
        
        console.log(`\n${chalk.bold('Authorized Phone Numbers')}\n`);
        
        if (!data.authorizedNumbers || data.authorizedNumbers.length === 0) {
          console.log(chalk.dim('No authorized numbers yet'));
          console.log(chalk.dim('Add one: amoeba sms-commands:authorize +1234567890\n'));
          return;
        }
        
        data.authorizedNumbers.forEach((phone: string) => {
          console.log(`  ${chalk.green('✓')} ${phone}`);
        });
        
        console.log(chalk.dim(`\nWebhook URL: ${data.webhookUrl}`));
        console.log(chalk.dim('Configure this in Twilio Console → Messaging → Webhook\n'));
        
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  /**
   * Test SMS command
   * amoeba sms-commands:test <command>
   */
  sms
    .command('test <command>')
    .description('Test SMS command execution (simulates SMS)')
    .option('--json', 'Output as JSON')
    .action(async (command: string, options) => {
      const spinner = ora(`Testing command: ${command}...`).start();
      
      try {
        const config = await getConfig();
        const response = await apiRequest('POST', '/api/sms-commands/test', { command }, config);
        const data = await response.json();
        
        spinner.succeed(chalk.green('Command executed'));
        
        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
          return;
        }
        
        console.log(chalk.dim('\nResponse (what would be sent via SMS):\n'));
        console.log(chalk.cyan(data.response));
        console.log('');
        
      } catch (error: any) {
        spinner.fail(chalk.red('Command test failed'));
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}

