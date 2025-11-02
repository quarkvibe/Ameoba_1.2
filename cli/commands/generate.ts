import { Command } from 'commander';
import ora from 'ora';
import fs from 'fs';
import { api } from '../utils/api';
import { success, error, info, log, outputData, formatCurrency } from '../utils/output';

export function registerGenerateCommands(program: Command) {
  const generate = program.command('generate').alias('gen').description('Generate content');

  // Generate from template
  generate
    .command('run <templateId>')
    .description('Generate content from template')
    .option('--data <json>', 'Variables as JSON')
    .option('--data-file <file>', 'Variables from JSON file')
    .action(async (templateId, options) => {
      const spinner = ora('Generating content...').start();

      try {
        let data: any = {};

        if (options.data) {
          data = JSON.parse(options.data);
        } else if (options.dataFile) {
          const content = fs.readFileSync(options.dataFile, 'utf-8');
          data = JSON.parse(content);
        }

        const result = await api.generateContent(templateId, data);
        spinner.stop();

        outputData(result, () => {
          success('Content generated!');
          log('');
          
          if (result.templateName) {
            log(`Template: ${result.templateName}`);
          }
          if (result.contentId) {
            log(`Content ID: ${result.contentId}`);
          }
          if (result.tokens) {
            log(`Tokens: ${result.tokens}`);
          }
          if (result.cost) {
            log(`Cost: ${formatCurrency(result.cost)}`);
          }
          
          log('');
          log('Preview:');
          log('━'.repeat(50));
          
          if (result.content) {
            const preview = result.content.substring(0, 500);
            log(preview);
            if (result.content.length > 500) {
              log('...');
              info(`Full content: ${result.content.length} characters`);
            }
          }
          
          log('━'.repeat(50));
          log('');
        });
      } catch (err: any) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  // Batch generate
  generate
    .command('batch <file>')
    .description('Batch generate from JSON file')
    .option('--parallel <n>', 'Number of parallel requests', '3')
    .action(async (file, options) => {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const batch = JSON.parse(content);

        if (!Array.isArray(batch)) {
          error('Batch file must contain an array of generation requests');
          process.exit(1);
        }

        log(`Processing ${batch.length} generations...`);
        log('');

        const results = [];
        let completed = 0;
        let failed = 0;
        let totalCost = 0;

        for (const item of batch) {
          const spinner = ora(`Generating ${completed + 1}/${batch.length}...`).start();

          try {
            const result = await api.generateContent(item.templateId, item.data);
            results.push(result);
            completed++;
            
            if (result.cost) {
              totalCost += result.cost;
            }

            spinner.succeed(`✓ ${completed}/${batch.length} completed`);
          } catch (err: any) {
            failed++;
            spinner.fail(`✗ ${completed + failed}/${batch.length} failed: ${err.message}`);
          }
        }

        log('');
        success(`Batch complete! ${completed} succeeded, ${failed} failed`);
        if (totalCost > 0) {
          log(`Total cost: ${formatCurrency(totalCost)}`);
        }
        log('');

        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
        }
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });
}





