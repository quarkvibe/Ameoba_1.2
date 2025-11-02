#!/usr/bin/env node
import { Command } from 'commander';
import { registerAuthCommands } from './commands/auth';
import { registerTemplateCommands } from './commands/templates';
import { registerGenerateCommands } from './commands/generate';
import { registerJobCommands } from './commands/jobs';
import { registerStatusCommands } from './commands/status';
import { registerCredentialCommands } from './commands/credentials';
import { registerContentCommands } from './commands/content';
import { registerConfigCommands } from './commands/config';
import { registerDatabaseCommands } from './commands/database';
import { registerEnvironmentCommands } from './commands/environment';
import { registerReviewCommands } from './commands/review';
import { registerSMSCommandsManagement } from './commands/smsCommands';
import { registerDeploymentCommands } from './commands/deployment';

const program = new Command();

program
  .name('amoeba')
  .description('Amoeba AI Platform - Professional CLI (First-Class Interface)')
  .version('1.0.0')
  .addHelpText('after', `
Examples:
  $ amoeba status                    # System health
  $ amoeba generate newsletter       # Generate content
  $ amoeba database:switch sqlite    # Switch to SQLite
  $ amoeba env:set OPENAI_API_KEY sk-... # Configure AI
  $ amoeba review:approve-all        # Approve pending
  $ amoeba deployment:analyze        # Check deployment
  $ amoeba test                      # Run system tests
  
Full parity with Dashboard UI - choose your interface!
Documentation: https://github.com/quarkvibe/Ameoba_1.2
`);

// Global options
program
  .option('--json', 'Output as JSON')
  .option('--quiet', 'Suppress non-essential output')
  .option('--verbose', 'Show detailed information')
  .option('--no-color', 'Disable colors')
  .option('--api-url <url>', 'Override API URL');

// Register command groups
registerAuthCommands(program);
registerTemplateCommands(program);
registerGenerateCommands(program);
registerJobCommands(program);
registerStatusCommands(program);
registerCredentialCommands(program);
registerContentCommands(program);
registerConfigCommands(program);

// New command groups (full UI parity)
registerDatabaseCommands(program);
registerEnvironmentCommands(program);
registerReviewCommands(program);
registerSMSCommandsManagement(program);
registerDeploymentCommands(program);

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

