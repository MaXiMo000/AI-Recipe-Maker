/**
 * Fetch recipes from TheMealDB (free, no key required) and map to our schema.
 * API: https://www.themealdb.com/api.php
 * ~300–600 meals available. Use in seedTheMealDB.ts.
 */

const BASE = 'https://www.themealdb.com/api/json/v1/1';

export interface TheMealDBMeal {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string | null;
  strTags: string | null;
  strYoutube: string | null;
  strIngredient1?: string;
  strIngredient2?: string;
  strIngredient3?: string;
  strIngredient4?: string;
  strIngredient5?: string;
  strIngredient6?: string;
  strIngredient7?: string;
  strIngredient8?: string;
  strIngredient9?: string;
  strIngredient10?: string;
  strIngredient11?: string;
  strIngredient12?: string;
  strIngredient13?: string;
  strIngredient14?: string;
  strIngredient15?: string;
  strIngredient16?: string;
  strIngredient17?: string;
  strIngredient18?: string;
  strIngredient19?: string;
  strIngredient20?: string;
  strMeasure1?: string;
  strMeasure2?: string;
  strMeasure3?: string;
  strMeasure4?: string;
  strMeasure5?: string;
  strMeasure6?: string;
  strMeasure7?: string;
  strMeasure8?: string;
  strMeasure9?: string;
  strMeasure10?: string;
  strMeasure11?: string;
  strMeasure12?: string;
  strMeasure13?: string;
  strMeasure14?: string;
  strMeasure15?: string;
  strMeasure16?: string;
  strMeasure17?: string;
  strMeasure18?: string;
  strMeasure19?: string;
  strMeasure20?: string;
}

export interface NormalizedRecipe {
  title: string;
  description: string;
  cuisine_type: string;
  meal_type: string;
  difficulty: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  ingredients: Array<{ name: string; amount: number; unit: string }>;
  instructions: Array<{ step: number; instruction: string }>;
  tags: string[];
  image_url: string | null;
}

function parseMeasure(measure: string): { amount: number; unit: string } {
  if (!measure || !measure.trim()) return { amount: 1, unit: '' };
  const trimmed = measure.trim();
  const fracMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)(?:\s+(.*))?$/);
  if (fracMatch) {
    const num = Number(fracMatch[1]) / Number(fracMatch[2]);
    const unit = (fracMatch[3] || '').trim();
    return { amount: num, unit };
  }
  const numMatch = trimmed.match(/^([\d.,]+)\s+(.*)$/);
  if (numMatch) {
    const amount = Number(numMatch[1].replace(',', '.')) || 1;
    const unit = (numMatch[2] || '').trim();
    return { amount, unit };
  }
  const justNum = Number(trimmed);
  if (!Number.isNaN(justNum)) return { amount: justNum, unit: '' };
  return { amount: 1, unit: trimmed };
}

function instructionsToSteps(str: string): Array<{ step: number; instruction: string }> {
  if (!str || !str.trim()) return [];
  const steps: Array<{ step: number; instruction: string }> = [];
  const byStep = str.split(/\r?\n\s*step\s+\d+\s*\r?\n/i);
  if (byStep.length > 1) {
    byStep.forEach((s, i) => {
      const t = s.replace(/^\s*step\s+\d+\s*\r?\n?/i, '').trim();
      if (t) steps.push({ step: i + 1, instruction: t });
    });
  } else {
    const paras = str.split(/\r?\n\r?\n+/).map((p) => p.trim()).filter(Boolean);
    paras.forEach((p, i) => steps.push({ step: i + 1, instruction: p }));
  }
  if (steps.length === 0 && str.trim()) steps.push({ step: 1, instruction: str.trim() });
  return steps;
}

const CATEGORY_TO_MEAL_TYPE: Record<string, string> = {
  Breakfast: 'breakfast',
  Starter: 'lunch',
  Side: 'side',
  'Side Dish': 'side',
  Lunch: 'lunch',
  Dinner: 'dinner',
  Snack: 'snack',
  Dessert: 'dessert',
  Vegetarian: 'lunch',
  Beef: 'dinner',
  Chicken: 'dinner',
  Lamb: 'dinner',
  Pork: 'dinner',
  Seafood: 'dinner',
  Pasta: 'dinner',
  Vegan: 'lunch',
  '': 'dinner',
};

export function mapMealToRecipe(meal: TheMealDBMeal): NormalizedRecipe {
  const ingredients: Array<{ name: string; amount: number; unit: string }> = [];
  for (let i = 1; i <= 20; i++) {
    const m = meal as unknown as Record<string, string | null | undefined>;
    const name = m[`strIngredient${i}`]?.trim();
    const measure = m[`strMeasure${i}`]?.trim();
    if (!name) continue;
    const { amount, unit } = parseMeasure(measure || '');
    ingredients.push({ name, amount, unit });
  }

  const instructions = instructionsToSteps(meal.strInstructions || '');
  const category = meal.strCategory || '';
  const mealType = CATEGORY_TO_MEAL_TYPE[category] || 'dinner';
  const tags = meal.strTags ? meal.strTags.split(',').map((t) => t.trim()).filter(Boolean) : [];
  if (meal.strArea) tags.unshift(meal.strArea);

  return {
    title: meal.strMeal || 'Untitled',
    description: (meal.strInstructions || '').slice(0, 300) + (meal.strInstructions && meal.strInstructions.length > 300 ? '...' : ''),
    cuisine_type: meal.strArea || 'International',
    meal_type: mealType,
    difficulty: 'medium',
    prep_time: 0,
    cook_time: 0,
    servings: 4,
    ingredients,
    instructions,
    tags,
    image_url: meal.strMealThumb || null,
  };
}

export async function fetchAllTheMealDBMeals(): Promise<TheMealDBMeal[]> {
  const seen = new Set<string>();
  const meals: TheMealDBMeal[] = [];
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

  for (const letter of letters) {
    const url = `${BASE}/search.php?f=${letter}`;
    const res = await fetch(url);
    const data = (await res.json()) as { meals: TheMealDBMeal[] | null };
    const list = data.meals || [];
    for (const m of list) {
      if (m.idMeal && !seen.has(m.idMeal)) {
        seen.add(m.idMeal);
        meals.push(m);
      }
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  return meals;
}
