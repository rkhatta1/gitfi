#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import { writeFileSync } from 'fs';
import { execSync } from 'child_process';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { getStagedDiff } from './git.js';
import { generateMessageFromDiff } from './ai.js';
import { loadConfig, Config } from './config.js';

const program = new Command();
const config = loadConfig();

if (config.mode === 'hook') {
  program
    .command('hook <file>')
    .description('Runs in hook mode to generate a commit message for a file.')
    .action(async (file: string) => {
      try {
        const diff = getStagedDiff();

        if (!diff.trim()) {
          writeFileSync(file, 'chore: no changes staged');
          return;
        }
        const commitMessage = await generateMessageFromDiff(diff)
        writeFileSync(file, commitMessage);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        const errorForCommitFile = `# GITFI ERROR: Could not generate commit message.\n# ${errorMessage}\n`;
        writeFileSync(file, errorForCommitFile);
        process.exit(1);
      }
    });
} else {
  program
    .command('gen')
    .alias('g')
    .description('Generate a commit message interactively, straight in the terminal.')
    .action(async () => {
      try {
        console.log(chalk.yellow('Fetching staged changes... ⌛️')); 
        const diff = getStagedDiff();

        if(!diff.trim()) {
          console.log(chalk.blue('No staged changes to commit.'));
          return;
        }

        console.log(chalk.yellow('Sending diff to AI for generating the commit message... 🤖'))
        const commitMessage = await generateMessageFromDiff(diff);

        console.log(chalk.green('✓ AI-generated commit message:'));
        console.log(chalk.gray('---------------------------------'));
        console.log(commitMessage);
        console.log(chalk.gray('---------------------------------'));

        const { action } = await inquirer.prompt([
          {
            type: 'list', // This gives the user a list of choices
            name: 'action', // The key for the answer in the result object
            message: 'What would you like to do?',
            choices: [ // The options for the user
              { name: 'Commit', value: 'commit' },
              { name: 'Edit', value: 'edit' },
              new inquirer.Separator(), // This is just a visual line
              { name: 'Cancel', value: 'cancel' },
            ],
          },
        ]);

        switch (action) {
          case "commit":
            execSync(`git commit -m "${commitMessage}"`);
            console.log(chalk.green('✓ Changes committed successfully!'));
            break;
          case "edit":
            console.log(chalk.blue('Yet to implement.'));
            break;
          case "cancel":
            console.log(chalk.red('Cancelled commit.'));
            break;

          default:
            break;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error(chalk.red(`Error: ${errorMessage}`));
        process.exit(1);
      }
    })
}

program.parse(process.argv);
