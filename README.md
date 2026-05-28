# Career Bridge

A mobile-first web application for [Bridge to Thrive](https://bridgetothrive.org)'s Career Bridge program — helping men in recovery track job search progress, access career resources, and discover opportunities in the St. Paul area.

## Features

- **Accountability tracking** — Participants log applications, networking, interviews, and training. Program managers review activity and leave feedback.
- **Career resources** — Curated guides on career paths (trades, warehouse, hospitality) and job search skills.
- **Local job listings** — Highlighted opportunities in St. Paul and the Twin Cities metro.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router, full-stack)
- [React 19](https://react.dev/) + [Tailwind CSS 4](https://tailwindcss.com/)
- [Prisma 7](https://www.prisma.io/) + PostgreSQL
- [Auth.js (NextAuth v5)](https://authjs.dev/) with role-based access (Participant / Manager / Admin)

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL (local, or use Railway's Postgres plugin)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and AUTH_SECRET

# Run database migrations
npm run db:migrate

# Seed demo data
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts

After seeding, sign in with:

| Role        | Email                          | Password  |
|-------------|--------------------------------|-----------|
| Manager     | manager@bridgetothrive.org     | demo1234  |
| Participant | participant@bridgetothrive.org | demo1234  |

## Deploy to Railway

Railway can deploy directly from your GitHub `main` branch.

1. **Create a Railway project** and connect your GitHub repository.
2. **Add PostgreSQL** — In Railway, add a Postgres plugin. Railway sets `DATABASE_URL` automatically.
3. **Set environment variables** on the web service:
   - `AUTH_SECRET` — Generate with `openssl rand -base64 32`
   - `AUTH_URL` — Your Railway public URL (e.g. `https://career-bridge-production.up.railway.app`)
4. **Deploy** — Push to `main`. Railway runs:
   - Build: `npx prisma generate && npm run build`
   - Start: `npx prisma migrate deploy && npm start`
5. **Seed production** (one time): Run `npm run db:seed` via Railway's shell or a one-off command.

The `railway.json` file configures build and deploy commands. A single Next.js service handles both frontend and API — no separate backend needed.

## Project structure

```
src/
  app/
    (app)/          # Authenticated routes with mobile nav
      dashboard/    # Home dashboard
      accountability/  # Activity logging
      resources/    # Career path guides
      jobs/         # St. Paul job listings
      manager/      # Manager team view
    api/            # REST API routes
    login/          # Sign in
  components/       # UI components
  lib/              # Auth, database, utilities
prisma/
  schema.prisma     # Database models
  seed.ts           # Demo data
```

## Roadmap

- [ ] Weekly goal setting UI for participants
- [ ] Push notifications for manager reviews
- [ ] Admin panel for managing jobs and resources
- [ ] Participant onboarding flow
- [ ] Integration with Minnesota job boards (API)

## License

Private — Bridge to Thrive / Career Bridge program.
