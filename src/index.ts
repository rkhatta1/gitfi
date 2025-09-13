#!/usr/bin/env node

import dotenv from 'dotenv';
import { Command } from 'commander';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { tmpdir } from 'os';
import { join } from 'path';
import { getStagedDiff } from './git.js';
import { generateMessageFromDiff } from './ai.js';
import { loadConfig, findGitRoot } from './config.js';

const gitRoot = findGitRoot();
if (gitRoot) {
  const envPath = join(gitRoot, '.env');
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const program = new Command();

program
    .command('commit')
    .alias('c')
    .description('Runs in hook mode to generate a commit message for a file.')
    .action(async () => {
      try {
        console.log(chalk.yellow('Fetching staged changes...'));
        const diff = getStagedDiff();

        if (!diff.trim()) {
          console.log(chalk.blue('No staged changes to commit.'));
          return;
        }
        
        console.log(chalk.yellow('Generating commit message... 🤖'));
        const commitMessage = await generateMessageFromDiff(diff)
        
        console.log(chalk.green('✓ Committing with AI message:'));
        console.log(chalk.gray('---------------------------------'));
        console.log(commitMessage);
        console.log(chalk.gray('---------------------------------'));
        
        execSync(`git commit -m " ${commitMessage}"`, { stdio: 'inherit' });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error(chalk.red(`\nError: ${errorMessage}`));
        process.exit(1);
      }
  });

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

        console.log(chalk.green('\n✓ AI-generated commit message:'));
        console.log(chalk.gray('---------------------------------'));
        console.log(commitMessage);
        console.log(chalk.gray('---------------------------------'));

        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [ 
              { name: 'Commit', value: 'commit' },
              { name: 'Edit', value: 'edit' },
              new inquirer.Separator(),
              { name: 'Cancel', value: 'cancel' },
            ],
          },
        ]);

        switch (action) {
          case "commit":
            execSync(`git commit -m "${commitMessage}" --no-verify`, { stdio: 'inherit' });
            console.log(chalk.green('✓ Changes committed successfully!'));
            break;
          case "edit":
            const tempFilepath = join(tmpdir(), `gitfi-commit-msg.txt`);
            writeFileSync(tempFilepath, commitMessage);
            
            console.log(chalk.yellow('Save and Close the file to commit with the edited commit message.'))
            try {
              execSync(`git commit --template ${tempFilepath}`, { stdio: 'inherit' });
            } finally {
              unlinkSync(tempFilepath);
            }
            console.log(chalk.green('✓ Changes committed successfully!'));
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
  });

program.parse(process.argv);
