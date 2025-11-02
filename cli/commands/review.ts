import { Command } from 'commander';
import { apiRequest, getConfig } from '../utils/api';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import Table from 'cli-table3';

/**
 * Review Queue Commands
 * Full parity with Review Queue UI
 * 
 * Robust CLI for content review workflow
 */

export function registerReviewCommands(program: Command) {
  
  const review = program
    .command('review')
    .description('Content review queue management');
  
  /**
   * Show pending reviews
   * amoeba review:queue
   */
  review
    .command('queue')
    .alias('pending')
    .description('Show pending reviews')
    .option('--json', 'Output as JSON')
    .option('--all', 'Show all reviews (not just pending)')
    .action(async (options) => {
      try {
        const config = await getConfig();
        const endpoint = options.all ? '/api/reviews' : '/api/reviews/pending';
        const response = await apiRequest('GET', endpoint, {}, config);
        const data = await response.json();
        
        if (options.json) {
          console.log(JSON.stringify(data.reviews, null, 2));
          return;
        }
        
        if (!data.reviews || data.reviews.length === 0) {
          console.log(chalk.green('\n✅ No pending reviews. All clear!\n'));
          return;
        }
        
        console.log(`\n${chalk.bold('Review Queue')} (${data.reviews.length})\n`);
        
        const table = new Table({
          head: ['ID', 'Template', 'Quality', 'Status', 'Submitted'].map(h => chalk.cyan(h)),
        });
        
        data.reviews.slice(0, 10).forEach((r: any) => {
          const quality = r.metadata?.qualityScore !== undefined 
            ? `${r.metadata.qualityScore}/100`
            : 'N/A';
          const qualityColor = (r.metadata?.qualityScore || 0) >= 80 ? chalk.green :
                              (r.metadata?.qualityScore || 0) >= 60 ? chalk.yellow :
                              chalk.red;
          
          table.push([
            r.id.substring(0, 8),
            r.templateName,
            qualityColor(quality),
            r.status,
            new Date(r.submittedAt).toLocaleDateString(),
          ]);
        });
        
        console.log(table.toString());
        
        if (data.reviews.length > 10) {
          console.log(chalk.dim(`\n...and ${data.reviews.length - 10} more\n`));
        }
        
        console.log(chalk.dim('\nUse: amoeba review:approve <id> or amoeba review:approve-all\n'));
        
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  /**
   * Approve specific review
   * amoeba review:approve <id>
   */
  review
    .command('approve <id>')
    .description('Approve content for delivery')
    .option('--notes <notes>', 'Approval notes')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options) => {
      const spinner = ora(`Approving ${id}...`).start();
      
      try {
        const config = await getConfig();
        const response = await apiRequest('POST', `/api/reviews/${id}/approve`, {
          notes: options.notes || 'Approved via CLI',
        }, config);
        
        const data = await response.json();
        
        spinner.succeed(chalk.green('Content approved and queued for delivery'));
        
        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
        }
        
      } catch (error: any) {
        spinner.fail(chalk.red('Approval failed'));
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  /**
   * Approve all pending
   * amoeba review:approve-all
   */
  review
    .command('approve-all')
    .description('Approve all pending reviews')
    .option('--force', 'Skip confirmation')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const config = await getConfig();
        
        // Get pending count
        const pendingRes = await apiRequest('GET', '/api/reviews/pending', {}, config);
        const pendingData = await pendingRes.json();
        
        if (!pendingData.reviews || pendingData.reviews.length === 0) {
          console.log(chalk.green('\n✅ No pending reviews to approve\n'));
          return;
        }
        
        // Confirm unless --force
        if (!options.force) {
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Approve ${pendingData.reviews.length} pending review(s)?`,
              default: false,
            },
          ]);
          
          if (!answers.confirm) {
            console.log(chalk.dim('Cancelled'));
            return;
          }
        }
        
        const spinner = ora(`Approving ${pendingData.reviews.length} review(s)...`).start();
        
        const reviewIds = pendingData.reviews.map((r: any) => r.id);
        const response = await apiRequest('POST', '/api/reviews/bulk/approve', {
          reviewIds,
          notes: 'Bulk approved via CLI',
        }, config);
        
        const data = await response.json();
        
        spinner.succeed(chalk.green(`Approved ${data.approved} item(s). Delivered!`));
        
        if (data.failed > 0) {
          console.log(chalk.yellow(`⚠️  ${data.failed} item(s) failed`));
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
   * Reject review
   * amoeba review:reject <id> <reason>
   */
  review
    .command('reject <id> <reason>')
    .description('Reject content with reason')
    .option('--json', 'Output as JSON')
    .action(async (id: string, reason: string, options) => {
      const spinner = ora(`Rejecting ${id}...`).start();
      
      try {
        const config = await getConfig();
        const response = await apiRequest('POST', `/api/reviews/${id}/reject`, {
          reason,
        }, config);
        
        const data = await response.json();
        
        spinner.succeed(chalk.green('Content rejected'));
        
        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
        }
        
      } catch (error: any) {
        spinner.fail(chalk.red('Rejection failed'));
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  /**
   * Show review statistics
   * amoeba review:stats
   */
  review
    .command('stats')
    .description('Show review queue statistics')
    .option('--days <n>', 'Number of days', '30')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const config = await getConfig();
        const response = await apiRequest('GET', `/api/reviews/stats?days=${options.days}`, {}, config);
        const data = await response.json();
        
        if (options.json) {
          console.log(JSON.stringify(data.stats, null, 2));
          return;
        }
        
        console.log(`\n${chalk.bold('Review Queue Statistics')} (Last ${options.days} days)\n`);
        console.log(`Pending:        ${chalk.yellow(data.stats.totalPending)}`);
        console.log(`Approved:       ${chalk.green(data.stats.totalApproved)}`);
        console.log(`Rejected:       ${chalk.red(data.stats.totalRejected)}`);
        console.log(`Avg Quality:    ${chalk.cyan(data.stats.avgQualityScore)}/100`);
        console.log(`Auto-Approval:  ${chalk.cyan(data.stats.autoApprovalRate)}%`);
        console.log('');
        
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}

