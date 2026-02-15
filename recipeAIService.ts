import Anthropic from '@anthropic-ai/sdk';
import { config } from './environment';
import { logger } from './logger';
import { Recipe, UserPreferences, RecipeModifications, MealPlanGoals } from './recipe';
import { buildRecipePrompt, buildModificationPrompt, buildMealPlanPrompt, buildHealthOnlyPrompt, type RecipeForHealth } from './prompts';
import { generateFromGemini } from './geminiHelper';

const useGemini = !!config.geminiApiKey;

export class RecipeAIService {
  private anthropic: Anthropic | null = null;

  constructor() {
    if (config.anthropicApiKey) {
      this.anthropic = new Anthropic({ apiKey: config.anthropicApiKey! });
    }
  }

  private async getAiText(prompt: string, maxTokens: number = 4096): Promise<string> {
    if (useGemini && config.geminiApiKey) {
      logger.info('Generating with Gemini');
      return generateFromGemini(prompt, {
        preferredModel: 'gemini-2.0-flash',
        maxRetries: 2,
      });
    }
    if (this.anthropic) {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });
      const content = response.content[0];
      if (content.type !== 'text') throw new Error('Unexpected response type from Claude');
      return content.text;
    }
    throw new Error('No AI provider configured. Set GEMINI_API_KEY or ANTHROPIC_API_KEY in .env');
  }

  /**
   * Generate a recipe from ingredients using AI (Gemini or Claude)
   */
  async generateRecipe(
    ingredients: string[],
    preferences: UserPreferences
  ): Promise<Recipe> {
    try {
      const prompt = buildRecipePrompt(ingredients, preferences);

      logger.info('Generating recipe', {
        provider: useGemini ? 'Gemini' : 'Claude',
        ingredients: ingredients.length,
        preferences,
      });

      const text = await this.getAiText(prompt, 4096);
      const recipe = this.parseRecipeResponse(text);
      logger.info('Recipe generated successfully', { title: recipe.title });
      return recipe;
    } catch (error) {
      logger.error('Failed to generate recipe:', error);
      throw new Error('Failed to generate recipe with AI');
    }
  }

  /**
   * Stream recipe generation for real-time UI updates (Claude only; Gemini yields full text at once)
   */
  async *streamRecipeGeneration(
    ingredients: string[],
    preferences: UserPreferences
  ): AsyncGenerator<string> {
    if (useGemini && config.geminiApiKey) {
      const text = await this.getAiText(buildRecipePrompt(ingredients, preferences), 4096);
      yield text;
      return;
    }
    if (!this.anthropic) throw new Error('Streaming requires ANTHROPIC_API_KEY');
    try {
      const prompt = buildRecipePrompt(ingredients, preferences);
      const stream = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        temperature: 0.7,
      });
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield chunk.delta.text;
        }
      }
    } catch (error) {
      logger.error('Failed to stream recipe generation:', error);
      throw error;
    }
  }

  /**
   * Modify an existing recipe based on requirements
   */
  async modifyRecipe(
    recipe: Recipe,
    modifications: RecipeModifications
  ): Promise<Recipe> {
    try {
      const prompt = buildModificationPrompt(recipe, modifications);
      const text = await this.getAiText(prompt, 4096);
      return this.parseRecipeResponse(text);
    } catch (error) {
      logger.error('Failed to modify recipe:', error);
      throw error;
    }
  }

  /**
   * Generate a meal plan
   */
  async generateMealPlan(
    days: number,
    preferences: UserPreferences,
    goals: MealPlanGoals
  ): Promise<any> {
    try {
      const prompt = buildMealPlanPrompt(days, preferences, goals);
      const text = await this.getAiText(prompt, 8192);
      return this.parseMealPlanResponse(text);
    } catch (error) {
      logger.error('Failed to generate meal plan:', error);
      throw error;
    }
  }

  /**
   * Get recipe suggestions based on pantry items
   */
  async suggestRecipes(
    pantryItems: string[],
    preferences: UserPreferences
  ): Promise<string[]> {
    try {
      const prompt = `
Based on these pantry items: ${pantryItems.join(', ')}

User preferences:
${JSON.stringify(preferences, null, 2)}

Suggest 5 recipe titles that could be made with these ingredients.
Consider the user's dietary restrictions and preferences.

Return only a JSON array of recipe titles.
Example: ["Pasta Carbonara", "Greek Salad", ...]
      `;
      const text = await this.getAiText(prompt, 1024);
      return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    } catch (error) {
      logger.error('Failed to suggest recipes:', error);
      throw error;
    }
  }

  /**
   * Strip markdown code fences and fix common invalid JSON from AI (e.g. fraction literals 1/4).
   */
  /**
   * Generate only health_benefits and health_concerns for an existing recipe (e.g. curated).
   */
  async generateHealthForRecipe(recipe: RecipeForHealth): Promise<{ healthBenefits: string[]; healthConcerns: string[] }> {
    const prompt = buildHealthOnlyPrompt(recipe);
    const text = await this.getAiText(prompt, 1024);
    const cleanText = this.normalizeJsonText(text);
    const parsed = JSON.parse(cleanText);
    const benefits = Array.isArray(parsed.health_benefits) ? parsed.health_benefits : parsed.healthBenefits ?? [];
    const concerns = Array.isArray(parsed.health_concerns) ? parsed.health_concerns : parsed.healthConcerns ?? [];
    return { healthBenefits: benefits, healthConcerns: concerns };
  }

  private normalizeJsonText(text: string): string {
    let out = text
      .replace(/^\s*```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/g, '')
      .trim();
    // Fix invalid JSON: AI often outputs "amount": 1/4 (invalid); replace with decimals
    const fractionMap: [RegExp, string][] = [
      [/"amount":\s*1\/4\b/g, '"amount": 0.25'],
      [/"amount":\s*1\/2\b/g, '"amount": 0.5'],
      [/"amount":\s*3\/4\b/g, '"amount": 0.75'],
      [/"amount":\s*1\/3\b/g, '"amount": 0.333'],
      [/"amount":\s*2\/3\b/g, '"amount": 0.667'],
    ];
    for (const [re, replacement] of fractionMap) {
      out = out.replace(re, replacement);
    }
    return out;
  }

  /**
   * Parse AI recipe response into structured format
   */
  private parseRecipeResponse(text: string): Recipe {
    try {
      const cleanText = this.normalizeJsonText(text);
      const parsed = JSON.parse(cleanText);
      if (!parsed.title || !parsed.ingredients || !parsed.instructions) {
        throw new Error('Missing required recipe fields');
      }
      return {
        title: parsed.title,
        description: parsed.description || '',
        cuisineType: parsed.cuisineType || parsed.cuisine_type,
        mealType: parsed.mealType || parsed.meal_type,
        difficulty: parsed.difficulty || 'medium',
        prepTime: parsed.prepTime ?? parsed.prep_time ?? 0,
        cookTime: parsed.cookTime ?? parsed.cook_time ?? 0,
        servings: parsed.servings ?? 4,
        ingredients: parsed.ingredients,
        instructions: parsed.instructions,
        nutritionalInfo: parsed.nutritionalInfo ?? parsed.nutritional_info,
        tags: parsed.tags || [],
        healthBenefits: parsed.health_benefits ?? parsed.healthBenefits ?? [],
        healthConcerns: parsed.health_concerns ?? parsed.healthConcerns ?? [],
        source: 'ai_generated',
        isPublic: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to parse recipe response', { text: text.slice(0, 200), error: message });
      throw new Error('Invalid recipe format from AI');
    }
  }

  private parseMealPlanResponse(text: string): any {
    try {
      const cleanText = this.normalizeJsonText(text);
      return JSON.parse(cleanText);
    } catch (error) {
      logger.error('Failed to parse meal plan response', error);
      throw new Error('Invalid meal plan format from AI');
    }
  }
}
