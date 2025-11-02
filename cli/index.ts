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

const program = new Command();

program
  .name('amoeba')
  .description('CLI for Amoeba AI Content Generation Platform')
  .version('1.0.0');

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

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

