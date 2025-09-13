import axios from 'axios';

// TypeScript Hint: An 'interface' defines a contract for an object's shape.
// It ensures that when we get data back from the API, it matches the structure
// we expect. This prevents runtime errors from unexpected API responses.
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
 * Sends a diff to the Gemini API and returns a commit message.
 * @param diffText The git diff to be summarized.
 * @returns A promise that resolves to the generated commit message string.
 */
export async function generateMessageFromDiff(diffText: string): Promise<string> {
  // TypeScript Hint: 'Promise<string>' is the return type for an async function
  // that will eventually provide a string.

  // --- YOUR CODE HERE (6) ---
  // Get the API key from environment variables.
  // The variable name is 'GEMINI_API_KEY'. Use `process.env.VARIABLE_NAME`.
  const apiKey = process.env.GEMINI_API_KEY; 

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in your environment.');
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // --- YOUR CODE HERE (7) ---
  // Create a prompt string. This is where you instruct the AI.
  // Example: "Generate a conventional commit message for the following diff:\n\n${diffText}"
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
  // --- YOUR CODE HERE (8) ---
  // Use 'axios.post()' to send a request to the API_URL.
  // The second argument to axios.post is the request body (payload).
  // The body should be a JSON object like: { contents: [{ parts: [{ text: prompt }] }] }
  //
  // Use the 'GeminiResponse' interface with axios for type safety:
  // const response = await axios.post<GeminiResponse>(API_URL, /* your data here */);
  const response = await axios.post<GeminiResponse>(API_URL, {
    contents: [{ parts: [{ text: prompt }] }],
  });

  // --- YOUR CODE HERE (9) ---
  // Navigate through the nested 'response.data' object to extract the commit message text.
  // Refer to the 'GeminiResponse' interface to see the path.
  // If the response or text is missing, throw an error.
  const message = response.data.candidates?.[0]?.content.parts?.[0]?.text;

  if (!message) {
    throw new Error('Failed to parse a valid message from the AI respone.');
  }

  return message.trim();
}
