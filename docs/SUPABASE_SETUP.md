# Supabase Setup Guide

This document explains how CoverGuard uses two separate Supabase instances, how to configure GitHub secrets, and how to set up a local development environment.

---

## Overview of Supabase Instances

CoverGuard splits its backend across two isolated Supabase projects:

| Instance | Purpose | Project ID | Used by |
|---|---|---|---|
| **UAT** | Web frontend (Next.js) | `qdepzpxfmtethchqmbap` | `apps/web` |
| **Dev** | API backend (Express) | `qxxhdzaszzbtxixpvxkd` | `apps/api` |

Keeping the instances separate ensures that frontend auth sessions and API database operations never share credentials or affect each other's data.

---

## Required GitHub Secrets

Add all four secrets below to your repository. Go to **Settings → Secrets and variables → Actions → New repository secret**.

| Secret Name | Value | Used by |
|---|---|---|
| `SUPABASE_WEB_URL` | `https://qdepzpxfmtethchqmbap.supabase.co` | `apps/web` build & deploy |
| `SUPABASE_WEB_ANON_KEY` | `sb_publishable_d6CBOgqWxwAQOM9DdN0CYg_eXWFFWgJ` | `apps/web` build & deploy |
| `SUPABASE_API_URL` | `https://qxxhdzaszzbtxixpvxkd.supabase.co` | `apps/api` tests & deploy |
| `SUPABASE_API_ANON_KEY` | `sb_publishable_-ORGgGbegxle3ilOKhDZbg_h6SG_uZE` | `apps/api` tests & deploy |

> **Note:** The values above are the publishable/anon keys, which are safe to use in CI. Never commit `SERVICE_ROLE_KEY` values to source control.

---

## Which Workflows Use Which Secrets

### `.github/workflows/ci.yml`

| Job | Secrets consumed |
|---|---|
| `typecheck` | _(none — Supabase not needed)_ |
| `lint` | `DATABASE_URL` |
| `test` | `DATABASE_URL`, `SUPABASE_API_URL`, `SUPABASE_API_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| `build` | `SUPABASE_WEB_URL`, `SUPABASE_WEB_ANON_KEY` |
| `preview` | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_WEB_PROJECT_ID` |

### `.github/workflows/deploy.yml`

| Job | Secrets consumed |
|---|---|
| `migrate` | `DATABASE_URL` |
| `deploy-api` | `DATABASE_URL`, `SUPABASE_API_URL`, `SUPABASE_API_ANON_KEY`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_API_PROJECT_ID` |
| `deploy-web` | `SUPABASE_WEB_URL`, `SUPABASE_WEB_ANON_KEY`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_WEB_PROJECT_ID` |

---

## Local Development

Create a `.env.local` file in each app directory. These files are git-ignored and must never be committed.

**`apps/web/.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=https://qdepzpxfmtethchqmbap.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-web-anon-key>
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**`apps/api/.env`** (or `.env.local`)
```env
SUPABASE_URL=https://qxxhdzaszzbtxixpvxkd.supabase.co
SUPABASE_ANON_KEY=<your-api-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-api-service-role-key>
DATABASE_URL=<your-postgres-connection-string>
```

Start both apps together:
```bash
npm run dev
```

This starts `apps/web` on port 3000 and `apps/api` on port 4000 via Turborepo.

---

## Troubleshooting Common CI/CD Failures

### Build fails with "supabaseUrl is required"
- The `build` job is missing `SUPABASE_WEB_URL` or `SUPABASE_WEB_ANON_KEY`.
- Verify that both secrets are set in **Settings → Secrets and variables → Actions**.

### Tests fail with "Invalid API key" or connection errors
- The `test` job uses `SUPABASE_API_URL` and `SUPABASE_API_ANON_KEY`.
- Confirm these secrets exist and match the Dev project (`qxxhdzaszzbtxixpvxkd`).

### Deploy-web fails at the Vercel build step
- Ensure `SUPABASE_WEB_URL` and `SUPABASE_WEB_ANON_KEY` are set.
- Confirm `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_WEB_PROJECT_ID` are also present.

### Deploy-api fails with database errors
- Ensure `SUPABASE_API_URL`, `SUPABASE_API_ANON_KEY`, and `DATABASE_URL` are set.
- Run `npm run db:migrate:dev` locally to verify migration files are up to date.

### Migrations fail
- Check that `DATABASE_URL` points to the correct Postgres instance for the `production` environment.
- Make sure Prisma migration files in `apps/api/prisma/migrations/` are committed.

---

## Rotating / Updating Secrets

1. Go to the Supabase dashboard for the relevant project.
2. Navigate to **Settings → API** and regenerate the key.
3. In GitHub, go to **Settings → Secrets and variables → Actions**.
4. Click the secret name and choose **Update**.
5. Paste the new value and save.
6. Re-run any failed workflow runs to pick up the new secret.

> Rotating `SUPABASE_SERVICE_ROLE_KEY` also requires updating the value in any Vercel project environment settings if the API is deployed there.
