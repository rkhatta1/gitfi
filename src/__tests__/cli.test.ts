import { describe, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { execSync, spawn } from 'child_process';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

const setupTestRepo = () => {
  const repoDir = join(process.cwd(), 'temp-test-repo');
  rmSync(repoDir, { recursive: true, force: true });
  mkdirSync(repoDir, { recursive: true });
  const run = (command: string) => execSync(command, { cwd: repoDir, stdio: 'pipe' });
  run('git init');
  run('git config user.name "Test User"');
  run('git config user.email "test@example.com"');
  run('touch initial.txt && git add . && git commit -m "Initial commit"');
  return { repoDir, run };
};

describe('gitfi CLI end-to-end tests', () => {
  const cliPath = join(process.cwd(), 'dist', 'index.js');

  beforeEach(() => {
    process.env.VITEST_MOCK_AI = 'true';
  });

  afterEach(() => {
    delete process.env.VITEST_MOCK_AI;
  });

  test('should create a commit directly using the "c" command', () => {
    const { repoDir, run } = setupTestRepo();
    writeFileSync(join(repoDir, 'test.txt'), 'hello world');
    run('git add .');
    const output = execSync(`node ${cliPath} c`, { cwd: repoDir }).toString();
    const log = run('git log --oneline').toString();
    expect(log).toContain('test: create a new feature');
    expect(output).toContain('Committing with AI message:');
  });

  test('should create a commit when user selects "Commit" in interactive mode', async () => {
    const { repoDir, run } = setupTestRepo();
    writeFileSync(join(repoDir, 'test.txt'), 'hello again');
    run('git add .');

    const child = spawn('node', [cliPath, 'g'], { cwd: repoDir });

    const testPromise = new Promise((resolve) => {
        child.stdout.on('data', (data) => {
            if (data.toString().includes('What would you like to do?')) {
                child.stdin.write('\n'); // Press Enter
            }
        });
        child.on('close', resolve);
    });

    await testPromise;

    const log = run('git log --oneline').toString();
    expect(log).toContain('test: create a new feature');
  });

  test('should not create a commit when user selects "Cancel"', async () => {
    const { repoDir, run } = setupTestRepo();
    writeFileSync(join(repoDir, 'test.txt'), 'hello cancel');
    run('git add .');
    const initialCommitCount = run('git rev-list --count HEAD').toString().trim();

    const child = spawn('node', [cliPath, 'g'], { cwd: repoDir });

    let output = '';
    const testPromise = new Promise((resolve) => {
        child.stdout.on('data', (data) => {
          const text = data.toString();
          output += text;
          if (text.includes('What would you like to do?')) {
            child.stdin.write('\u001b[B'); // Down
            child.stdin.write('\u001b[B'); // Down
            child.stdin.write('\n');     // Enter
          }
        });
        child.on('close', resolve);
    });

    await testPromise;

    const finalCommitCount = run('git rev-list --count HEAD').toString().trim();
    expect(finalCommitCount).toBe(initialCommitCount);
    expect(output).toContain('Cancelled commit.');
  });
});
