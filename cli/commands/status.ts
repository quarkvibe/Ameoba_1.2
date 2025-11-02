import { Command } from 'commander';
import ora from 'ora';
import { api } from '../utils/api';
import { success, error, info, log, outputData, createTable } from '../utils/output';

export function registerStatusCommands(program: Command) {
  program
    .command('status')
    .alias('health')
    .description('Show system health and readiness')
    .action(async () => {
      const spinner = ora('Checking system health...').start();

      try {
        const readiness = await api.getSystemReadiness();
        spinner.stop();

        outputData(readiness, () => {
          // Overall status
          log('');
          log(`${readiness.overallIcon} System Readiness: ${readiness.score}/100`);
          log('');

          // Components
          const table = createTable(['Component', 'Status', 'Message']);
          
          for (const [key, check] of Object.entries(readiness.checks)) {
            const componentName = key.replace(/([A-Z])/g, ' $1').trim();
            table.push([
              componentName.charAt(0).toUpperCase() + componentName.slice(1),
              `${check.icon} ${check.status}`,
              check.message,
            ]);
          }

          console.log(table.toString());
          log('');

          // Blockers
          if (readiness.blockers && readiness.blockers.length > 0) {
            log('🔴 CRITICAL ISSUES:');
            readiness.blockers.forEach((blocker: string) => {
              log(`  ${blocker}`);
            });
            log('');
          }

          // Warnings
          if (readiness.warnings && readiness.warnings.length > 0) {
            log('⚠️  WARNINGS:');
            readiness.warnings.forEach((warning: string) => {
              log(`  ${warning}`);
            });
            log('');
          }

          // Recommendations
          if (readiness.recommendations && readiness.recommendations.length > 0) {
            log('💡 RECOMMENDATIONS:');
            readiness.recommendations.forEach((rec: string) => {
              log(`  ${rec}`);
            });
            log('');
          }
        });

        // Exit with code 1 if critical
        if (readiness.overall === 'critical') {
          process.exit(1);
        }
      } catch (err: any) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  // Stats command
  program
    .command('stats')
    .description('Show usage statistics')
    .action(async () => {
      const spinner = ora('Fetching statistics...').start();

      try {
        const stats = await api.getStats();
        spinner.stop();

        outputData(stats, () => {
          log('');
          log('📊 USAGE STATISTICS');
          log('');
          
          if (stats.totalGenerations !== undefined) {
            log(`  Content Generated: ${stats.totalGenerations}`);
          }
          if (stats.totalCost !== undefined) {
            log(`  Total Cost: $${stats.totalCost.toFixed(2)}`);
          }
          if (stats.successRate !== undefined) {
            log(`  Success Rate: ${stats.successRate}%`);
          }
          if (stats.activeTemplates !== undefined) {
            log(`  Active Templates: ${stats.activeTemplates}`);
          }
          if (stats.scheduledJobs !== undefined) {
            log(`  Scheduled Jobs: ${stats.scheduledJobs}`);
          }
          log('');
        });
      } catch (err: any) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });
}

