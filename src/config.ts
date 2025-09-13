import { readFileSync, existsSync } from 'fs';
import * as path from 'path';

// TypeScript Hint: We define a 'shape' for our configuration object.
// The `mode` can only be one of two specific strings. This is called a union type.
export interface Config {
  mode: 'hook' | 'interactive';
}

// This is our default setting if the config file is missing or invalid.
const defaultConfig: Config = {
  mode: 'hook',
};

export function loadConfig(): Config {
  // --- YOUR TASK (1) ---
  // Find the root of the current Git repository. A common way to do this is
  // to look for a `.git` directory, starting from the current folder and
  // moving up to parent directories. For now, we can simplify and assume
  // the config file is in the current working directory.
  const configPath = path.join(process.cwd(), '.gitfi.conf');

  if (!existsSync(configPath)) {
    console.log('No .gitfi.conf file found, using default settings.');
    return defaultConfig;
  }

  // --- YOUR TASK (2) ---
  // Read the content of the config file using `readFileSync`.
  // Remember to specify the encoding, like 'utf-8'.
  const fileContent = readFileSync(configPath, 'utf-8');

  // --- YOUR TASK (3) ---
  // Parse the file content. We're using a simple `KEY=VALUE` format.
  // Split the content by lines and look for a line that starts with `MODE=`.
  // Extract the value ('hook' or 'interactive').
  // If you find a valid mode, return a new config object with it.
  // Otherwise, return the `defaultConfig`.
  //...
  const lines = fileContent.split('\n');
  for (const line of lines) {
    if (line.startsWith("MODE=")) {
      const value = line.split("=")[1]?.trim();
      if (value === "hook" || value === "interactive") {
        return { mode: value };
      }
    }
  }

  return defaultConfig; // Return default if parsing fails
}
