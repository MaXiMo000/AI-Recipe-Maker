import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from './logger';

const MODEL_PRIORITY = [
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.0-pro',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRateLimitError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return /429|quota|rate limit|Too Many Requests/i.test(msg);
}

export interface GenerateFromGeminiOptions {
  preferredModel?: string;
  maxRetries?: number;
  baseDelay?: number;
}

/**
 * Generate text from Gemini API with retry and model fallback.
 */
export async function generateFromGemini(
  prompt: string,
  options: GenerateFromGeminiOptions = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in .env');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const {
    preferredModel = 'gemini-2.0-flash',
    maxRetries = 2,
    baseDelay = 1000,
  } = options;

  const preferredIndex = MODEL_PRIORITY.indexOf(preferredModel);
  const modelsToTry =
    preferredIndex >= 0
      ? [...MODEL_PRIORITY.slice(preferredIndex)]
      : [preferredModel, ...MODEL_PRIORITY];

  let lastError: unknown = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        });

        const response = result.response;
        const text = response.text();
        if (text) return text;
        throw new Error('Empty response from Gemini');
      } catch (error) {
        lastError = error;
        if (isRateLimitError(error) && attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          logger.warn(`Gemini rate limit, retrying in ${delay}ms...`, { model: modelName });
          await sleep(Math.min(delay, 5000));
          continue;
        }
        if (!isRateLimitError(error)) {
          logger.error('Gemini error', { model: modelName, error });
          throw error;
        }
        break;
      }
    }
  }

  if (lastError) throw lastError;
  throw new Error('Failed to generate content from Gemini');
}
