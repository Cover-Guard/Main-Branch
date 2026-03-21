# Team Onboarding Guide

Welcome to CoverGuard! This guide walks you through setting up your local
development environment, deploying to staging, and deploying to production.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Local environment setup](#2-local-environment-setup)
3. [Running the stack](#3-running-the-stack)
4. [Deploying to staging](#4-deploying-to-staging)
5. [Deploying to production](#5-deploying-to-production)
6. [Common troubleshooting](#6-common-troubleshooting)
7. [Emergency procedures](#7-emergency-procedures)

---

## 1. Prerequisites

Install the following tools before starting:

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 20 | <https://nodejs.org> or `nvm install 20` |
| npm | ≥ 10 | Included with Node.js 20 |
| Docker | ≥ 24 | <https://docs.docker.com/get-docker/> |
| Docker Compose | v2 (plugin) | Included with Docker Desktop |
| Git | any | <https://git-scm.com> |

**Access you'll need (ask your team lead):**

- [ ] GitHub access to `Cover-Guard/Dev`
- [ ] Supabase project credentials (dev environment)
- [ ] Docker registry credentials
- [ ] Staging server SSH key (for deployment)
- [ ] `.env.local` template (shared via password manager, e.g. 1Password)

---

## 2. Local environment setup

### 2a. Clone the repository

```bash
git clone git@github.com:Cover-Guard/Dev.git
cd Dev
```

### 2b. Install dependencies

```bash
npm install
```

### 2c. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your development credentials:

```bash
# Required for local development
SUPABASE_URL=https://<dev-ref>.supabase.co
SUPABASE_ANON_KEY=<dev-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<dev-service-role-key>
DATABASE_URL=postgresql://postgres:<pw>@db.<dev-ref>.supabase.co:5432/postgres

NEXT_PUBLIC_SUPABASE_URL=https://<dev-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<dev-anon-key>
NEXT_PUBLIC_API_URL=http://localhost:4000

# Optional — mock data is used if unset
ATTOM_API_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
FBI_CDE_KEY=
```

Ask your team lead for the actual values. **Never commit `.env` to git.**

### 2d. Set up the database

```bash
# Apply Prisma migrations to your dev Supabase project
npm run db:migrate

# (Optional) Seed with sample data
npm run db:seed
```

---

## 3. Running the stack

### Option A — Node.js (recommended for active development)

```bash
npm run dev
```

This starts:
- Web → `http://localhost:3000`
- API → `http://localhost:4000`

TypeScript is compiled on the fly; changes hot-reload automatically.

### Option B — Docker Compose

```bash
docker compose up
```

This builds and starts the full stack in Docker containers. Useful for testing
production-like behaviour locally.

```bash
# Stop the stack
docker compose down

# Rebuild after Dockerfile changes
docker compose up --build
```

### Verify everything is working

```bash
# API health check
curl http://localhost:4000/health
# Expected: {"status":"ok","uptime":...}

# Open the web app
open http://localhost:3000
```

---

## 4. Deploying to staging

Staging deployments happen automatically when you open a pull request.
The `ci.yml` workflow runs checks and (once merged) the `deploy.yml` workflow
deploys to staging.

### Manual staging deployment

If you need to deploy a specific branch to staging manually:

```bash
# 1. Build images locally
docker build -f apps/api/Dockerfile -t coverguard-api:staging .
docker build -f apps/web/Dockerfile -t coverguard-web:staging .

# 2. Push to registry
docker tag coverguard-api:staging $DOCKER_REGISTRY/coverguard-api:staging
docker push $DOCKER_REGISTRY/coverguard-api:staging

docker tag coverguard-web:staging $DOCKER_REGISTRY/coverguard-web:staging
docker push $DOCKER_REGISTRY/coverguard-web:staging

# 3. SSH into staging server and deploy
ssh $STAGING_USER@$STAGING_HOST
cd /opt/coverguard
IMAGE_TAG=staging docker compose -f docker-compose.prod.yml pull
IMAGE_TAG=staging docker compose -f docker-compose.prod.yml up -d
```

### Staging verification

- API: `https://api-staging.coverguard.io/health`
- Web: `https://staging.coverguard.io`

Run through the core flows manually:
1. Register a new account → accept terms → access dashboard
2. Search for a property
3. View a property detail page (risk + insurance data)

---

## 5. Deploying to production

**Production is deployed automatically** by CI when code is merged to `main`.

The deployment sequence is:
1. Run Prisma DB migrations
2. Build and push Docker images
3. SSH into production server, pull new images, rolling restart

### Pre-deployment checklist

Before merging a PR to `main` that will go to production:

- [ ] PR has at least one approving review
- [ ] All CI checks pass (typecheck, lint, tests, build)
- [ ] Staging has been tested
- [ ] Any new DB migrations are reversible or have been reviewed
- [ ] `.env.example` updated if new environment variables were added

### Monitoring a production deploy

1. Watch the GitHub Actions `Deploy` workflow for your commit.
2. After the workflow completes, verify:
   ```bash
   curl https://api.coverguard.io/health
   ```
3. Check container logs on the production server if anything looks wrong:
   ```bash
   ssh $DEPLOY_USER@$DEPLOY_HOST
   docker compose -f /opt/coverguard/docker-compose.prod.yml logs --tail=50 api
   ```

See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for full details
and rollback procedures.

---

## 6. Common troubleshooting

### `npm install` fails

```bash
# Clear npm cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### `prisma generate` fails with "DATABASE_URL not set"

Set a placeholder value — `generate` does not need a live database:

```bash
DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder \
  npx prisma generate --schema apps/api/prisma/schema.prisma
```

### API server won't start: "Cannot find module '@coverguard/shared'"

Build the shared package first:

```bash
npm run build --workspace=@coverguard/shared
```

### `docker compose up` fails: "port is already allocated"

Another process is using port 3000 or 4000:

```bash
# Find and kill the process
lsof -ti :3000 | xargs kill -9
lsof -ti :4000 | xargs kill -9
```

### Supabase auth returns 401 in the API

The `SUPABASE_SERVICE_ROLE_KEY` is likely wrong or missing. Verify it matches
the value in your Supabase project settings (Settings → API → Service role key).

### Next.js build fails: "NEXT_PUBLIC_SUPABASE_URL is not defined"

Public Next.js environment variables must be set at **build time** (not runtime).
Ensure they are in your `.env` file (or set as GitHub Actions secrets for CI).

### Docker image is outdated after code changes

```bash
# Force rebuild without cache
docker compose build --no-cache
docker compose up
```

---

## 7. Emergency procedures

### Production is down — API not responding

1. SSH into the production server.
2. Check container status:
   ```bash
   docker compose -f /opt/coverguard/docker-compose.prod.yml ps
   ```
3. Check recent logs:
   ```bash
   docker compose -f /opt/coverguard/docker-compose.prod.yml logs --tail=100 api
   ```
4. Restart the API container:
   ```bash
   docker compose -f /opt/coverguard/docker-compose.prod.yml restart api
   ```
5. If restart doesn't help, roll back to the previous image
   (see [POST_MIGRATION_CHECKLIST.md → Rollback](./POST_MIGRATION_CHECKLIST.md#6-rollback-procedures)).

### Accidental data deletion

1. **Do not deploy anything else** until data is recovered.
2. Open Supabase Dashboard → Database → Backups.
3. Restore to a point before the deletion.
4. Notify the team immediately.

### Secret exposed in a commit

1. **Invalidate the secret immediately** in the provider's dashboard.
2. Generate a new secret.
3. Update the GitHub Actions secret.
4. Remove the secret from git history using `git filter-repo`:
   ```bash
   pip install git-filter-repo
   git filter-repo --replace-text <(echo "OLD_SECRET==>REDACTED")
   git push --force --all
   ```
5. Notify team members to re-clone the repository.
6. Review access logs to assess any potential misuse.

### CI/CD pipeline broken

1. Check the GitHub Actions tab for error messages.
2. If a dependency or action version broke, pin to a known-good version.
3. For urgent production fixes, deploy manually via SSH
   (see [PRODUCTION_DEPLOYMENT.md → Manual deployment](./PRODUCTION_DEPLOYMENT.md#deploying-a-new-version)).

---

## Useful links

| Resource | URL |
|----------|-----|
| Repository | `https://github.com/Cover-Guard/Dev` |
| Supabase dashboard | `https://supabase.com/dashboard` |
| GitHub Actions | `https://github.com/Cover-Guard/Dev/actions` |
| Production API health | `https://api.coverguard.io/health` |
| Prisma docs | `https://www.prisma.io/docs` |
| Next.js docs | `https://nextjs.org/docs` |
| Docker docs | `https://docs.docker.com` |

---

## Onboarding sign-off

Once you have completed local setup, please confirm with your team lead:

- [ ] Can run `npm run dev` and reach `http://localhost:3000`
- [ ] Can run `npm run typecheck` without errors
- [ ] Have read [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
- [ ] Have read [GITHUB_SECRETS.md](./GITHUB_SECRETS.md)
- [ ] Have been added to the team's Supabase project
- [ ] Have access to the staging and production servers (if applicable)
