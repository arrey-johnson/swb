# SaveWithBanks Production Deployment Guide

## Prerequisites

- Supabase account (https://supabase.com)
- Vercel account (https://vercel.com)
- GitHub repository connected to Vercel

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard and create a new project
2. Note your **Project URL** and **anon/public key** from Settings > API
3. Note your **service_role key** (keep this secret — server-side only)

## Step 2: Apply Database Migrations

```bash
cd swb
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

This creates all tables, RLS policies, RPC functions, storage bucket, and seeds penalty settings.

### Enable Extensions

In Supabase Dashboard > Database > Extensions, enable:
- `pg_cron` (for daily maturity checks)

Then run migration `20240619000003_cron_maturity.sql` or apply the cron schedule manually.

## Step 3: Deploy Edge Functions

```bash
supabase functions deploy create-goal
supabase functions deploy deposit-request
supabase functions deploy approve-deposit
supabase functions deploy reject-deposit
supabase functions deploy withdraw-funds
supabase functions deploy calculate-penalty
supabase functions deploy check-maturity
supabase functions deploy complete-goal
supabase functions deploy send-notification
supabase functions deploy export-report
```

Edge Functions automatically receive `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## Step 4: Configure Auth

In Supabase Dashboard > Authentication > URL Configuration:

| Setting | Value |
|---------|-------|
| Site URL | `https://your-domain.vercel.app` |
| Redirect URLs | `https://your-domain.vercel.app/**`, `http://localhost:5173/**` |

Enable email confirmations under Authentication > Providers > Email.

## Step 5: Deploy to Vercel

1. Import the GitHub repository in Vercel
2. Framework Preset: **Vite**
3. Add environment variables:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

4. Deploy

The `vercel.json` SPA rewrite is already configured for React Router.

## Step 6: Bootstrap Admin User

1. Register an account through the app
2. In Supabase SQL Editor, run:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-admin@email.com';
```

## Step 7: Verify Security

```bash
supabase db advisors
```

Fix any security warnings before going live.

## Environment Variables Reference

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase public anon key |

### Edge Functions (auto-injected by Supabase)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |

## Storage Policies

The `deposit-proofs` bucket is private. Users upload to `{user_id}/{goal_id}/{timestamp}.ext`. Admins can view all proofs via RLS.

## Maturity Cron Job

The daily maturity check runs via `pg_cron` at midnight UTC. To verify:

```sql
SELECT * FROM cron.job;
```

To manually trigger:

```sql
SELECT app.check_maturity();
```

Or invoke the Edge Function:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/check-maturity \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## Reserve Balance Rule

Every account maintains a permanent **5,000 FCFA** reserve enforced at:
- Database CHECK constraint on `savings_accounts`
- RPC validation in `app.withdraw_funds`
- Frontend error display (server message only)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| RLS blocking reads | Verify user is authenticated; check policies |
| Edge Function 401 | Ensure Authorization header with valid JWT |
| Deposit upload fails | Check storage bucket exists and policies applied |
| Admin pages redirect | Verify `profiles.role = 'admin'` for your user |
| Email not sending | Configure SMTP in Supabase Auth settings |
