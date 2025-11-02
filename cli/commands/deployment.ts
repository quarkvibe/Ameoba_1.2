import { Command } from 'commander';
import { apiRequest, getConfig } from '../utils/api';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs/promises';

/**
 * Deployment Commands
 * Full parity with Deployment Guide UI
 * 
 * Robust deployment analysis and configuration
 */

export function registerDeploymentCommands(program: Command) {
  
  const deploy = program
    .command('deployment')
    .alias('deploy')
    .description('Deployment integration and analysis');
  
  /**
   * Analyze deployment environment
   * amoeba deployment:analyze
   */
  deploy
    .command('analyze')
    .description('Analyze current deployment environment')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Analyzing deployment environment...').start();
      
      try {
        const config = await getConfig();
        const response = await apiRequest('GET', '/api/deployment/analyze', {}, config);
        const data = await response.json();
        
        spinner.succeed(chalk.green('Analysis complete'));
        
        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
          return;
        }
        
        console.log(`\n${chalk.bold('Deployment Analysis')}\n`);
        console.log(`Current Port:    ${chalk.cyan(data.currentPort)}`);
        console.log(`Port Available:  ${data.portAvailable ? chalk.green('✅ Yes') : chalk.red('❌ Conflict')}`);
        console.log(`Public IP:       ${chalk.cyan(data.publicIP || 'Unknown')}`);
        console.log(`Hostname:        ${chalk.dim(data.hostname)}`);
        console.log(`Nginx:           ${data.nginxInstalled ? chalk.green('✅ Installed') : chalk.yellow('⚠️  Not installed')}`);
        console.log(`SSL:             ${data.sslAvailable ? chalk.green('✅ Available') : chalk.yellow('⚠️  Not configured')}`);
        
        if (data.conflictingServices && data.conflictingServices.length > 0) {
          console.log(chalk.yellow(`\n⚠️  Port Conflicts:`));
          data.conflictingServices.forEach((s: any) => {
            console.log(`  Port ${s.port}: ${s.processName} (PID: ${s.pid})`);
          });
        }
        
        console.log(chalk.dim(`\nSuggested subdomain: ${data.suggestedSubdomain}`));
        console.log('');
        
      } catch (error: any) {
        spinner.fail(chalk.red('Analysis failed'));
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  /**
   * Get deployment health score
   * amoeba deployment:health
   */
  deploy
    .command('health')
    .description('Show deployment health score')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const config = await getConfig();
        const response = await apiRequest('GET', '/api/deployment/health', {}, config);
        const data = await response.json();
        
        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
          return;
        }
        
        const statusColor = data.status === 'optimal' ? chalk.green :
                          data.status === 'needs_attention' ? chalk.yellow :
                          chalk.red;
        
        console.log(`\n${chalk.bold('Deployment Health')}\n`);
        console.log(`Score:  ${statusColor(`${data.score}/100`)}`);
        console.log(`Status: ${statusColor(data.status.replace('_', ' ').toUpperCase())}`);
        
        if (data.issues && data.issues.length > 0) {
          console.log(chalk.red('\nIssues:'));
          data.issues.forEach((issue: string) => console.log(`  ${chalk.red('✗')} ${issue}`));
        }
        
        if (data.recommendations && data.recommendations.length > 0) {
          console.log(chalk.cyan('\nRecommendations:'));
          data.recommendations.forEach((rec: string) => console.log(`  ${chalk.cyan('→')} ${rec}`));
        }
        
        console.log('');
        
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  /**
   * Generate nginx configuration
   * amoeba deployment:nginx
   */
  deploy
    .command('nginx')
    .description('Generate nginx configuration file')
    .option('--subdomain <subdomain>', 'Subdomain to use', 'amoeba.yourdomain.com')
    .option('--port <port>', 'Amoeba port', '5000')
    .option('--ssl', 'Include SSL configuration')
    .option('--output <file>', 'Save to file', '-')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Generating nginx configuration...').start();
      
      try {
        const config = await getConfig();
        const response = await apiRequest('POST', '/api/deployment/nginx-config', {
          subdomain: options.subdomain,
          amoebaPort: parseInt(options.port),
          sslEnabled: options.ssl || false,
        }, config);
        
        const data = await response.json();
        
        spinner.succeed(chalk.green('Nginx configuration generated'));
        
        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
          return;
        }
        
        // Output to file or stdout
        if (options.output === '-') {
          console.log('\n' + data.config + '\n');
        } else {
          await fs.writeFile(options.output, data.config, 'utf-8');
          console.log(chalk.green(`\n✅ Saved to: ${options.output}\n`));
          console.log(chalk.dim('Copy to: /etc/nginx/sites-available/amoeba'));
          console.log(chalk.dim('Then: sudo ln -s /etc/nginx/sites-available/amoeba /etc/nginx/sites-enabled/'));
          console.log(chalk.dim('Test: sudo nginx -t'));
          console.log(chalk.dim('Reload: sudo systemctl reload nginx\n'));
        }
        
      } catch (error: any) {
        spinner.fail(chalk.red('Generation failed'));
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  /**
   * Validate DNS configuration
   * amoeba deployment:dns <domain>
   */
  deploy
    .command('dns <domain>')
    .description('Validate DNS configuration')
    .option('--json', 'Output as JSON')
    .action(async (domain: string, options) => {
      const spinner = ora(`Checking DNS for ${domain}...`).start();
      
      try {
        const config = await getConfig();
        const response = await apiRequest('POST', '/api/deployment/validate-dns', {
          domain,
        }, config);
        
        const data = await response.json();
        
        spinner.stop();
        
        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
          return;
        }
        
        console.log(`\n${chalk.bold('DNS Validation')}\n`);
        console.log(`Domain:           ${chalk.cyan(domain)}`);
        console.log(`Configured:       ${data.configured ? chalk.green('✅ Yes') : chalk.red('❌ No')}`);
        console.log(`Points to Server: ${data.pointsToThisServer ? chalk.green('✅ Yes') : chalk.yellow('⚠️  No')}`);
        
        if (data.resolvedIP) {
          console.log(`Resolves to:      ${chalk.cyan(data.resolvedIP)}`);
        }
        if (data.serverIP) {
          console.log(`Server IP:        ${chalk.cyan(data.serverIP)}`);
        }
        
        console.log(chalk.dim(`\n${data.message}\n`));
        
        if (!data.pointsToThisServer && data.resolvedIP && data.serverIP) {
          console.log(chalk.yellow('Action needed:'));
          console.log('  1. Go to your domain registrar (GoDaddy, Namecheap, etc.)');
          console.log('  2. Update DNS A record:');
          console.log(`     Name: ${domain.split('.')[0]}`);
          console.log(`     Points to: ${data.serverIP}`);
          console.log('  3. Wait 5-30 minutes for DNS propagation');
          console.log('  4. Test again: amoeba deployment:dns ' + domain + '\n');
        }
        
      } catch (error: any) {
        spinner.fail(chalk.red('DNS check failed'));
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  /**
   * List detected services
   * amoeba deployment:services
   */
  deploy
    .command('services')
    .description('List other services running on this server')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const config = await getConfig();
        const response = await apiRequest('GET', '/api/deployment/services', {}, config);
        const data = await response.json();
        
        if (options.json) {
          console.log(JSON.stringify(data.services, null, 2));
          return;
        }
        
        console.log(`\n${chalk.bold('Detected Services')}\n`);
        
        if (!data.services || data.services.length === 0) {
          console.log(chalk.dim('No other services detected\n'));
          return;
        }
        
        data.services.forEach((svc: any) => {
          console.log(`${chalk.cyan(svc.name)}`);
          console.log(`  Port: ${svc.port}`);
          if (svc.url) {
            console.log(`  URL:  ${chalk.dim(svc.url)}`);
          }
          console.log('');
        });
        
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}

