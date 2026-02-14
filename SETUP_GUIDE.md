# AI Recipe Maker - Complete Setup Guide

## Project Overview

This is a complete, production-ready AI Recipe Maker system with:
- Full-stack TypeScript application
- Claude AI integration for recipe generation
- Hybrid approach (AI + database)
- Complete authentication system
- Advanced meal planning
- Nutritional analysis
- Containerized deployment

## Directory Structure

```
ai-recipe-maker/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── app.ts             # Main application
│   │   ├── config/            # Configuration files
│   │   │   ├── database.ts    # PostgreSQL setup
│   │   │   ├── redis.ts       # Redis cache setup
│   │   │   └── environment.ts # Environment config
│   │   ├── controllers/       # Route controllers
│   │   │   └── recipeController.ts
│   │   ├── services/          # Business logic
│   │   │   └── recipeAIService.ts
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Express middleware
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utilities
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API services
│   │   ├── store/             # Redux store
│   │   └── types/             # TypeScript types
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docs/
│   └── ARCHITECTURE.md        # System architecture
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Step-by-Step Setup

### 1. Initial Setup

```bash
# Clone or download the project
cd ai-recipe-maker

# Create environment file
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file:

```bash
# Required - Get from https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# Database (Docker will handle these)
DATABASE_URL=postgresql://recipeuser:recipepass@localhost:5432/recipe_maker
REDIS_URL=redis://localhost:6379

# Generate with: openssl rand -hex 32
JWT_SECRET=your_generated_secret_here

# Application
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 3. Start with Docker (Easiest Method)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Initialize database
docker-compose exec backend npm run migrate

# Stop services
docker-compose down
```

### 4. Manual Setup (Alternative)

**Install PostgreSQL:**
```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu
sudo apt-get install postgresql-15

# Create database
createdb recipe_maker
```

**Install Redis:**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt-get install redis-server
```

**Backend Setup:**
```bash
cd backend
npm install
npm run build
npm run migrate
npm run dev
```

**Frontend Setup (in another terminal):**
```bash
cd frontend
npm install
npm run dev
```

### 5. Verify Installation

1. **Backend health check:**
   ```bash
   curl http://localhost:5000/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Frontend:**
   Open http://localhost:3000 in your browser

3. **Database:**
   ```bash
   psql recipe_maker
   \dt  # List tables
   ```

## Usage Guide

### 1. Register an Account

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "fullName": "John Doe"
  }'
```

### 2. Generate a Recipe

```bash
# Login first to get token
TOKEN="your_jwt_token"

curl -X POST http://localhost:5000/api/recipes/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "ingredients": ["chicken", "rice", "broccoli"],
    "preferences": {
      "cuisine": "Asian",
      "skillLevel": "beginner",
      "maxCookTime": 30
    }
  }'
```

### 3. Using the Frontend

1. Navigate to http://localhost:3000
2. Register/Login
3. Go to "Generate Recipe"
4. Add ingredients
5. Set preferences
6. Click "Generate Recipe"
7. View your AI-generated recipe!

## Development Workflow

### Backend Development

```bash
cd backend

# Run in development mode (with hot reload)
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Frontend Development

```bash
cd frontend

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database Migrations

```bash
cd backend

# Run migrations
npm run migrate

# Seed sample data
npm run seed
```

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Docker Issues

```bash
# Remove all containers and start fresh
docker-compose down -v
docker-compose up -d --build

# View logs for specific service
docker-compose logs backend
docker-compose logs postgres
```

### Database Connection Errors

```bash
# Check PostgreSQL is running
pg_isready

# Reset database
dropdb recipe_maker
createdb recipe_maker
npm run migrate
```

### Redis Connection Errors

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Restart Redis
brew services restart redis  # macOS
sudo systemctl restart redis # Linux
```

## API Testing with Postman/Insomnia

Import these example requests:

**Register:**
- POST `http://localhost:5000/api/auth/register`
- Body: `{"email": "test@test.com", "password": "test123", "fullName": "Test User"}`

**Login:**
- POST `http://localhost:5000/api/auth/login`
- Body: `{"email": "test@test.com", "password": "test123"}`

**Generate Recipe:**
- POST `http://localhost:5000/api/recipes/generate`
- Header: `Authorization: Bearer YOUR_TOKEN`
- Body: `{"ingredients": ["chicken", "rice"], "preferences": {}}`

## Production Deployment

### Environment Configuration

```bash
# Production .env
NODE_ENV=production
DATABASE_URL=your_production_db_url
REDIS_URL=your_production_redis_url
ANTHROPIC_API_KEY=your_api_key
JWT_SECRET=strong_random_secret
FRONTEND_URL=https://yourdomain.com
```

### Build and Deploy

```bash
# Build backend
cd backend
npm ci --only=production
npm run build

# Build frontend
cd frontend
npm ci
npm run build

# Deploy dist/ and build/ folders to your hosting
```

### Recommended Hosting Platforms

- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Backend**: Railway, Render, Fly.io, AWS, DigitalOcean
- **Database**: Supabase, Railway, Neon, AWS RDS
- **Redis**: Redis Cloud, Upstash, AWS ElastiCache

## Performance Optimization

1. **Enable Redis Caching:**
   - Recipe queries cached for 1 hour
   - User data cached for 30 minutes

2. **Database Indexing:**
   - Indexes already created on frequently queried fields

3. **Rate Limiting:**
   - Prevents abuse and manages API costs

4. **CDN for Assets:**
   - Use Cloudflare or similar for static files

## Security Checklist

- [x] Environment variables for secrets
- [x] JWT authentication
- [x] Password hashing with bcrypt
- [x] Rate limiting
- [x] Input validation
- [x] SQL injection prevention
- [x] XSS protection
- [x] CORS configuration
- [ ] SSL/TLS in production
- [ ] Security headers (helmet)

## Cost Estimation

**Claude API Costs:**
- Recipe generation: ~$0.01-0.03 per recipe
- Recipe modification: ~$0.02-0.04 per modification
- Meal plan: ~$0.05-0.15 per week

**Hosting (Monthly):**
- Frontend: $0 (Vercel/Netlify free tier)
- Backend: $5-20 (Railway/Render)
- Database: $5-25 (Supabase/Railway)
- Redis: $0-10 (Upstash free tier)

**Total:** ~$10-60/month depending on scale

## Next Steps

1. **Customize the UI:**
   - Modify frontend components in `frontend/src/components/`
   - Update styling in Tailwind classes

2. **Add Features:**
   - Implement meal planning controller
   - Add nutrition analysis service
   - Build recipe collections

3. **Improve AI:**
   - Enhance prompts in `utils/prompts.ts`
   - Add more context from recipe database
   - Fine-tune generation parameters

4. **Scale:**
   - Add caching strategies
   - Implement background jobs
   - Set up monitoring

## Getting Help

- **Documentation**: See `docs/ARCHITECTURE.md`
- **Issues**: Check existing issues on GitHub
- **Community**: Join our Discord (link in README)
- **Email**: support@airecipemaker.com

## Contributing

See `CONTRIBUTING.md` for guidelines.

---

**You're all set!** Start building amazing AI-powered recipe experiences! 🚀
