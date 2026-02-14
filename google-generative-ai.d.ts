/**
 * Local declaration for @google/generative-ai when the package is installed
 * but TypeScript/ts-node cannot resolve it (e.g. in Docker with named volume).
 */
declare module '@google/generative-ai' {
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(params: { model: string }): {
      generateContent(request: unknown): Promise<{
        response: { text: () => string };
      }>;
    };
  }
}
