#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import { writeFileSync } from 'fs';
import chalk from 'chalk';
import { getStagedDiff } from './git.js';
import { generateMessageFromDiff } from './ai.js';
import { loadConfig, Config } from './config.js';

const program = new Command();
const config = loadConfig();

// We check the config file to decide which command to set up.
if (config.mode === 'hook') {
  program
    .command('hook <file>')
    .description('Runs in hook mode to generate a commit message for a file.')
    .action(async (file: string) => {
      try {
        // This logic is for the hook workflow. It runs quietly in the background.
        
        // --- YOUR TASK (4) ---
        // Call your getStagedDiff function to get the changes.
        const diff = getStagedDiff();

        if (!diff.trim()) {
          writeFileSync(file, 'chore: no changes staged');
          return;
        }

        // --- YOUR TASK (5) ---
        // Call the generateMessageFromDiff function. Use 'await'.
        const commitMessage = await generateMessageFromDiff(diff)

        // --- YOUR TASK (6) ---
        // Write the generated message to the file provided by the hook.
        writeFileSync(file, commitMessage);

      } catch (error) {
        // In hook mode, we don't want flashy errors, but we need to log them.
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        // We write an error into the commit message file itself so the user knows
        // that automation failed.
        const errorForCommitFile = `# GITFI ERROR: Could not generate commit message.\n# ${errorMessage}\n`;
        writeFileSync(file, errorForCommitFile);
        process.exit(1);
      }
    });
} else {
  // We will add the 'interactive' mode logic here in the next step.
  console.log('Interactive mode coming soon!');
}

program.parse(process.argv);
