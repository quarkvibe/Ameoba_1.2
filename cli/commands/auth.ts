import { Command } from 'commander';
import prompts from 'prompts';
import { api } from '../utils/api';
import { success, error, info, outputData, warning } from '../utils/output';
import { updateConfig, getConfig, getConfigValue } from '../utils/config';

export function registerAuthCommands(program: Command) {
  const auth = program.command('auth').description('Authentication commands');

  // Login
  auth
    .command('login')
    .description('Authenticate with Amoeba')
    .option('--api-url <url>', 'API URL')
    .option('--token <token>', 'Login with existing token')
    .action(async (options) => {
      try {
        let apiUrl = options.apiUrl || getConfigValue('apiUrl') || 'http://localhost:5000';
        
        // Save API URL if provided
        if (options.apiUrl) {
          updateConfig('apiUrl', options.apiUrl);
        }

        if (options.token) {
          // Login with token
          updateConfig('auth.token', options.token);
          success('Logged in with token!');
          return;
        }

        // Interactive login
        const response = await prompts([
          {
            type: 'text',
            name: 'apiUrl',
            message: 'API URL:',
            initial: apiUrl,
          },
          {
            type: 'text',
            name: 'username',
            message: 'Username:',
          },
          {
            type: 'password',
            name: 'password',
            message: 'Password:',
          },
        ]);

        if (!response.username || !response.password) {
          error('Login cancelled');
          process.exit(1);
        }

        // Update API URL if changed
        if (response.apiUrl !== apiUrl) {
          updateConfig('apiUrl', response.apiUrl);
          // Recreate API client with new URL
          process.env.AMOEBA_API_URL = response.apiUrl;
        }

        // Login
        const result = await api.login(response.username, response.password);
        
        // Save credentials
        updateConfig('auth.token', result.token);
        updateConfig('auth.userId', result.userId);

        success('Logged in successfully!');
        info(`User ID: ${result.userId}`);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  // Logout
  auth
    .command('logout')
    .description('Clear authentication')
    .action(async () => {
      try {
        updateConfig('auth.token', undefined);
        updateConfig('auth.userId', undefined);
        success('Logged out successfully');
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  // Who am I
  auth
    .command('whoami')
    .description('Show current user')
    .action(async () => {
      try {
        const user = await api.whoami();
        
        outputData(user, () => {
          info('Current User:');
          console.log(`  ID: ${user.id}`);
          console.log(`  Username: ${user.username}`);
          if (user.email) console.log(`  Email: ${user.email}`);
        });
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  // Status
  auth
    .command('status')
    .description('Check authentication status')
    .action(async () => {
      const config = getConfig();
      
      if (!config.auth?.token) {
        warning('Not logged in');
        info('Run: amoeba auth login');
        process.exit(1);
      }

      try {
        const user = await api.whoami();
        success('Authenticated');
        info(`User: ${user.username || user.id}`);
      } catch (err: any) {
        error('Invalid or expired token');
        info('Run: amoeba auth login');
        process.exit(1);
      }
    });
}

