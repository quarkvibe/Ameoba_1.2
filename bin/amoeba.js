#!/usr/bin/env node

// Entry point for the CLI
// This runs the compiled TypeScript from dist/cli/index.js

const path = require('path');

// Check if running from built dist or source
const distPath = path.join(__dirname, '../dist/cli/index.js');
const sourcePath = path.join(__dirname, '../cli/index.ts');

const fs = require('fs');

if (fs.existsSync(distPath)) {
  // Production: use compiled version
  require(distPath);
} else {
  // Development: use ts-node
  try {
    require('ts-node/register');
    require(sourcePath);
  } catch (error) {
    console.error('Error: ts-node is required for development');
    console.error('Run: npm install -g ts-node');
    console.error('Or build the project: npm run build:cli');
    process.exit(1);
  }
}




