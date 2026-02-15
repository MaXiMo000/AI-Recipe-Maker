import { Recipe, UserPreferences, RecipeModifications, MealPlanGoals } from './recipe';

/**
 * Build prompt for recipe generation
 */
export function buildRecipePrompt(
  ingredients: string[],
  preferences: UserPreferences
): string {
  return `Generate a detailed recipe using the following ingredients: ${ingredients.join(', ')}

User preferences and requirements:
- Dietary restrictions: ${preferences.dietary?.join(', ') || 'none'}
- Allergies: ${preferences.allergies?.join(', ') || 'none'}
- Skill level: ${preferences.skillLevel || 'beginner'}
- Cuisine preference: ${preferences.cuisine || 'any'}
- Meal type: ${preferences.mealType || 'any'}
- Cooking time available: ${preferences.maxCookTime ? `${preferences.maxCookTime} minutes` : 'flexible'}

Please provide a complete recipe with:
1. Creative and appetizing title
2. Brief description (2-3 sentences about the dish)
3. Prep time and cook time in minutes
4. Difficulty level (easy, medium, or hard)
5. Number of servings (default 4)
6. Complete ingredient list with precise measurements
7. Step-by-step cooking instructions
8. Helpful cooking tips
9. Estimated nutritional information per serving

IMPORTANT: Return ONLY valid JSON in this exact structure:
{
  "title": "Recipe Name",
  "description": "Delicious description of the dish",
  "cuisineType": "Italian/Asian/Mexican/etc",
  "mealType": "breakfast/lunch/dinner/snack/dessert",
  "difficulty": "easy/medium/hard",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "ingredients": [
    {"name": "ingredient name", "amount": 2, "unit": "cups"},
    {"name": "another ingredient", "amount": 1, "unit": "tbsp"}
  ],
  "instructions": [
    {"step": 1, "instruction": "Detailed instruction text", "time": 5},
    {"step": 2, "instruction": "Next step"}
  ],
  "tips": [
    "Helpful tip 1",
    "Helpful tip 2"
  ],
  "nutritionalInfo": {
    "calories": 350,
    "protein": 25,
    "carbs": 40,
    "fat": 12,
    "fiber": 5,
    "sodium": 600
  },
  "tags": ["quick", "healthy", "comfort food"],
  "health_benefits": [
    "Short benefit 1 (e.g. Good for eyes – vitamin A from carrots)",
    "Short benefit 2 (e.g. Heart-friendly fats)"
  ],
  "health_concerns": [
    "Short concern if any (e.g. High sodium – limit if watching blood pressure)",
    "Or leave empty [] if no significant concerns"
  ]
}

Based on the ingredients and nutrition, list 2–4 short health_benefits (e.g. good for eyes, bones, heart, digestion) and 0–3 health_concerns or cautions (e.g. high sodium, high sugar, processed – enjoy in moderation). Be factual and brief. Use empty array for health_concerns if there are none. Do not include ingredients the user is allergic to or that violate their dietary preferences.`;
}

/**
 * Build prompt for recipe modification
 */
export function buildModificationPrompt(
  recipe: Recipe,
  modifications: RecipeModifications
): string {
  let prompt = `Modify the following recipe according to these requirements:\n\n`;
  prompt += `Original Recipe:\n${JSON.stringify(recipe, null, 2)}\n\n`;
  prompt += `Modifications needed:\n`;

  if (modifications.servings && modifications.servings !== recipe.servings) {
    prompt += `- Adjust servings from ${recipe.servings} to ${modifications.servings}\n`;
  }

  if (modifications.dietary && modifications.dietary.length > 0) {
    prompt += `- Make it ${modifications.dietary.join(', ')}\n`;
  }

  if (modifications.substitutions && Object.keys(modifications.substitutions).length > 0) {
    prompt += `- Ingredient substitutions:\n`;
    Object.entries(modifications.substitutions).forEach(([from, to]) => {
      prompt += `  * Replace ${from} with ${to}\n`;
    });
  }

  if (modifications.reduceTime) {
    prompt += `- Reduce cooking/prep time where possible\n`;
  }

  if (modifications.simplify) {
    prompt += `- Simplify the recipe for easier preparation\n`;
  }

  if (modifications.makeHealthier) {
    prompt += `- Make healthier by reducing fat, sugar, and sodium\n`;
  }

  prompt += `\nProvide the modified recipe in the same JSON format as the original, including health_benefits and health_concerns (short arrays of strings) based on the modified ingredients and nutrition.`;
  prompt += `\nEnsure all ingredient amounts are proportionally adjusted.`;
  prompt += `\nUpdate nutritional information to reflect the changes.`;

  return prompt;
}

/**
 * Build prompt for meal plan generation
 */
export function buildMealPlanPrompt(
  days: number,
  preferences: UserPreferences,
  goals: MealPlanGoals
): string {
  return `Create a ${days}-day meal plan with the following criteria:

User Profile:
- Dietary preferences: ${preferences.dietary?.join(', ') || 'none'}
- Allergies: ${preferences.allergies?.join(', ') || 'none'}
- Skill level: ${preferences.skillLevel || 'beginner'}
- Daily calorie target: ${goals.calorieTarget || 'balanced (2000 calories)'}
- Meals per day: ${goals.mealsPerDay || 3} (${goals.includeSnacks ? 'plus snacks' : 'no snacks'})
- Budget: ${goals.budget || 'moderate'}

Goals and Preferences:
${goals.goals || 'balanced nutrition and variety'}

Requirements:
1. Create variety across the week - no repeated meals
2. Ensure nutritional balance each day
3. Consider prep time and skill level
4. Stay within calorie target (±10%)
5. Include a mix of cuisines
6. Balance protein, carbs, and healthy fats
7. Include vegetables in most meals
8. Make meals practical for meal prep if requested

Return a JSON array with this structure:
[
  {
    "day": 1,
    "date": "2025-02-13",
    "meals": {
      "breakfast": {
        "title": "Recipe name",
        "prepTime": 10,
        "cookTime": 15,
        "ingredients": [...],
        "instructions": [...],
        "nutritionalInfo": {...}
      },
      "lunch": {...},
      "dinner": {...}
      ${goals.includeSnacks ? ',"snacks": [...]' : ''}
    },
    "dailyNutrition": {
      "calories": 2000,
      "protein": 100,
      "carbs": 250,
      "fat": 65
    },
    "notes": "Any special notes for this day"
  }
]

Each meal should be a complete recipe with all details needed to prepare it.`;
}

/**
 * Build prompt for recipe suggestions
 */
export function buildSuggestionPrompt(
  pantryItems: string[],
  preferences: UserPreferences,
  limit: number = 5
): string {
  return `Based on these available ingredients: ${pantryItems.join(', ')}

User preferences:
- Dietary: ${preferences.dietary?.join(', ') || 'none'}
- Allergies: ${preferences.allergies?.join(', ') || 'none'}
- Favorite cuisines: ${preferences.favoriteCuisines?.join(', ') || 'any'}

Suggest ${limit} recipe ideas that:
1. Can be made primarily with the available ingredients
2. Respect dietary restrictions and allergies
3. Are practical and achievable
4. Provide variety in cooking styles

Return only a JSON array of recipe titles and brief descriptions:
[
  {"title": "Recipe Name", "description": "Quick description", "missingIngredients": ["item1", "item2"]},
  ...
]`;
}

/**
 * Build prompt for nutritional analysis
 */
export function buildNutritionPrompt(ingredients: Array<{name: string, amount: number, unit: string}>): string {
  return `Analyze the nutritional content for these ingredients:

${ingredients.map(ing => `- ${ing.amount} ${ing.unit} ${ing.name}`).join('\n')}

Provide detailed nutritional information including:
- Calories
- Protein (g)
- Carbohydrates (g)
- Fat (g)
- Fiber (g)
- Sugar (g)
- Sodium (mg)
- Key vitamins and minerals

Return as JSON:
{
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "sugar": number,
  "sodium": number,
  "vitamins": {
    "vitaminA": number,
    "vitaminC": number,
    "calcium": number,
    "iron": number
  }
}`;
}
