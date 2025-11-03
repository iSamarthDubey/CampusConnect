# CampusConnect Setup Guide

## Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Git
- Supabase account (free tier works)

## Quick Start

### 1. Clone and Install

```bash
# Install frontend deps
cd apps/web
npm install

# Install backend deps
cd ../api
pip install -r requirements.txt
# OR use uv/poetry for better dependency management
```

### 2. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for project to provision (~2 mins)
3. Go to Project Settings → API:
   - Copy `Project URL` → `SUPABASE_URL`
   - Copy `anon public` key → `SUPABASE_ANON_KEY`
   - Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
4. Go to Project Settings → Database:
   - Copy connection string → `DATABASE_URL`
5. Go to SQL Editor, paste contents of `infra/supabase/schema.sql`, run
6. Go to Storage → Create buckets:
   - `lost_items` (public read)
   - `avatars` (public read)
7. Go to Authentication → Providers:
   - Enable Email
   - (Optional) Enable Google OAuth

### 3. Environment Variables

**Frontend** (`apps/web/.env.local`):
```bash
cp apps/web/.env.example apps/web/.env.local
# Edit and fill in your Supabase keys
```

**Backend** (`apps/api/.env`):
```bash
cp apps/api/.env.example apps/api/.env
# Edit and fill in your Supabase keys + DATABASE_URL
# Generate JWT secret: openssl rand -hex 32
```

### 4. Run Development Servers

**Frontend**:
```bash
cd apps/web
npm run dev
# Opens at http://localhost:3000
```

**Backend** (separate terminal):
```bash
cd apps/api
uvicorn app.main:app --reload
# Opens at http://localhost:8000
# API docs at http://localhost:8000/docs
```

## Project Structure

```
CampusConnect/
├── apps/
│   ├── web/                Next.js frontend
│   │   ├── src/
│   │   │   ├── app/        App Router pages
│   │   │   ├── components/ React components
│   │   │   └── lib/        Utils, API client
│   │   └── public/         Static assets
│   └── api/                FastAPI backend
│       ├── app/
│       │   ├── api/v1/     API routes
│       │   ├── core/       Config, security
│       │   ├── models/     DB models
│       │   └── services/   Business logic
│       └── tests/
├── infra/
│   └── supabase/           DB schema, RLS policies
└── packages/
    └── shared/             Shared types (future)
```

## Development Workflow

### Week 1-2: Auth + User Management
1. Implement signup/login endpoints in `apps/api/app/api/v1/endpoints/auth.py`
2. Create auth pages in `apps/web/src/app/(auth)/`
3. Build profile setup flow
4. Add admin panel shell

### Week 3-4: Lost & Found
1. Item CRUD endpoints
2. Image upload to Supabase Storage
3. Text search
4. Image embedding + similarity search (use sentence-transformers)

### Week 5-6: Events
1. Event CRUD
2. RSVP system
3. ICS export
4. Event listing + filters

### Week 7-8: Timetable + Free Slots
1. Schedule upload (CSV/ICS parser)
2. Personal timetable view
3. Free slot finder algorithm

### Week 9: Anonymous Feedback
1. Token generation (admin)
2. Feedback submission (token-based)
3. Moderation dashboard

### Week 10: Polish + Deploy
1. PWA manifest + icons
2. Responsive design
3. Deploy: Vercel (web) + Railway (api)
4. Seed demo data

## Testing

```bash
# Frontend (add tests later)
cd apps/web
npm test

# Backend
cd apps/api
pytest
```

## Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Import repo in Vercel
3. Set root directory: `apps/web`
4. Add env vars from `.env.local`
5. Deploy

### Backend (Railway)
1. Create new project in Railway
2. Add PostgreSQL service (or use Supabase DB)
3. Add Python service, point to `apps/api`
4. Add env vars from `.env`
5. Deploy

## Troubleshooting

**CORS errors**: Check `BACKEND_CORS_ORIGINS` in API `.env`
**DB connection**: Verify `DATABASE_URL` format and Supabase connection pooler settings
**ML models slow**: First run downloads models (~500MB), cache in `.cache/`
**PWA not installing**: Build production mode (`npm run build && npm start`) to test

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [pgvector Guide](https://github.com/pgvector/pgvector)

