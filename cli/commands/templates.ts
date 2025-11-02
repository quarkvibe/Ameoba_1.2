import { Command } from 'commander';
import ora from 'ora';
import prompts from 'prompts';
import fs from 'fs';
import { api } from '../utils/api';
import { success, error, info, log, outputData, createTable, truncate } from '../utils/output';

export function registerTemplateCommands(program: Command) {
  const templates = program.command('templates').alias('tpl').description('Manage content templates');

  // List templates
  templates
    .command('list')
    .description('List all templates')
    .option('--category <category>', 'Filter by category')
    .action(async (options) => {
      const spinner = ora('Fetching templates...').start();

      try {
        let templateList = await api.listTemplates();
        spinner.stop();

        if (options.category) {
          templateList = templateList.filter((t: any) => t.category === options.category);
        }

        if (templateList.length === 0) {
          info('No templates found');
          info('Create one with: amoeba templates create');
          return;
        }

        outputData(templateList, () => {
          const table = createTable(['ID', 'Name', 'Category', 'Active', 'Used']);
          
          templateList.forEach((tpl: any) => {
            table.push([
              tpl.id.substring(0, 8),
              truncate(tpl.name, 30),
              tpl.category || '-',
              tpl.isActive ? '✓' : '✗',
              `${tpl.usageCount || 0} times`,
            ]);
          });

          console.log(table.toString());
          log('');
          log(`Total: ${templateList.length} templates`);
        });
      } catch (err: any) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  // Show template
  templates
    .command('show <id>')
    .description('Show template details')
    .action(async (id) => {
      const spinner = ora('Fetching template...').start();

      try {
        const template = await api.getTemplate(id);
        spinner.stop();

        outputData(template, () => {
          log('');
          log(`📝 ${template.name}`);
          log('');
          log(`  ID: ${template.id}`);
          log(`  Category: ${template.category || 'None'}`);
          log(`  Status: ${template.isActive ? '✓ Active' : '✗ Inactive'}`);
          log(`  Format: ${template.outputFormat || 'text'}`);
          log(`  Used: ${template.usageCount || 0} times`);
          if (template.lastUsed) {
            log(`  Last Used: ${new Date(template.lastUsed).toLocaleString()}`);
          }
          log('');
          
          if (template.description) {
            log(`  Description: ${template.description}`);
            log('');
          }

          log('  Prompt:');
          log(`  ${template.aiPrompt}`);
          log('');

          if (template.variables && template.variables.length > 0) {
            log(`  Variables: ${template.variables.join(', ')}`);
            log('');
          }
        });
      } catch (err: any) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  // Create template
  templates
    .command('create')
    .description('Create new template')
    .option('--from-file <file>', 'Create from JSON file')
    .action(async (options) => {
      try {
        let data: any;

        if (options.fromFile) {
          // Read from file
          const content = fs.readFileSync(options.fromFile, 'utf-8');
          data = JSON.parse(content);
        } else {
          // Interactive prompts
          const response = await prompts([
            {
              type: 'text',
              name: 'name',
              message: 'Template name:',
              validate: (value: string) => value.length > 0 || 'Name is required',
            },
            {
              type: 'text',
              name: 'description',
              message: 'Description (optional):',
            },
            {
              type: 'select',
              name: 'category',
              message: 'Category:',
              choices: [
                { title: 'Blog Posts', value: 'blog' },
                { title: 'Email', value: 'email' },
                { title: 'Social Media', value: 'social' },
                { title: 'Reports', value: 'reports' },
                { title: 'Custom', value: 'custom' },
              ],
            },
            {
              type: 'text',
              name: 'aiPrompt',
              message: 'AI prompt (use {{variable}} for variables):',
              validate: (value: string) => value.length > 0 || 'Prompt is required',
            },
            {
              type: 'text',
              name: 'variables',
              message: 'Variables (comma-separated, optional):',
            },
            {
              type: 'select',
              name: 'outputFormat',
              message: 'Output format:',
              choices: [
                { title: 'Text', value: 'text' },
                { title: 'Markdown', value: 'markdown' },
                { title: 'HTML', value: 'html' },
                { title: 'JSON', value: 'json' },
              ],
            },
          ]);

          if (!response.name || !response.aiPrompt) {
            error('Template creation cancelled');
            process.exit(1);
          }

          data = {
            name: response.name,
            description: response.description || undefined,
            category: response.category,
            aiPrompt: response.aiPrompt,
            outputFormat: response.outputFormat,
            variables: response.variables ? response.variables.split(',').map((v: string) => v.trim()) : [],
            isActive: true,
          };
        }

        const spinner = ora('Creating template...').start();
        const template = await api.createTemplate(data);
        spinner.stop();

        success('Template created!');
        info(`ID: ${template.id}`);
        info(`Name: ${template.name}`);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  // Delete template
  templates
    .command('delete <id>')
    .description('Delete template')
    .option('--yes', 'Skip confirmation')
    .action(async (id, options) => {
      try {
        if (!options.yes) {
          const response = await prompts({
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to delete this template?',
            initial: false,
          });

          if (!response.confirm) {
            info('Cancelled');
            return;
          }
        }

        const spinner = ora('Deleting template...').start();
        await api.deleteTemplate(id);
        spinner.stop();

        success('Template deleted');
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  // Export template
  templates
    .command('export <id>')
    .description('Export template to JSON')
    .option('--output <file>', 'Output file')
    .action(async (id, options) => {
      const spinner = ora('Exporting template...').start();

      try {
        const template = await api.getTemplate(id);
        spinner.stop();

        const json = JSON.stringify(template, null, 2);

        if (options.output) {
          fs.writeFileSync(options.output, json, 'utf-8');
          success(`Template exported to ${options.output}`);
        } else {
          console.log(json);
        }
      } catch (err: any) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });
}

