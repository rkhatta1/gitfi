import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

export interface Config {
  apiKey?: string;
}

/**
 * Searches upwards from the current directory to find the root of the Git repository.
 * @returns The path to the Git root, or null if not found.
 */
export function findGitRoot(): string | null {
  let currentPath = process.cwd();
  while (currentPath !== dirname(currentPath)) {
    if (existsSync(join(currentPath, '.git'))) {
      return currentPath;
    }
    currentPath = dirname(currentPath);
  }
  return null;
}

/**
 * Parses a config file's content for an API key.
 * @param content The string content of the .gitfi.conf file.
 * @returns A partial Config object.
 */
function parseConfigFile(content: string): Partial<Config> {
  const config: Partial<Config> = {};
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.startsWith('API_KEY=')) {
      const value = line.split('=')[1]?.trim();
      if (value) {
        config.apiKey = value;
      }
    }
  }
  return config;
}

export function loadConfig(): Config {
  const gitRoot = findGitRoot();

  // Determine platform-specific global config file path
  const globalConfigDir = process.platform === 'darwin' 
    ? join(homedir(), 'Library', 'Preferences', 'gitfi') // macOS path
    : join(homedir(), '.config', 'gitfi'); // Linux/default path
  
  const globalConfigPath = join(globalConfigDir, '.gitfi.conf');
  const localConfigPath = gitRoot ? join(gitRoot, '.gitfi.conf') : null;

  let globalConfig: Partial<Config> = {};
  if (existsSync(globalConfigPath)) {
    const content = readFileSync(globalConfigPath, 'utf-8');
    globalConfig = parseConfigFile(content);
  }

  let localConfig: Partial<Config> = {};
  if (localConfigPath && existsSync(localConfigPath)) {
    const content = readFileSync(localConfigPath, 'utf-8');
    localConfig = parseConfigFile(content);
  }
  
  return { ...globalConfig, ...localConfig };
}
