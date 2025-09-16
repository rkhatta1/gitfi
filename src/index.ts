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

function getManualTime(): number {
  const T_BASE = 15;
  try {
    const diffStats = execSync('git diff --shortstat HEAD').toString();
    const filesChanged = Number(diffStats.match(/(\d+) file/)?.[1] || 0);
    const linesAdded = Number(diffStats.match(/(\d+) insertion/)?.[1] || 0);
    const linesDeleted = Number(diffStats.match(/(\d+) deletion/)?.[1] || 0);
    const totalLines = linesAdded + linesDeleted;
    const hunks = execSync('git diff --shortstat HEAD').toString().split('\n').length;
    const tCognitive = (totalLines * 0.2) + (filesChanged * 5) + (hunks * 2);
    console.log(chalk.blue(`\nTotal Lines: ${totalLines}\nFiles Changed: ${filesChanged}\nHunks: ${hunks}\n`));
    
    return T_BASE + tCognitive;
  } catch (error) {
    console.warn('Could not calculate diff for manual time, using base time only.');
    return T_BASE;
  }
}

const gitRoot = findGitRoot();
if (gitRoot) {
  const envPath = join(gitRoot, '.env');
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const program = new Command();

program
  .name('gitfi')
  .description('An AI powered CLI to automate/generate Git commit messages.')
  .option('-m, --metric', 'Include performance metrics in the commit messages.')

program
    .command('commit')
    .alias('c')
    .description('Runs in hook mode to generate a commit message for a file.')
    .action(async () => {
      const startTime = Date.now();
      const options = program.opts();

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
        
        let finalCommitMessage = commitMessage;
        
        if (options.metric) {
          const endTime = Date.now();
          const gitfiTime = ((endTime - startTime) / 1000) + 2.5;
          const manualTime = getManualTime();
          finalCommitMessage += `\n\n---\ngitfi-benchmark:\ncommand: gitfi c -m\nmanual_time: ${manualTime.toFixed(2)}\ngitfi_time: ${gitfiTime.toFixed(2)}\n---`;
        }
        execSync(`git commit -m " ${finalCommitMessage}"`, { stdio: 'inherit' });
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
      const startTime = Date.now();
      const options = program.opts();

      try {
        console.log(chalk.yellow('Fetching staged changes... ⌛️')); 
        const diff = getStagedDiff();

        if(!diff.trim()) {
          console.log(chalk.blue('No staged changes to commit.'));
          return;
        }

        const manualTime = options.metric ? getManualTime() : 0;

        console.log(chalk.yellow('Sending diff to AI for generating the commit message... 🤖'))
        const initialCommitMessage = await generateMessageFromDiff(diff);

        console.log(chalk.green('\n✓ AI-generated commit message:'));
        console.log(chalk.gray('---------------------------------'));
        console.log(initialCommitMessage);
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

        if (action === 'cancel') {
          console.log(chalk.red('Cancelled commit.'));
          return;
        }
      
        // Perform the initial commit
        if (action === 'commit') {
          execSync(`git commit -m "${initialCommitMessage}"`, { stdio: 'inherit' });
          console.log(chalk.green('✓ Changes committed successfully!'));
        } else if (action === 'edit') {
          const tempFilePath = join(tmpdir(), `gitfi-commit-msg.txt`);
          writeFileSync(tempFilePath, initialCommitMessage);
          try {
            execSync(`git commit --template ${tempFilePath}`, { stdio: 'inherit' });
          } finally {
            unlinkSync(tempFilePath);
            console.log(chalk.green('✓ Changes committed successfully!'));
          }
        }

        if (options.metric) {
          console.log(chalk.yellow('\nAmending commit to add performance metrics...'));
        
          const commitTimestamp = execSync('git log -1 --pretty=%ct').toString().trim();
          const endTime = Number(commitTimestamp) * 1000;

          const gitfiTime = ((endTime - startTime) / 1000) + 2.5;
        
          const originalMessage = execSync('git log -1 --pretty=%B').toString();

          const finalCommitMessageWithMetrics = `${originalMessage.trim()}\n\n---\ngitfi-benchmark:\ncommand: gitfi g -m\nmanual_time: ${manualTime.toFixed(2)}\ngitfi_time: ${gitfiTime.toFixed(2)}\n---`;

        execSync(`git commit --amend -m "${finalCommitMessageWithMetrics}"`);
        console.log(chalk.green('✓ Metrics added successfully!'));
        console.log(chalk.yellow(`Start Time: ${startTime}\nEnd Time: ${endTime}\nGitfi Time: ${gitfiTime}`));
        
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error(chalk.red(`Error: ${errorMessage}`));
        process.exit(1);
      }
  });

program
  .command('report')
  .description('View a report of time saved by using gitfi.')
  .action(() => {
    try {
      console.log(chalk.yellow('Scanning Git history for benchmark data...'));

      const logOutput = execSync('git log --pretty=%B').toString();
      
      const benchmarkRegex = /gitfi-benchmark:.*?command: (.*?)\n\s+manual_time: ([\d.]+)\n\s+gitfi_time: ([\d.]+)/gs;
      
      let match;
      const benchmarks = [];
      while ((match = benchmarkRegex.exec(logOutput)) !== null) {
        benchmarks.push({
          command: match[1],
          manual_time: parseFloat(match[2]),
          gitfi_time: parseFloat(match[3]),
        });
      }

      if (benchmarks.length === 0) {
        console.log(chalk.blue('\nNo benchmark data found.'));
        console.log(`Try running 'gitfi commit --metric' or 'gitfi gen --metric' to collect data.`);
        return;
      }

      const totalManualTime = benchmarks.reduce((sum, b) => sum + b.manual_time, 0);
      const totalGitfiTime = benchmarks.reduce((sum, b) => sum + b.gitfi_time, 0);
      const totalTimeSaved = totalManualTime - totalGitfiTime;
      const averageTimeSaved = totalTimeSaved / benchmarks.length;

      console.log(chalk.green('\n--- gitfi Performance Report ---'));
      console.log(`\nBased on ${chalk.bold(benchmarks.length)} tracked commits:\n`);
      
      console.log(`Total Estimated Manual Time: ${chalk.yellow(totalManualTime.toFixed(2))} seconds`);
      console.log(`Total Time with gitfi:       ${chalk.yellow(totalGitfiTime.toFixed(2))} seconds`);
      
      console.log(chalk.green(`\nTotal Time Saved: ${chalk.bold.green(totalTimeSaved.toFixed(2))} seconds`));
      console.log(`Average Time Saved per Commit: ${chalk.bold.green(averageTimeSaved.toFixed(2))} seconds`);
      console.log(chalk.gray('\n----------------------------------'));

    } catch (error) {
      console.error(chalk.red(`Error generating report: ${error instanceof Error ? error.message : 'Unknown error'      }`));
      process.exit(1);
    }
  });

program.parse(process.argv);
