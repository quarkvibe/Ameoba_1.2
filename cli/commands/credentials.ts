import { Command } from 'commander';
import ora from 'ora';
import prompts from 'prompts';
import { api } from '../utils/api';
import { success, error, info, log, outputData, createTable } from '../utils/output';

export function registerCredentialCommands(program: Command) {
  const creds = program.command('credentials').alias('creds').description('Manage credentials');

  // AI Credentials
  const ai = creds.command('ai').description('Manage AI credentials');

  ai.command('list')
    .description('List AI credentials')
    .action(async () => {
      const spinner = ora('Fetching AI credentials...').start();

      try {
        const credentials = await api.listAICredentials();
        spinner.stop();

        if (credentials.length === 0) {
          info('No AI credentials found');
          info('Add one with: amoeba creds ai add');
          return;
        }

        outputData(credentials, () => {
          const table = createTable(['ID', 'Name', 'Provider', 'Active', 'Default']);
          
          credentials.forEach((cred: any) => {
            table.push([
              cred.id.substring(0, 8),
              cred.name,
              cred.provider,
              cred.isActive ? '✓' : '✗',
              cred.isDefault ? '✓' : '✗',
            ]);
          });

          console.log(table.toString());
          log('');
          log(`Total: ${credentials.length} credentials`);
        });
      } catch (err: any) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  ai.command('add')
    .description('Add AI credential')
    .action(async () => {
      try {
        const response = await prompts([
          {
            type: 'select',
            name: 'provider',
            message: 'AI Provider:',
            choices: [
              { title: 'OpenAI', value: 'openai' },
              { title: 'Anthropic', value: 'anthropic' },
              { title: 'Cohere', value: 'cohere' },
              { title: 'Google AI', value: 'google' },
              { title: 'Other', value: 'other' },
            ],
          },
          {
            type: 'text',
            name: 'name',
            message: 'Credential name:',
            validate: (value: string) => value.length > 0 || 'Name is required',
          },
          {
            type: 'password',
            name: 'apiKey',
            message: 'API Key:',
            validate: (value: string) => value.length > 0 || 'API key is required',
          },
          {
            type: 'confirm',
            name: 'isDefault',
            message: 'Set as default?',
            initial: false,
          },
        ]);

        if (!response.provider || !response.name || !response.apiKey) {
          error('Cancelled');
          process.exit(1);
        }

        const spinner = ora('Adding credential...').start();
        const credential = await api.createAICredential({
          provider: response.provider,
          name: response.name,
          apiKey: response.apiKey,
          isDefault: response.isDefault,
          isActive: true,
        });
        spinner.stop();

        success('AI credential added!');
        info(`ID: ${credential.id}`);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  // Email Credentials
  const email = creds.command('email').description('Manage email credentials');

  email.command('list')
    .description('List email credentials')
    .action(async () => {
      const spinner = ora('Fetching email credentials...').start();

      try {
        const credentials = await api.listEmailCredentials();
        spinner.stop();

        if (credentials.length === 0) {
          info('No email credentials found');
          info('Add one with: amoeba creds email add');
          return;
        }

        outputData(credentials, () => {
          const table = createTable(['ID', 'Name', 'Provider', 'Active', 'Default']);
          
          credentials.forEach((cred: any) => {
            table.push([
              cred.id.substring(0, 8),
              cred.name,
              cred.provider,
              cred.isActive ? '✓' : '✗',
              cred.isDefault ? '✓' : '✗',
            ]);
          });

          console.log(table.toString());
          log('');
          log(`Total: ${credentials.length} credentials`);
        });
      } catch (err: any) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });
}





