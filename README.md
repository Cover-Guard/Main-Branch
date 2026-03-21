# CoverGuard

**Property Insurability Intelligence Platform**

CoverGuard lets buyers, agents, and lenders instantly understand the true
insurance cost of any US property before placing a bid. Enter an address and
get a full risk profile — flood, fire, wind, earthquake, and crime — alongside
detailed insurance cost estimates.

> **Migration notice:** CoverGuard is now deployed via Docker. Vercel is no
> longer used. See [docs/PRODUCTION_DEPLOYMENT.md](./docs/PRODUCTION_DEPLOYMENT.md).

---

## Stack

| Layer | Technology |
|---|---|
| Monorepo | [Turborepo](https://turbo.build) |
| Frontend | [Next.js 15](https://nextjs.org) + TypeScript + Tailwind CSS |
| Backend API | Node.js + [Express](https://expressjs.com) + TypeScript |
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| Auth | Supabase Auth |
| ORM | [Prisma](https://prisma.io) |
| Shared Types | `packages/shared` internal package |
| **Deployment** | **Docker** (primary) |
| CI/CD | GitHub Actions |

---

## Project Structure

```
coverguard/
├── apps/
│   ├── web/              # Next.js 15 frontend (port 3000)
│   └── api/              # Express REST API (port 4000)
├── packages/
│   └── shared/           # Shared TypeScript types, utils, constants
├── .github/workflows/    # CI (typecheck, lint, test, build) + Docker deploy
├── docker-compose.yml    # Local dev stack
├── docs/                 # Documentation
└── CLAUDE.md             # AI assistant guide
```

---

## Quick Start

### Prerequisites

- Node.js >= 20
- npm >= 10
- Docker & Docker Compose (for containerised development)
- A [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone git@github.com:Cover-Guard/Dev.git
cd Dev
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your Supabase URL, anon key, service role key, and DATABASE_URL
```

### 3. Set up the database

```bash
# Push schema to Supabase
npm run db:migrate

# (Optional) Seed with sample data
npm run db:seed
```

### 4. Start development servers

```bash
# Node.js (recommended — hot reload)
npm run dev
# web → http://localhost:3000
# api → http://localhost:4000

# Or with Docker Compose
docker compose up
```

---

## Docker Deployment (Quick Start)

Build and run production images locally:

```bash
# Build images
docker build -f apps/api/Dockerfile -t coverguard-api .
docker build -f apps/web/Dockerfile -t coverguard-web .

# Run with environment file
docker run -d -p 4000:4000 --env-file .env coverguard-api
docker run -d -p 3000:3000 --env-file .env coverguard-web
```

### Docker Registry Options

| Registry | Notes |
|----------|-------|
| Docker Hub | Free tier, simple setup |
| GitHub Container Registry (GHCR) | Free, tight GitHub integration |
| AWS ECR | Best for AWS-hosted infrastructure |
| Google Artifact Registry | Best for GCP-hosted infrastructure |
| Azure Container Registry | Best for Azure-hosted infrastructure |

See [docs/DOCKER_REGISTRY_SETUP.md](./docs/DOCKER_REGISTRY_SETUP.md) for
step-by-step setup for each option.

---

## GitHub Actions Secrets

Required for CI/CD:

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
DOCKER_REGISTRY       # e.g. docker.io, ghcr.io
REGISTRY_USERNAME
REGISTRY_PASSWORD
PRODUCTION_API_URL    # https://api.coverguard.io
DEPLOY_HOST           # production server IP/hostname
DEPLOY_USER           # SSH username
DEPLOY_SSH_KEY        # private SSH key
```

See [docs/GITHUB_SECRETS.md](./docs/GITHUB_SECRETS.md) for full documentation
and rotation procedures.

---

## API Reference

Base URL: `http://localhost:4000`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | -- | Health check |
| `POST` | `/api/auth/register` | -- | Create user account |
| `GET` | `/api/auth/me` | Bearer | Current user profile |
| `PATCH` | `/api/auth/me` | Bearer | Update profile |
| `GET` | `/api/auth/me/saved` | Bearer | Saved properties |
| `GET` | `/api/properties/search?address=...` | -- | Search properties |
| `GET` | `/api/properties/:id` | -- | Property detail |
| `GET` | `/api/properties/:id/risk` | -- | Risk profile |
| `GET` | `/api/properties/:id/insurance` | -- | Insurance estimate |
| `GET` | `/api/properties/:id/report` | -- | Full report (property + risk + insurance) |
| `POST` | `/api/properties/:id/save` | Bearer | Save property |
| `DELETE` | `/api/properties/:id/save` | Bearer | Unsave property |

Authentication uses **Supabase JWT access tokens** passed as
`Authorization: Bearer <token>`.

---

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Copy the project URL and keys into `.env`
3. Copy the **Direct connection** string into `DATABASE_URL`
4. Run `npm run db:migrate` to push the Prisma schema

---

## Risk Data Sources

| Risk Type | Source | Notes |
|---|---|---|
| Flood | FEMA NFHL | Public API |
| Fire | Cal Fire FHSZ | CA only; national data planned |
| Earthquake | USGS NSHM | ASCE 7-22 design values |
| Wind / Hurricane | ASCE 7 + NOAA | State-based heuristics |
| Crime | FBI UCR | Requires API registration |
| Property data | ATTOM | Commercial — set ATTOM_API_KEY; mock data used if unset |

---

## Development Scripts

```bash
npm run dev          # Start all services
npm run build        # Build all packages
npm run test         # Run all tests
npm run lint         # Lint all packages
npm run typecheck    # TypeScript check all packages
npm run db:migrate   # Apply Prisma migrations
npm run db:seed      # Seed sample data
npm run db:studio    # Open Prisma Studio
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/PRODUCTION_DEPLOYMENT.md](./docs/PRODUCTION_DEPLOYMENT.md) | Complete production deployment guide |
| [docs/DOCKER_REGISTRY_SETUP.md](./docs/DOCKER_REGISTRY_SETUP.md) | Docker registry setup (Docker Hub, ECR, GCR, ACR, GHCR) |
| [docs/GITHUB_SECRETS.md](./docs/GITHUB_SECRETS.md) | GitHub Actions secrets reference & rotation |
| [docs/DNS_CDN_SETUP.md](./docs/DNS_CDN_SETUP.md) | DNS, CDN, and SSL/TLS setup |
| [docs/POST_MIGRATION_CHECKLIST.md](./docs/POST_MIGRATION_CHECKLIST.md) | Deployment verification checklist |
| [docs/CI_CD_OPTIMIZATION.md](./docs/CI_CD_OPTIMIZATION.md) | CI/CD caching and build optimisation |
| [docs/TEAM_ONBOARDING.md](./docs/TEAM_ONBOARDING.md) | New team member onboarding guide |
| [CLAUDE.md](./CLAUDE.md) | AI assistant guidelines |

---

## Contributing

1. Branch from `main` using the pattern `feature/<description>` or
   `fix/<description>`
2. Open a pull request against `main`
3. CI must pass (typecheck + lint + test + build)
4. At least one review required before merge

See [CLAUDE.md](./CLAUDE.md) for AI assistant guidelines.
