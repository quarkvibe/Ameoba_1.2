import { Command } from 'commander';
import { apiRequest, getConfig } from '../utils/api';
import chalk from 'chalk';
import ora from 'ora';

/**
 * Database Commands
 * Full parity with Database Configuration UI
 * 
 * Following MANIFESTO.md: "CLI and GUI both first-class citizens"
 */

export function registerDatabaseCommands(program: Command) {
  
  const db = program
    .command('database')
    .alias('db')
    .description('Database configuration and management');
  
  /**
   * Show database status (with traffic light!)
   * amoeba database:status
   */
  db
    .command('status')
    .description('Show database connection status (🟢🟡🔴)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Checking database connection...').start();
      
      try {
        const config = await getConfig();
        const health = await apiRequest('GET', '/api/testing/health', {}, config);
        const healthData = await health.json();
        
        const envVars = await apiRequest('GET', '/api/environment/variables', {}, config);
        const envData = await envVars.json();
        
        const dbType = envData.variables?.find((v: any) => v.key === 'DATABASE_TYPE')?.value || 'postgres';
        const dbUrl = envData.variables?.find((v: any) => v.key === 'DATABASE_URL')?.value || '';
        
        spinner.stop();
        
        if (options.json) {
          console.log(JSON.stringify({
            type: dbType,
            configured: !!dbUrl,
            connected: healthData.success,
            status: healthData.status,
          }, null, 2));
          return;
        }
        
        // Traffic light display
        const trafficLight = healthData.success ? '🟢' : '🔴';
        console.log(`\n${chalk.bold('Database Status')} ${trafficLight}\n`);
        console.log(`Type:       ${chalk.cyan(dbType)}`);
        console.log(`Location:   ${dbType === 'sqlite' ? '📱 Client-Side (Serverless)' : '🌐 Server-Side (Cloud)'}`);
        console.log(`Status:     ${healthData.success ? chalk.green('✅ Connected') : chalk.red('❌ Not Connected')}`);
        
        if (dbType === 'sqlite') {
          console.log(`\n${chalk.dim('SQLite:')}`);
          console.log(`  • Zero configuration`);
          console.log(`  • File-based (./amoeba.db)`);
          console.log(`  • Perfect for development & single-user`);
        } else {
          console.log(`\n${chalk.dim('PostgreSQL:')}`);
          console.log(`  • Scalable & reliable`);
          console.log(`  • Multi-user support`);
          console.log(`  • Free tier available (Neon.tech)`);
        }
        
        console.log('');
      } catch (error: any) {
        spinner.fail(chalk.red('Database check failed'));
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  /**
   * Switch database type
   * amoeba database:switch <type>
   */
  db
    .command('switch <type>')
    .description('Switch database type (postgres|sqlite|mysql|mongodb)')
    .option('--url <url>', 'Database connection URL (for postgres/mysql)')
    .option('--path <path>', 'Database file path (for sqlite)')
    .option('--json', 'Output as JSON')
    .action(async (type: string, options) => {
      const validTypes = ['postgres', 'postgresql', 'sqlite', 'mysql', 'mongodb', 'memory'];
      
      if (!validTypes.includes(type.toLowerCase())) {
        console.error(chalk.red(`Invalid database type: ${type}`));
        console.log(chalk.dim(`Valid types: ${validTypes.join(', ')}`));
        process.exit(1);
      }
      
      const spinner = ora(`Switching to ${type}...`).start();
      
      try {
        const config = await getConfig();
        const updates: any = {
          DATABASE_TYPE: type.toLowerCase(),
        };
        
        if (options.url) {
          updates.DATABASE_URL = options.url;
        } else if (options.path) {
          updates.SQLITE_PATH = options.path;
        }
        
        const response = await apiRequest('POST', '/api/environment/variables/bulk', { updates }, config);
        const data = await response.json();
        
        spinner.succeed(chalk.green(`Database switched to ${type}`));
        
        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
          return;
        }
        
        console.log(chalk.yellow('\n⚠️  Server restart required for changes to take effect'));
        console.log(chalk.dim('Run: npm restart or pm2 restart amoeba\n'));
        
      } catch (error: any) {
        spinner.fail(chalk.red('Failed to switch database'));
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  /**
   * Test database connection
   * amoeba database:test
   */
  db
    .command('test')
    .description('Test database connection')
    .option('--type <type>', 'Database type to test')
    .option('--url <url>', 'Connection URL to test')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Testing database connection...').start();
      
      try {
        const config = await getConfig();
        const response = await apiRequest('POST', '/api/database/test-connection', {
          type: options.type || 'postgres',
          url: options.url || '',
        }, config);
        
        const data = await response.json();
        
        if (data.success) {
          spinner.succeed(chalk.green('Connection test passed'));
        } else {
          spinner.fail(chalk.red('Connection test failed'));
        }
        
        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
          return;
        }
        
        console.log(chalk.dim(`\n${data.message}\n`));
        
      } catch (error: any) {
        spinner.fail(chalk.red('Connection test failed'));
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  /**
   * Show database info
   * amoeba database:info
   */
  db
    .command('info')
    .description('Show detailed database information')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const config = await getConfig();
        const diagnostics = await apiRequest('GET', '/api/testing/diagnostics', {}, config);
        const data = await diagnostics.json();
        
        if (options.json) {
          console.log(JSON.stringify(data.database, null, 2));
          return;
        }
        
        console.log(`\n${chalk.bold('Database Information')}\n`);
        console.log(`Connection: ${data.database?.connected ? chalk.green('✅ Connected') : chalk.red('❌ Disconnected')}`);
        console.log('');
        
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}

