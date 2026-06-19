# SaveWithBanks

A goal-based savings PWA built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

## Features

- Goal-based savings (3, 6, 12 month durations)
- Manual deposit flow with screenshot proof and admin approval
- Withdrawal engine with penalty system and 5,000 FCFA reserve enforcement
- Savings discipline scoring
- Admin dashboard for user/deposit/penalty management
- PWA support with offline shell

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query
- **Backend:** Supabase (Auth, PostgreSQL, RLS, Edge Functions, Storage)
- **Hosting:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase CLI (`npm install -g supabase`)
- A Supabase project

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project settings.

### 3. Set up Supabase

```bash
supabase init   # if not already done
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy
```

### 4. Run locally

```bash
npm run dev
```

## Admin Bootstrap

After creating your first user account, promote them to admin:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
```

## Deposit Flow

Users deposit by sending payment to **654112103** (Melvis-Dalitine), uploading a screenshot, and waiting for admin approval.

## Documentation

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production deployment instructions.
