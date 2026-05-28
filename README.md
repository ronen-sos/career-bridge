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

### Sign in

Career Bridge uses **Google sign-in**. Only emails pre-registered in the database can access the app. After seeding, these accounts are registered:

| Role        | Email                          |
|-------------|--------------------------------|
| Manager     | manager@bridgetothrive.org     |
| Participant | participant@bridgetothrive.org |

Sign in with a Google account that uses one of those email addresses.

## Google sign-in setup

### 1. Create a Google OAuth client

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select an existing one)
3. Open **APIs & Services → OAuth consent screen**
   - Choose **External** (or Internal if using Google Workspace)
   - Fill in app name: `Career Bridge`
   - Add your support email
   - Add scopes: `email`, `profile`, `openid` (defaults are fine)
4. Open **APIs & Services → Credentials → Create Credentials → OAuth client ID**
5. Application type: **Web application**
6. Add **Authorized JavaScript origins**:
   - `http://localhost:3000` (local dev)
   - `https://YOUR-RAILWAY-DOMAIN.up.railway.app` (production)
7. Add **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR-RAILWAY-DOMAIN.up.railway.app/api/auth/callback/google`
8. Copy the **Client ID** and **Client secret**

### 2. Add environment variables

In `.env` (local) and Railway (production):

```env
AUTH_GOOGLE_ID="your-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-client-secret"
AUTH_SECRET="your-random-secret"
AUTH_URL="http://localhost:3000"   # or your Railway URL in production
```

### 3. Register users

Add participants and managers to the database with their Google email addresses. Users cannot self-register — their email must exist in the `User` table before Google sign-in will work.

## Deploy to Railway

Railway can deploy directly from your GitHub `main` branch.

1. **Create a Railway project** and connect your GitHub repository.
2. **Add PostgreSQL** — In Railway, add a Postgres plugin. Railway sets `DATABASE_URL` automatically.
3. **Set environment variables** on the web service:
   - `AUTH_SECRET` — Generate with `openssl rand -base64 32`
   - `AUTH_URL` — Your Railway public URL (e.g. `https://career-bridge-production.up.railway.app`)
   - `AUTH_GOOGLE_ID` — From Google Cloud Console
   - `AUTH_GOOGLE_SECRET` — From Google Cloud Console
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
