# 🍳 AI Recipe Maker

An intelligent, full-stack web application that uses AI to generate, modify, and plan recipes with comprehensive nutritional analysis and meal planning capabilities.

## ✨ Features

- **AI Recipe Generation**: Generate unique recipes from available ingredients using Claude AI
- **Recipe Modification**: Adapt recipes for dietary restrictions, servings, and preferences
- **Meal Planning**: Create weekly meal plans with automated shopping lists
- **Nutritional Analysis**: Detailed nutritional breakdowns for all recipes
- **Hybrid AI Approach**: Combines Claude AI with curated recipe database for best results
- **User Profiles**: Save preferences, favorites, and dietary restrictions
- **Search & Filter**: Advanced recipe search with multiple filters
- **Collections**: Organize recipes into custom collections

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Redux Toolkit for state management
- Tailwind CSS for styling
- React Query for data fetching
- Vite for build tooling

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL for data storage
- Redis for caching
- Claude API for AI generation
- JWT authentication

**Infrastructure:**
- Docker & Docker Compose
- Nginx reverse proxy
- CI/CD with GitHub Actions

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)
- Anthropic API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ai-recipe-maker.git
cd ai-recipe-maker
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `ANTHROPIC_API_KEY`: Your Claude API key (see below)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret key for JWT tokens (generate with `openssl rand -hex 32`)

**Getting an Anthropic API key (for recipe generation):**

1. Go to [Anthropic Console](https://console.anthropic.com/) and sign up or log in.
2. Open **API Keys** and create a key. New accounts often get a small amount of free credit to try the API.
3. Put the key in `.env` as `ANTHROPIC_API_KEY=sk-ant-api03-...`. If you use Docker, the same `.env` is used so the backend container gets the key.
4. There is no permanent free tier; after credits run out you add payment. Keep the key secret and never commit it.

3. **Using Docker (Recommended)**

   **Production (default)** — code is baked into the image; changes require rebuild. Schema is created automatically on first backend start.
   ```bash
   docker-compose up -d
   # optional: docker-compose exec backend npm run seed
   ```

   **Development** — source is mounted; backend and frontend pick up changes automatically (nodemon + Vite HMR). Run with `--build` the first time (and when changing `Dockerfile.dev`):
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
   ```
   After that, `up` without `--build` is enough for code changes.

4. **Manual Setup**

**Backend:**
```bash
cd backend
npm install
npm run build
npm run migrate
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Access the Application

- **Frontend:** http://localhost:3000  
  Main routes: `/` (home), `/login`, `/register`, `/generate`, `/recipes`, `/recipes/:id`, `/meal-plans`, `/meal-plans/:id`, `/nutrition`, `/search`, `/profile`.  
  Log in or register to use Generate, Recipes, Meal Plans, Nutrition, and Profile.
- **Backend API:** http://localhost:5000  
  Health: http://localhost:5000/health

## 📖 API Documentation

### Authentication Endpoints

```
POST /api/auth/register - Register new user
POST /api/auth/login    - Login user
POST /api/auth/logout   - Logout user
GET  /api/auth/me       - Get current user
PUT  /api/auth/profile  - Update user profile
```

### Recipe Endpoints

```
POST   /api/recipes/generate        - Generate recipe from ingredients
POST   /api/recipes/modify/:id      - Modify existing recipe
POST   /api/recipes/suggestions     - Get recipe suggestions
GET    /api/recipes                 - List all recipes (with filters)
GET    /api/recipes/:id             - Get single recipe
POST   /api/recipes                 - Create custom recipe
PUT    /api/recipes/:id             - Update recipe
DELETE /api/recipes/:id             - Delete recipe
POST   /api/recipes/:id/favorite    - Add to favorites
GET    /api/recipes/favorites/list  - Get user's favorites
```

### Meal Plan Endpoints

```
POST   /api/meal-plans/generate         - Generate meal plan
GET    /api/meal-plans                  - List meal plans
GET    /api/meal-plans/:id              - Get meal plan
PUT    /api/meal-plans/:id              - Update meal plan
DELETE /api/meal-plans/:id              - Delete meal plan
GET    /api/meal-plans/:id/shopping-list - Get shopping list
```

### Nutrition Endpoints

```
POST /api/nutrition/analyze        - Analyze recipe nutrition
GET  /api/nutrition/daily-summary  - Get daily nutrition summary
POST /api/nutrition/calculate      - Calculate nutrition for ingredients
```

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available configuration options.

### Rate Limiting

- Standard endpoints: 100 requests per 15 minutes
- AI generation: 20 requests per 15 minutes
- Authentication: 5 requests per 15 minutes

### Database Schema

The database schema is automatically created on first run. Key tables:
- `users` - User accounts and preferences
- `recipes` - Generated and custom recipes
- `meal_plans` - User meal plans
- `recipe_database` - Curated recipe database for hybrid approach
- `user_favorites` - User favorite recipes

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Using Docker

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

1. Build backend:
```bash
cd backend
npm run build
```

2. Build frontend:
```bash
cd frontend
npm run build
```

3. Deploy built files to your hosting provider (AWS, DigitalOcean, Railway, etc.)

### Environment-Specific Configuration

- **Development**: Use `.env` file
- **Production**: Set environment variables in your hosting platform
- **Staging**: Use `.env.staging`

## 🔐 Security

- JWT-based authentication with httpOnly cookies
- Password hashing with bcrypt
- Rate limiting on all endpoints
- Input validation with Zod schemas
- SQL injection prevention with parameterized queries
- XSS protection with helmet middleware
- CORS configuration

## 📊 Monitoring

- Error tracking: Configure Sentry (optional)
- Logging: Winston logs to `logs/` directory
- Health checks: `/health` endpoint
- Metrics: Prometheus-compatible (can be added)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow conventional commits

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude API
- [USDA FoodData Central](https://fdc.nal.usda.gov/) for nutritional data
- All open-source libraries used in this project

## 📧 Support

For support, email support@airecipemaker.com or open an issue on GitHub.

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Voice command integration
- [ ] Image recognition for ingredient detection
- [ ] Social features (share recipes, follow users)
- [ ] Recipe video generation
- [ ] Grocery delivery integration
- [ ] Multi-language support
- [ ] Offline mode (PWA)

## 🎯 Getting Your API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste it into your `.env` file

**Note:** Keep your API key secret and never commit it to version control!

---

Made with ❤️ and powered by Claude AI
