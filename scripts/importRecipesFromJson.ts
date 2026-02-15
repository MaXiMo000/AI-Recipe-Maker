/**
 * Bulk-import recipes from a JSON file or URL (e.g. Kaggle "Recipes Dataset 64k" or custom).
 * Run: npx ts-node scripts/importRecipesFromJson.ts [path/to/recipes.json | https://...]
 * In production: node dist/scripts/importRecipesFromJson.js https://your-hosted-url/recipes.json
 *
 * Expected JSON: array of objects. Each object can have:
 *   - title (required)
 *   - description or instructions (string)
 *   - ingredients: array of strings OR array of { name, amount?, unit? }
 *   - instructions: array of strings OR array of { step, instruction }
 *   - cuisine_type / cuisine / category
 *   - meal_type / mealType
 *   - difficulty
 *   - prep_time / prepTime (minutes)
 *   - cook_time / cookTime (minutes)
 *   - servings
 *   - tags (array of strings)
 *   - image_url / image
 *
 * Example (Kaggle-style): { "Title": "...", "Ingredients": "a, b, c", "Instructions": "step1..." }
 */

import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase, initializeSchema, query } from '../database';

function normalizeIngredient(ing: string | { name: string; amount?: number; unit?: string }): { name: string; amount: number; unit: string } {
  if (typeof ing === 'string') {
    const trimmed = ing.trim();
    const match = trimmed.match(/^([\d./\s]+)\s+(.+)$/);
    if (match) {
      const amountStr = match[1].trim();
      let amount = 1;
      if (amountStr.includes('/')) {
        const [a, b] = amountStr.split('/').map(Number);
        amount = a && b ? a / b : 1;
      } else {
        amount = Number(amountStr) || 1;
      }
      return { name: match[2].trim(), amount, unit: '' };
    }
    return { name: trimmed || 'Unknown', amount: 1, unit: '' };
  }
  return {
    name: ing.name || 'Unknown',
    amount: ing.amount ?? 1,
    unit: ing.unit || '',
  };
}

function normalizeInstructions(inst: string | string[] | Array<{ step: number; instruction: string }>): Array<{ step: number; instruction: string }> {
  if (Array.isArray(inst)) {
    return inst.map((item, i) => {
      if (typeof item === 'string') return { step: i + 1, instruction: item };
      return { step: (item as any).step ?? i + 1, instruction: (item as any).instruction || (item as any).text || '' };
    }).filter((s) => s.instruction.trim());
  }
  if (typeof inst === 'string') {
    return inst.split(/\n+/).map((s, i) => ({ step: i + 1, instruction: s.trim() })).filter((s) => s.instruction);
  }
  return [];
}

function mapRow(row: any): {
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
} {
  const title = row.recipe_title ?? row.title ?? row.Title ?? row.name ?? 'Untitled';
  const desc = row.description ?? row.Description ?? (typeof row.instructions === 'string' ? row.instructions : '') ?? '';
  let ingredientsRaw = row.ingredients ?? row.Ingredients ?? [];
  if (typeof ingredientsRaw === 'string') {
    ingredientsRaw = ingredientsRaw.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  const ingredients = Array.isArray(ingredientsRaw)
    ? ingredientsRaw.map(normalizeIngredient)
    : [{ name: 'See instructions', amount: 1, unit: '' }];
  const instructionsRaw = row.directions ?? row.instructions ?? row.Instructions ?? desc;
  const instructions = normalizeInstructions(instructionsRaw);

  const category = row.category ?? row.subcategory ?? row.cuisine_type ?? row.cuisine ?? row.Cuisine ?? 'International';
  const tags = Array.isArray(row.tags) ? row.tags : (row.Tags ? String(row.Tags).split(',').map((s: string) => s.trim()) : []);
  if (row.subcategory && row.subcategory !== category) tags.unshift(String(row.subcategory));
  if (category && category !== 'International') tags.unshift(String(category));

  return {
    title: String(title).slice(0, 255),
    description: String(desc).slice(0, 500),
    cuisine_type: category.toString().slice(0, 100),
    meal_type: (row.meal_type ?? row.mealType ?? row.MealType ?? 'dinner').toString().toLowerCase().slice(0, 50),
    difficulty: ['easy', 'medium', 'hard'].includes(String(row.difficulty ?? row.Difficulty ?? 'medium').toLowerCase())
      ? String(row.difficulty ?? row.Difficulty ?? 'medium').toLowerCase()
      : 'medium',
    prep_time: Math.max(0, Number(row.prep_time ?? row.prepTime ?? row.PrepTime ?? 0)),
    cook_time: Math.max(0, Number(row.cook_time ?? row.cookTime ?? row.CookTime ?? 0)),
    servings: Math.max(1, Number(row.servings ?? row.Servings ?? 4)),
    ingredients,
    instructions: instructions.length ? instructions : [{ step: 1, instruction: desc || 'See description.' }],
    tags,
    image_url: row.image_url ?? row.image ?? row.Image ?? null,
  };
}

async function main() {
  const input = process.argv[2] || path.join(process.cwd(), 'data', 'recipes.json');
  const isUrl = input.startsWith('http://') || input.startsWith('https://');

  let raw: string;
  if (isUrl) {
    console.log('Fetching from URL:', input);
    const res = await fetch(input);
    if (!res.ok) {
      console.error('Failed to fetch URL:', res.status, res.statusText);
      process.exit(1);
    }
    raw = await res.text();
  } else {
    if (!fs.existsSync(input)) {
      console.error('Usage: npx ts-node scripts/importRecipesFromJson.ts [path/to/recipes.json | https://...]');
      console.error('File not found:', input);
      console.error('Example: npm run seed:import -- https://raw.githubusercontent.com/.../recipes.json');
      process.exit(1);
    }
    raw = fs.readFileSync(input, 'utf-8');
  }

  await connectDatabase();
  await initializeSchema();

  let data: any[];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      data = parsed;
    } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.recipes)) {
      data = parsed.recipes;
    } else {
      data = [parsed];
    }
  } catch {
    // JSON Lines: one JSON object per line (e.g. {"recipe_title":"...", "ingredients":[...]}\n{...})
    const lines = raw.split('\n').map((s) => s.trim()).filter(Boolean);
    data = [];
    for (let i = 0; i < lines.length; i++) {
      try {
        const obj = JSON.parse(lines[i]);
        if (obj && typeof obj === 'object') data.push(obj);
      } catch {
        // skip invalid lines
      }
    }
    if (data.length === 0) {
      console.error('Invalid JSON and no valid JSON Lines found in', input);
      process.exit(1);
    }
    console.log('Parsed as JSON Lines:', data.length, 'objects');
  }

  console.log(`Importing ${data.length} recipes from ${input}...`);
  let inserted = 0;
  let failed = 0;
  for (let i = 0; i < data.length; i++) {
    try {
      const r = mapRow(data[i]);
      await query(
        `INSERT INTO recipes (
          user_id, title, description, cuisine_type, meal_type, difficulty,
          prep_time, cook_time, servings, ingredients, instructions,
          nutritional_info, tags, image_url, source, is_public
        ) VALUES (NULL, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, $11, $12, 'curated', true)`,
        [
          r.title,
          r.description,
          r.cuisine_type,
          r.meal_type,
          r.difficulty,
          r.prep_time,
          r.cook_time,
          r.servings,
          JSON.stringify(r.ingredients),
          JSON.stringify(r.instructions),
          JSON.stringify(r.tags || []),
          r.image_url,
        ]
      );
      inserted++;
      if (inserted % 500 === 0) console.log(`Inserted ${inserted}/${data.length}...`);
    } catch (err) {
      failed++;
      if (failed <= 3) console.warn('Skip row', i, data[i]?.title ?? data[i]?.Title, err);
    }
  }
  console.log(`Done. Inserted ${inserted}, skipped ${failed}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
