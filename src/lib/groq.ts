import { Groq } from "groq-sdk";

const API_KEY = process.env.GROQ_API_KEY || "";
const API_KEY_FALLBACK = process.env.GROQ_API_KEY_FALLBACK || "";

// Initialize multiple clients if fallback is provided
const clients = [new Groq({ apiKey: API_KEY })];
if (API_KEY_FALLBACK) {
  clients.push(new Groq({ apiKey: API_KEY_FALLBACK }));
}

/**
 * Utility function to call Groq API with automatic fallback and retry.
 * Matches the logic previously established in studymaster-worker.
 */
export async function callGroqWithFallback(
  messages: any[],
  options: { model?: string; temperature?: number; response_format?: any; max_tokens?: number; apiKey?: string } = {}
) {
  const model = options.model || "llama3-70b-8192";
  const temperature = options.temperature ?? 0.3;

  // Use dynamically provided API key if available, otherwise fallback to module-level clients
  const activeClients = options.apiKey ? [new Groq({ apiKey: options.apiKey })] : clients;

  for (let attempt = 0; attempt < activeClients.length; attempt++) {
    const client = activeClients[attempt];
    try {
      const response = await client.chat.completions.create({
        messages,
        model,
        temperature,
        response_format: options.response_format,
        max_tokens: options.max_tokens,
      });
      return response.choices[0]?.message?.content;
    } catch (error: any) {
      console.warn(`[Groq API] Attempt ${attempt + 1} failed:`, error.message);
      // Wait before retrying (1000ms base)
      if (attempt < clients.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        throw new Error(`All Groq API attempts failed. Last error: ${error.message}`);
      }
    }
  }
}
