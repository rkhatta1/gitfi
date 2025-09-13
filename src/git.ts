import { execSync } from 'child_process';

/**
 * Executes the `git diff --staged` command and returns its output.
 * @returns The diff text as a string.
 */
export function getStagedDiff(): string {
  // TypeScript Hint: The ': string' after the function name is a return type annotation.
  // It guarantees that this function will always return a string.
  const command = "git diff --staged";
  // --- YOUR CODE HERE (5) ---
  // Use 'execSync' to run the git command. The command you want is 'git diff --staged'.
  try {
    const diff = execSync(command).toString();
    return diff;
  } catch (error) {
    console.warn("Warning: git diff --staged failed. Probably the first commit for this tree.");
    return execSync("git diff --cached 4b825dc642cb6eb9a060e54bf8d69288fbee4904").toString();
  }
}
