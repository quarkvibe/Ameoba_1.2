import { Command } from 'commander';
import ora from 'ora';
import { api } from '../utils/api';
import { success, error, info, log, outputData, createTable } from '../utils/output';

export function registerContentCommands(program: Command) {
  const content = program.command('content').description('Manage generated content');

  // List content
  content
    .command('list')
    .description('List generated content')
    .option('--limit <n>', 'Number of items', '50')
    .action(async (options) => {
      const spinner = ora('Fetching content...').start();

      try {
        const contentList = await api.listContent(parseInt(options.limit));
        spinner.stop();

        if (contentList.length === 0) {
          info('No content found');
          return;
        }

        outputData(contentList, () => {
          const table = createTable(['ID', 'Template', 'Generated', 'Length']);
          
          contentList.forEach((item: any) => {
            table.push([
              item.id.substring(0, 8),
              item.templateName || item.templateId?.substring(0, 8) || '-',
              new Date(item.generatedAt || item.createdAt).toLocaleString(),
              `${item.content?.length || 0} chars`,
            ]);
          });

          console.log(table.toString());
          log('');
          log(`Total: ${contentList.length} items`);
        });
      } catch (err: any) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });
}

