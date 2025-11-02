import { Command } from 'commander';
import ora from 'ora';
import { api } from '../utils/api';
import { success, error, info, log, outputData, createTable } from '../utils/output';

export function registerJobCommands(program: Command) {
  const jobs = program.command('jobs').description('Manage scheduled jobs');

  // List jobs
  jobs
    .command('list')
    .description('List all scheduled jobs')
    .option('--active', 'Show only active jobs')
    .action(async (options) => {
      const spinner = ora('Fetching jobs...').start();

      try {
        let jobsList = await api.listJobs();
        spinner.stop();

        if (options.active) {
          jobsList = jobsList.filter((j: any) => j.isActive);
        }

        if (jobsList.length === 0) {
          info('No jobs found');
          return;
        }

        outputData(jobsList, () => {
          const table = createTable(['ID', 'Name', 'Schedule', 'Active', 'Last Status']);
          
          jobsList.forEach((job: any) => {
            table.push([
              job.id.substring(0, 8),
              job.name,
              job.cronExpression,
              job.isActive ? '✓' : '✗',
              job.lastStatus || 'Never run',
            ]);
          });

          console.log(table.toString());
          log('');
          log(`Total: ${jobsList.length} jobs`);
        });
      } catch (err: any) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  // Run job
  jobs
    .command('run <id>')
    .description('Trigger job manually')
    .action(async (id) => {
      const spinner = ora('Running job...').start();

      try {
        const result = await api.runJob(id);
        spinner.stop();

        success('Job triggered!');
        if (result.message) {
          info(result.message);
        }
      } catch (err: any) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });
}





