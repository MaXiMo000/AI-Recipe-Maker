# AI Recipe Maker - System Architecture

## Overview
A full-stack web application that uses AI to generate, modify, and plan recipes with nutritional analysis and meal planning capabilities.

## Tech Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit + RTK Query
- **UI Components**: shadcn/ui + Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js 20+ with Express.js
- **Language**: TypeScript
- **API**: RESTful + WebSocket (for real-time recipe generation)
- **AI Integration**: Anthropic Claude API
- **Authentication**: JWT + bcrypt
- **Validation**: Zod schemas

### Database
- **Primary DB**: PostgreSQL 15+ (recipe storage, user data)
- **Cache Layer**: Redis (session management, API caching)
- **Search Engine**: Elasticsearch (recipe search with filters)
- **File Storage**: AWS S3 / Cloudflare R2 (recipe images)

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions
- **Hosting**: AWS / DigitalOcean / Railway
- **Monitoring**: Sentry (errors) + Prometheus + Grafana (metrics)

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Recipe   │  │  Meal    │  │ Nutrition│  │  User    │   │
│  │Generator │  │ Planning │  │ Analysis │  │ Profile  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/WSS
┌────────────────────────▼────────────────────────────────────┐
│                    API Gateway (Nginx)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  Backend API (Express)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Service │  │Recipe Service│  │ AI Service   │     │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤     │
│  │User Service  │  │ Meal Planner │  │Nutrition Calc│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───┬────────────┬────────────┬────────────┬─────────────────┘
    │            │            │            │
    ▼            ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌──────────┐  ┌──────────────┐
│PostgreSQL  │Redis   │  │Elasticsearch│ Claude API   │
│(Primary)│  │(Cache) │  │(Search)  │  │(AI)         │
└────────┘  └────────┘  └──────────┘  └──────────────┘
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    dietary_preferences JSONB DEFAULT '[]',
    allergies JSONB DEFAULT '[]',
    skill_level VARCHAR(50) DEFAULT 'beginner',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Recipes Table
```sql
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cuisine_type VARCHAR(100),
    meal_type VARCHAR(100),
    difficulty VARCHAR(50),
    prep_time INTEGER, -- minutes
    cook_time INTEGER, -- minutes
    servings INTEGER DEFAULT 4,
    ingredients JSONB NOT NULL, -- [{name, amount, unit}]
    instructions JSONB NOT NULL, -- [{step_number, instruction}]
    nutritional_info JSONB, -- {calories, protein, carbs, fat, fiber}
    tags JSONB DEFAULT '[]',
    image_url TEXT,
    source VARCHAR(50) DEFAULT 'ai_generated', -- ai_generated, user_created, imported
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_cuisine ON recipes(cuisine_type);
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags);
```

### Meal Plans Table
```sql
CREATE TABLE meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    meals JSONB NOT NULL, -- [{date, meal_type, recipe_id}]
    shopping_list JSONB, -- [{ingredient, amount, unit, checked}]
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Recipe Collections Table
```sql
CREATE TABLE recipe_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    recipe_ids JSONB DEFAULT '[]',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Recipe Database (for hybrid approach)
```sql
CREATE TABLE recipe_database (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    ingredients JSONB NOT NULL,
    instructions JSONB NOT NULL,
    nutritional_info JSONB,
    cuisine_type VARCHAR(100),
    tags JSONB DEFAULT '[]',
    source VARCHAR(255), -- source website/book
    popularity_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recipe_db_ingredients ON recipe_database USING GIN(ingredients);
CREATE INDEX idx_recipe_db_tags ON recipe_database USING GIN(tags);
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Recipe Generation
- `POST /api/recipes/generate` - Generate recipe from ingredients
- `POST /api/recipes/generate/stream` - WebSocket for streaming generation
- `POST /api/recipes/modify` - Modify existing recipe (dietary, servings)
- `GET /api/recipes/suggestions` - Get recipe suggestions based on pantry

### Recipe Management
- `GET /api/recipes` - List all recipes (with filters)
- `GET /api/recipes/:id` - Get single recipe
- `POST /api/recipes` - Create custom recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe
- `POST /api/recipes/:id/favorite` - Add to favorites
- `GET /api/recipes/favorites` - Get user's favorites

### Meal Planning
- `GET /api/meal-plans` - List meal plans
- `POST /api/meal-plans` - Create meal plan
- `GET /api/meal-plans/:id` - Get meal plan
- `PUT /api/meal-plans/:id` - Update meal plan
- `DELETE /api/meal-plans/:id` - Delete meal plan
- `GET /api/meal-plans/:id/shopping-list` - Get shopping list
- `POST /api/meal-plans/auto-generate` - AI-generated meal plan

### Nutrition Analysis
- `POST /api/nutrition/analyze` - Analyze recipe nutrition
- `GET /api/nutrition/daily-summary` - Get daily nutrition summary
- `POST /api/nutrition/calculate` - Calculate nutrition for ingredients

### Search
- `GET /api/search/recipes` - Search recipes with filters
- `GET /api/search/ingredients` - Search ingredients
- `GET /api/search/similar` - Find similar recipes

## AI Integration Strategy

### Claude API Usage

#### 1. Recipe Generation
```typescript
// Prompt template for generating recipes
const generateRecipePrompt = (ingredients: string[], preferences: UserPreferences) => `
Generate a detailed recipe using the following ingredients: ${ingredients.join(', ')}

User preferences:
- Dietary restrictions: ${preferences.dietary}
- Allergies: ${preferences.allergies}
- Skill level: ${preferences.skillLevel}
- Cuisine preference: ${preferences.cuisine || 'any'}

Please provide:
1. Recipe title
2. Description (2-3 sentences)
3. Prep time and cook time
4. Difficulty level
5. Complete ingredient list with measurements
6. Step-by-step instructions
7. Cooking tips
8. Nutritional information estimate

Format the response as JSON matching this schema:
{
  "title": string,
  "description": string,
  "prepTime": number,
  "cookTime": number,
  "difficulty": "easy" | "medium" | "hard",
  "servings": number,
  "ingredients": [{name: string, amount: number, unit: string}],
  "instructions": [{step: number, instruction: string, time?: number}],
  "tips": string[],
  "nutritionalInfo": {calories: number, protein: number, carbs: number, fat: number}
}
`;
```

#### 2. Recipe Modification
```typescript
const modifyRecipePrompt = (recipe: Recipe, modifications: Modifications) => `
Modify the following recipe according to these requirements:

Original Recipe:
${JSON.stringify(recipe, null, 2)}

Modifications:
- Dietary: ${modifications.dietary || 'none'}
- Servings: ${modifications.servings || recipe.servings}
- Substitute ingredients: ${JSON.stringify(modifications.substitutes || {})}
- Reduce/increase: ${modifications.adjust || 'none'}

Provide the modified recipe in the same JSON format, ensuring all measurements are adjusted proportionally.
`;
```

#### 3. Meal Plan Generation
```typescript
const generateMealPlanPrompt = (days: number, preferences: UserPreferences, goals: string) => `
Create a ${days}-day meal plan with the following criteria:

User Profile:
- Dietary preferences: ${preferences.dietary}
- Allergies: ${preferences.allergies}
- Daily calorie target: ${preferences.calorieTarget || 'balanced'}
- Meals per day: ${preferences.mealsPerDay || 3}

Goals: ${goals}

For each day, provide breakfast, lunch, dinner (and snacks if requested).
Include variety across the week and ensure nutritional balance.

Return as JSON array with structure:
[
  {
    "day": number,
    "date": string,
    "meals": {
      "breakfast": {recipe details},
      "lunch": {recipe details},
      "dinner": {recipe details}
    },
    "dailyNutrition": {calories, protein, carbs, fat}
  }
]
`;
```

### Recipe Database Integration

#### Hybrid Approach Workflow:
1. **Check existing database** - Search PostgreSQL for similar recipes
2. **Use as context** - Feed existing recipes to Claude as examples
3. **Generate with AI** - Create new recipe using Claude
4. **Validate & enhance** - Compare with database, ensure quality
5. **Store result** - Save to user's recipes

#### Example Hybrid Query:
```typescript
async function generateHybridRecipe(ingredients: string[]) {
  // 1. Search existing database for similar recipes
  const similarRecipes = await searchRecipeDatabase(ingredients);
  
  // 2. Build context from database
  const context = similarRecipes.map(r => ({
    title: r.title,
    ingredients: r.ingredients,
    popularity: r.popularity_score
  }));
  
  // 3. Generate with Claude using context
  const prompt = `
    Here are some popular recipes with similar ingredients:
    ${JSON.stringify(context, null, 2)}
    
    Now create a new, unique recipe using: ${ingredients.join(', ')}
    Make it different from the examples but inspired by proven combinations.
  `;
  
  const aiRecipe = await callClaudeAPI(prompt);
  
  // 4. Enhance with database insights
  const enhanced = await enhanceWithNutrition(aiRecipe);
  
  return enhanced;
}
```

## Core Features Implementation

### Feature 1: Generate Recipes from Ingredients

**Frontend Component:**
```typescript
// src/components/RecipeGenerator.tsx
interface RecipeGeneratorProps {
  onRecipeGenerated: (recipe: Recipe) => void;
}

export function RecipeGenerator({ onRecipeGenerated }: RecipeGeneratorProps) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({});
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // WebSocket connection for streaming
    const ws = new WebSocket('ws://api/recipes/generate/stream');
    
    ws.send(JSON.stringify({ ingredients, preferences }));
    
    ws.onmessage = (event) => {
      const chunk = JSON.parse(event.data);
      // Update UI with streaming chunks
      updateRecipePreview(chunk);
    };
    
    ws.onclose = () => {
      setIsGenerating(false);
    };
  };
  
  return (
    <div className="recipe-generator">
      <IngredientInput 
        ingredients={ingredients}
        onUpdate={setIngredients}
      />
      <PreferencesSelector 
        preferences={preferences}
        onChange={setPreferences}
      />
      <Button 
        onClick={handleGenerate}
        disabled={isGenerating || ingredients.length === 0}
      >
        {isGenerating ? 'Generating...' : 'Generate Recipe'}
      </Button>
    </div>
  );
}
```

**Backend Service:**
```typescript
// src/services/recipeAIService.ts
import Anthropic from '@anthropic-ai/sdk';

export class RecipeAIService {
  private anthropic: Anthropic;
  
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  
  async generateRecipe(ingredients: string[], preferences: UserPreferences) {
    const prompt = this.buildRecipePrompt(ingredients, preferences);
    
    const stream = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }],
      stream: true,
    });
    
    return stream;
  }
  
  async modifyRecipe(recipe: Recipe, modifications: Modifications) {
    const prompt = this.buildModificationPrompt(recipe, modifications);
    
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }],
    });
    
    return this.parseRecipeResponse(response.content[0].text);
  }
  
  private buildRecipePrompt(ingredients: string[], preferences: UserPreferences): string {
    // Implementation from earlier section
  }
}
```

### Feature 2: Nutritional Analysis

**Calculation Service:**
```typescript
// src/services/nutritionService.ts
import { USDA_API_KEY } from '../config';

export class NutritionService {
  async analyzeRecipe(recipe: Recipe): Promise<NutritionalInfo> {
    const ingredientNutrition = await Promise.all(
      recipe.ingredients.map(ing => this.getIngredientNutrition(ing))
    );
    
    return this.aggregateNutrition(ingredientNutrition, recipe.servings);
  }
  
  private async getIngredientNutrition(ingredient: Ingredient) {
    // Check cache first
    const cached = await this.cache.get(`nutrition:${ingredient.name}`);
    if (cached) return cached;
    
    // Call USDA API or use Claude for estimation
    const nutrition = await this.fetchFromUSDA(ingredient);
    
    // Cache result
    await this.cache.set(`nutrition:${ingredient.name}`, nutrition, 86400);
    
    return nutrition;
  }
  
  private aggregateNutrition(items: NutritionData[], servings: number) {
    const total = items.reduce((acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
      fiber: acc.fiber + item.fiber,
      sodium: acc.sodium + item.sodium,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 });
    
    // Per serving
    return Object.fromEntries(
      Object.entries(total).map(([key, value]) => [key, value / servings])
    );
  }
}
```

### Feature 3: Meal Planning

**Meal Plan Generator:**
```typescript
// src/services/mealPlanService.ts
export class MealPlanService {
  constructor(
    private aiService: RecipeAIService,
    private nutritionService: NutritionService
  ) {}
  
  async generateMealPlan(
    userId: string,
    days: number,
    preferences: UserPreferences,
    goals: MealPlanGoals
  ): Promise<MealPlan> {
    // Get user's dietary preferences
    const user = await this.userService.getUser(userId);
    
    // Generate meal plan with Claude
    const plan = await this.aiService.generateMealPlan(
      days,
      { ...preferences, ...user.dietary_preferences },
      goals
    );
    
    // Validate nutritional balance
    const validated = await this.validateNutrition(plan, goals);
    
    // Generate shopping list
    const shoppingList = this.generateShoppingList(validated);
    
    // Save to database
    return await this.saveMealPlan({
      userId,
      plan: validated,
      shoppingList,
    });
  }
  
  private generateShoppingList(plan: MealPlan): ShoppingList {
    const ingredientMap = new Map<string, IngredientSum>();
    
    plan.meals.forEach(meal => {
      meal.recipe.ingredients.forEach(ing => {
        const key = ing.name.toLowerCase();
        const existing = ingredientMap.get(key) || { name: ing.name, amount: 0, unit: ing.unit };
        existing.amount += ing.amount;
        ingredientMap.set(key, existing);
      });
    });
    
    return {
      items: Array.from(ingredientMap.values()).map(item => ({
        ...item,
        checked: false,
        category: this.categorizeIngredient(item.name)
      })),
      organized: true
    };
  }
}
```

## Frontend Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── recipe/
│   │   │   ├── RecipeGenerator.tsx
│   │   │   ├── RecipeCard.tsx
│   │   │   ├── RecipeDetail.tsx
│   │   │   ├── RecipeEditor.tsx
│   │   │   └── IngredientInput.tsx
│   │   ├── meal-plan/
│   │   │   ├── MealPlanCalendar.tsx
│   │   │   ├── MealPlanGenerator.tsx
│   │   │   └── ShoppingList.tsx
│   │   ├── nutrition/
│   │   │   ├── NutritionChart.tsx
│   │   │   ├── MacroBreakdown.tsx
│   │   │   └── DailyTracker.tsx
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Loading.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Footer.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── RecipesPage.tsx
│   │   ├── MealPlanPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── SearchPage.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── websocket.ts
│   ├── store/
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── recipesSlice.ts
│   │   │   └── mealPlanSlice.ts
│   │   └── store.ts
│   ├── hooks/
│   │   ├── useRecipes.ts
│   │   ├── useMealPlan.ts
│   │   └── useAuth.ts
│   ├── types/
│   │   ├── recipe.ts
│   │   ├── user.ts
│   │   └── nutrition.ts
│   └── utils/
│       ├── formatters.ts
│       ├── validators.ts
│       └── constants.ts
└── package.json
```

## Backend Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── recipeController.ts
│   │   ├── mealPlanController.ts
│   │   └── nutritionController.ts
│   ├── services/
│   │   ├── recipeAIService.ts
│   │   ├── nutritionService.ts
│   │   ├── mealPlanService.ts
│   │   ├── searchService.ts
│   │   └── userService.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Recipe.ts
│   │   ├── MealPlan.ts
│   │   └── Collection.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── recipes.ts
│   │   ├── mealPlans.ts
│   │   └── nutrition.ts
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── environment.ts
│   ├── utils/
│   │   ├── prompts.ts
│   │   ├── validators.ts
│   │   └── helpers.ts
│   └── app.ts
└── package.json
```

## Deployment Strategy

### Docker Setup
```dockerfile
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://backend:5000
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/recipes
      - REDIS_URL=redis://redis:6379
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=recipes
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

### Environment Variables
```bash
# .env.example

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/recipe_maker
REDIS_URL=redis://localhost:6379

# API Keys
ANTHROPIC_API_KEY=your_claude_api_key
USDA_API_KEY=your_usda_api_key (optional)

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=7d

# AWS (for image storage)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=recipe-images

# App Config
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourapp.com

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100
```

## Security Considerations

1. **Authentication**: JWT with httpOnly cookies
2. **API Rate Limiting**: Redis-based rate limiter
3. **Input Validation**: Zod schemas on all endpoints
4. **SQL Injection Prevention**: Parameterized queries
5. **XSS Protection**: Content Security Policy headers
6. **CORS**: Whitelist frontend domain
7. **API Key Protection**: Never expose Claude API key to frontend
8. **User Data**: Hash passwords with bcrypt (cost factor 12)

## Performance Optimization

1. **Database Indexing**: Index on user_id, tags, ingredients
2. **Redis Caching**: Cache recipe searches, nutrition data
3. **CDN**: Serve static assets and images via CDN
4. **Lazy Loading**: Code split React components
5. **WebSocket**: Stream AI responses for better UX
6. **Database Pooling**: pg-pool for connection management
7. **Response Compression**: gzip/brotli middleware

## Monitoring & Analytics

1. **Error Tracking**: Sentry integration
2. **Performance**: New Relic / DataDog
3. **Analytics**: PostHog / Mixpanel for user events
4. **Logs**: Winston + Elasticsearch + Kibana
5. **Alerts**: PagerDuty for critical failures

## Future Enhancements

1. **Mobile Apps**: React Native version
2. **Voice Commands**: Integration with voice assistants
3. **Image Recognition**: Upload food images to generate recipes
4. **Social Features**: Share recipes, follow users
5. **Recipe Videos**: AI-generated cooking videos
6. **Smart Substitutions**: Auto-suggest ingredient swaps
7. **Grocery Integration**: Order ingredients directly
8. **Cooking Mode**: Step-by-step voice guidance
9. **Multi-language**: i18n support
10. **Offline Mode**: PWA with service workers
