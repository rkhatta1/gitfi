import { execSync } from 'child_process';

/**
 * Executes the `git diff --staged` command and returns its output.
 * @returns The diff text as a string.
 */
export function getStagedDiff(): string {
  const command = "git diff --staged";

  try {
    const diff = execSync(command).toString();
    return diff;
  } catch (error) {
    console.warn("Warning: git diff --staged failed. Probably the first commit for this tree.");
    return execSync("git diff --cached 4b825dc642cb6eb9a060e54bf8d69288fbee4904").toString();
  }
}
