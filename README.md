# 🍳 AI Recipe Maker

A full-stack web app that uses **Claude AI** to generate, modify, and plan recipes from your ingredients—with nutrition analysis, meal plans, search, and collections.

Turn what you have into what you eat: describe ingredients and preferences, get tailored recipes and weekly plans, track nutrition, and organize everything in one place.

---

## ✨ Features

**Recipe creation & editing**
- **AI generation** — Generate recipes from available ingredients using Claude; get title, description, cuisine, meal type, difficulty, times, servings, ingredients, steps, nutrition, health benefits, and a working image URL.
- **Modify recipe** — Change servings, dietary needs, or ingredients; AI returns an updated recipe with validated image URL.
- **Edit & custom recipes** — Edit any recipe or create one manually; all recipes support full nutrition and images.

**Discovery & organization**
- **Search & filter** — Search by name; filter by cuisine, meal type, difficulty, max time; combine with curated and AI-generated recipes.
- **Collections** — Create collections and add recipes; view and manage them from Collections and collection detail pages.
- **Favorites** — Mark recipes as favorites and access them from a dedicated Favorites page.

**Meal planning & nutrition**
- **Meal plans** — Generate weekly meal plans; view plan detail and delete plans; shopping list support.
- **Nutrition** — Per-recipe nutritional breakdown; daily summary and nutrition goals in Profile.

**Account & auth**
- **User profiles** — Save dietary restrictions, preferences, and nutrition goals.
- **Auth** — Email/password and optional Google OAuth; JWT in httpOnly cookies; protected routes for generate, recipes, meal plans, nutrition, profile, favorites, and collections.

---

## 🏗️ Architecture

**Stack**
- **Frontend:** React 18, TypeScript, Redux Toolkit, Tailwind CSS, React Query, Vite.
- **Backend:** Node.js, Express, TypeScript, PostgreSQL, Redis, Claude (Anthropic) API, JWT auth.
- **Ops:** Docker & Docker Compose, Nginx reverse proxy; CI/CD via GitHub Actions.

**Project layout**
- Backend lives in the **repository root** (`app.ts`, routes, controllers, services).
- Frontend lives in **`frontend/`** (Vite + React app).

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)
- [Anthropic API key](https://console.anthropic.com/) for AI recipe generation

### 1. Clone and env

```bash
git clone https://github.com/yourusername/ai-recipe-maker.git
cd ai-recipe-maker
```

Create `.env` in the project root (or copy from `.env.example` if present). Required:

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key from [Anthropic Console](https://console.anthropic.com/) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret for JWT (e.g. `openssl rand -hex 32`) |

**Anthropic API key:** Sign up at [console.anthropic.com](https://console.anthropic.com/) → API Keys → create a key. New accounts often get trial credit. Set `ANTHROPIC_API_KEY=sk-ant-api03-...` in `.env`. Never commit the key.

### 2. Run with Docker (recommended)

**Production (image built from source):**
```bash
docker-compose up -d
# optional: docker-compose exec backend npm run seed
```
Schema is created on first backend start.

**Development (mounted source, hot reload):**
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```
Use `up` without `--build` afterward unless you change Dockerfile.dev.

### 3. Manual run

**Backend (from project root):**
```bash
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

### Access

| What | URL |
|------|-----|
| App | http://localhost:3000 |
| API | http://localhost:5000 |
| Health | http://localhost:5000/health |

**Routes (SPA):** `/` (home), `/login`, `/register`, `/google-auth`, `/search` — public.  
**Protected (login required):** `/generate`, `/recipes`, `/recipes/:id`, `/recipes/:id/edit`, `/meal-plans`, `/meal-plans/:id`, `/nutrition`, `/profile`, `/favorites`, `/collections`, `/collections/:id`.  
Any unknown path → `/404`.

---

## 📖 API Overview

Base: `http://localhost:5000/api`

| Area | Endpoints |
|------|-----------|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `PUT /auth/profile` |
| **Recipes** | `POST /recipes/generate`, `POST /recipes/modify/:id`, `POST /recipes/suggestions`, `GET /recipes`, `GET /recipes/:id`, `POST /recipes`, `PUT /recipes/:id`, `DELETE /recipes/:id`, `POST /recipes/:id/favorite`, `GET /recipes/favorites/list` |
| **Meal plans** | `POST /meal-plans/generate`, `GET /meal-plans`, `GET /meal-plans/:id`, `PUT /meal-plans/:id`, `DELETE /meal-plans/:id`, `GET /meal-plans/:id/shopping-list` |
| **Nutrition** | `POST /nutrition/analyze`, `GET /nutrition/daily-summary`, `POST /nutrition/calculate` |
| **Search** | Search/filter recipes (see backend `search` routes) |
| **Collections** | CRUD for user collections and recipe membership |
| **Admin** | Optional: seed/update TheMealDB, enrich curated health data |

---

## 🔧 Configuration

- **Env:** All options (including optional Google OAuth, etc.) are documented in `.env.example` when present; otherwise configure from the table above and backend `environment.ts`.
- **Rate limits:** General ~100/15min; AI generation ~20/15min; auth ~5/15min (exact values in `rateLimiter.ts`).
- **Schema:** Created on first run. Main tables: `users`, `recipes`, `meal_plans`, `recipe_database`, `user_favorites`, collections tables.

---

## 🧪 Tests

```bash
# Backend (from project root if tests live there)
npm test

# Frontend
cd frontend && npm test
```

---

## 📦 Deployment

**Docker:**
```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

**Manual:** Build backend in root (`npm run build`), build frontend in `frontend/` (`npm run build`), then deploy the built backend and `frontend/dist` (or static host for frontend) to your provider. Set production env vars on the host.

---

## 🔐 Security

- JWT in httpOnly cookies; bcrypt for passwords; rate limiting; Zod validation; parameterized SQL; Helmet and CORS.

---

## 📝 License

MIT — see [LICENSE](LICENSE).

---

## 🙏 Credits

- [Anthropic](https://www.anthropic.com/) — Claude API  
- [USDA FoodData Central](https://fdc.nal.usda.gov/) — nutritional data  
- [TheMealDB](https://www.themealdb.com/) — curated meal images and data

---

## 🗺️ Roadmap

- [ ] Mobile app (e.g. React Native)
- [ ] Voice / image input for ingredients
- [ ] Social (share, follow)
- [ ] Recipe video, grocery delivery, i18n, PWA/offline

---

Made with ❤️ and Claude AI
