import axios from 'axios';
import { loadConfig } from './config.js';

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

/**
 * Gets the Gemini API key from the environment or config files.
 * @returns The API key string.
 * @throws An error if the key is not found.
 */
function getApiKey(): string {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }

  const config = loadConfig();
  if (config.apiKey) {
    return config.apiKey;
  }

  // If no key is found, throw an error with helpful instructions.
  throw new Error(
    'GEMINI_API_KEY not found. Please set it in one of the following ways:\n' +
    '1. In a .env file at the root of your Git repository.\n' +
    '2. In a global ~/.config/gitfi/.gitfi.conf file (Linux).\n' +
    '3. In a global ~/Library/Preferences/gitfi/.gitfi.conf file (macOS).\n' +
    '4. In a local .gitfi.conf file at the root of your Git repository.'
  );
}

/**
 * Sends a diff to the Gemini API and returns a commit message.
 * @param diffText The git diff to be summarized.
 * @returns A promise that resolves to the generated commit message string.
 */
export async function generateMessageFromDiff(diffText: string): Promise<string> {
  if (process.env.VITEST_MOCK_AI === 'true') {
    return 'test: create a new feature';
  }
  const apiKey = getApiKey(); 

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const prompt = `
    Analyze the following code changes and generate a concise Git commit message.
    The message must follow the Conventional Commits specification and should be conversational. Emphasis on concise.
    Format: <type>[optional scope]: <description>
    Do not include any introductory text, just the commit message itself.

    Diff:
    ---
    ${diffText}
    ---
  `;

  const response = await axios.post<GeminiResponse>(API_URL, {
    contents: [{ parts: [{ text: prompt }] }],
  });

  const message = response.data.candidates?.[0]?.content.parts?.[0]?.text;

  if (!message) {
    throw new Error('Failed to parse a valid message from the AI respone.');
  }

  return message.trim();
}
