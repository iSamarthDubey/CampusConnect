# CampusConnect

Monorepo for Smart Campus Assistant (minor project).

Structure
- apps/web: Next.js + Tailwind (PWA)
- apps/api: FastAPI (Python)
- infra/supabase: SQL schema, RLS, seed
- packages/shared: shared TS types (OpenAPI client later)

Quick start
1) Copy env files from .env.example to .env in root, web, api
2) Install deps
- web: npm i
- api: uv/poetry/pip install -r requirements.txt
3) Run
- web: npm run dev
- api: uvicorn app.main:app --reload


