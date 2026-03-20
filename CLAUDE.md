# CLAUDE.md — AI Assistant Guide for CoverGuard

This file provides context and conventions for AI assistants (e.g., Claude Code) working in this repository. **Keep this file updated** as the project evolves.

---

## Project Overview

**CoverGuard** is a property insurability intelligence platform. It lets home buyers, real estate agents, and lenders instantly understand the flood, fire, earthquake, wind, and crime risks for any US property — and get a detailed insurance cost estimate — before placing a bid.

| Detail | Value |
|---|---|
| Repository | `Cover-Guard/Main-Branch` |
| Package manager | npm workspaces (monorepo) |
| Languages | TypeScript everywhere |
| Node version | >= 20 |

---

## Repository Structure

```
Main-Branch/
├── apps/
│   ├── web/                    # Next.js 15 frontend (http://localhost:3000)
│   │   └── src/
│   │       ├── app/            # Next.js App Router pages
│   │       │   ├── page.tsx            # Landing / hero
│   │       │   ├── search/page.tsx     # Property search
│   │       │   ├── properties/[id]/    # Property detail + risk + insurance
│   │       │   ├── dashboard/page.tsx  # Authenticated user dashboard
│   │       │   └── (auth)/login|register/
│   │       ├── components/
│   │       │   ├── search/     # SearchBar, SearchResults, PropertyCard
│   │       │   └── property/   # RiskSummary, RiskBreakdown, InsuranceCostEstimate
│   │       └── lib/
│   │           ├── api.ts              # Typed API client (calls apps/api)
│   │           ├── utils.ts            # cn(), risk color helpers
│   │           └── supabase/           # Supabase client / server / middleware
│   │
│   └── api/                    # Express REST API (http://localhost:4000)
│       ├── src/
│       │   ├── index.ts                # Server entry point
│       │   ├── routes/
│       │   │   ├── properties.ts       # /api/properties/* endpoints
│       │   │   └── auth.ts             # /api/auth/* endpoints
│       │   ├── services/
│       │   │   ├── propertyService.ts  # DB + external search
│       │   │   ├── riskService.ts      # Risk scoring + caching
│       │   │   └── insuranceService.ts # Premium estimation + caching
│       │   ├── integrations/
│       │   │   ├── propertyData.ts     # ATTOM API (with mock fallback)
│       │   │   └── riskData.ts         # FEMA, USGS, Cal Fire, FBI UCR
│       │   ├── middleware/
│       │   │   ├── auth.ts             # Supabase JWT verification
│       │   │   └── errorHandler.ts     # Central error handler
│       │   └── utils/
│       │       ├── prisma.ts           # Singleton Prisma client
│       │       ├── supabaseAdmin.ts    # Service-role Supabase client
│       │       └── logger.ts           # Winston logger
│       └── prisma/
│           ├── schema.prisma           # Database schema (Supabase/PostgreSQL)
│           └── seed.ts                 # Sample data seed
│
├── packages/
│   └── shared/                 # Internal package — shared across apps/api and apps/web
│       └── src/
│           ├── types/          # Property, RiskProfile, InsuranceCostEstimate, User, API
│           ├── utils/          # formatters.ts, validators.ts
│           └── constants/      # Risk thresholds, US states, cache TTLs
│
├── .github/workflows/
│   ├── ci.yml          # Runs on every push: typecheck, lint, test, build, Docker build
│   ├── deploy.yml      # Runs on push to main: migrations + push Docker images
│   └── db-migrate.yml  # Manual workflow: run Prisma migrations against staging/prod
│
├── docker-compose.yml  # Local dev (web + api; uses external Supabase)
├── turbo.json          # Turborepo task graph
├── .env.example        # All required environment variables (copy to .env)
└── CLAUDE.md           # This file
```

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Monorepo | Turborepo | Task caching and parallelism |
| Frontend | Next.js 15, TypeScript, Tailwind CSS | App Router, Server Components |
| Backend | Express 4, TypeScript, Node 20 | REST API |
| Database | Supabase (PostgreSQL) | Hosted; no local Postgres needed |
| Auth | Supabase Auth | JWT tokens; middleware handles session refresh |
| ORM | Prisma 6 | Schema migrations + type-safe queries |
| Validation | Zod | Both API (Express) and frontend (react-hook-form) |
| HTTP client | `fetch` (native) | Used in both API integrations and web lib/api.ts |
| Logging | Winston | JSON in production, colorized in dev |
| Maps | Mapbox GL / react-map-gl | Set NEXT_PUBLIC_MAPBOX_TOKEN |

---

## Development Workflow

```bash
# Install all workspace dependencies from repo root
npm install

# Start all services in watch mode
npm run dev            # web :3000, api :4000

# Or run a specific service
npm run dev --filter=web
npm run dev --filter=api

# Typecheck, lint, test
npm run typecheck
npm run lint
npm run test

# Database (Supabase — requires DATABASE_URL in .env)
npm run db:migrate     # Apply migrations (prisma migrate deploy)
npm run db:seed        # Seed sample properties
npm run db:studio      # Open Prisma Studio GUI
```

---

## Supabase / Database

- **All DB operations** in the API use Prisma (`apps/api/src/utils/prisma.ts`).
- **Auth verification** uses the Supabase Admin client (`utils/supabaseAdmin.ts`) which bypasses RLS. Never expose the service role key to the browser.
- **Frontend Supabase clients** are in `apps/web/src/lib/supabase/`:
  - `client.ts` — browser client (anon key only)
  - `server.ts` — server-side client (uses cookies)
  - `middleware.ts` — refreshes sessions on every request

When adding a new table or column:
1. Edit `apps/api/prisma/schema.prisma`
2. Run `npm run db:migrate:dev -- --name <migration-name>` to generate a migration
3. Commit the generated `prisma/migrations/` file

---

## API Conventions

- All responses use `{ success: true, data: T }` or `{ success: false, error: { code, message } }`.
- Authentication: `Authorization: Bearer <supabase-access-token>`.
- Validation with Zod at the route level; errors are caught by `errorHandler.ts`.
- Risk profiles and insurance estimates are **cached in the DB** with a TTL (see `RISK_CACHE_TTL_SECONDS` and `INSURANCE_ESTIMATE_CACHE_TTL_SECONDS` in `packages/shared/src/constants`).

---

## Environment Variables

All variables are documented in `.env.example`. Critical ones:

| Variable | Where used | Notes |
|---|---|---|
| `SUPABASE_URL` | API, Web | Supabase project URL |
| `SUPABASE_ANON_KEY` | API, Web | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | API only | Never expose to browser |
| `DATABASE_URL` | API (Prisma) | Direct PostgreSQL connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Web | Same as SUPABASE_URL, prefixed for Next.js |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web | Same as anon key, prefixed for Next.js |
| `ATTOM_API_KEY` | API | Optional — mock data used if absent |

---

## Code Style

- **TypeScript strict mode** on in all packages.
- **Prettier** is configured at the root (`.prettierrc`) — run `npm run format` before committing.
- `const` over `let`; no `var`.
- No `any` — use `unknown` and narrow types.
- Prefer `async/await` over raw promises.
- External API integrations live in `apps/api/src/integrations/`; business logic lives in `services/`.

---

## Testing

- Test files: `*.test.ts` or `*.spec.ts` alongside source files.
- Jest is configured per package.
- Run `npm run test` from root to run all tests.
- All tests must pass before merging to `main`.

---

## Git Conventions

### Branches

| Branch | Purpose |
|---|---|
| `main` | Stable, production-ready |
| `master` | Legacy default (treat as main) |
| `claude/<desc>-<sessionId>` | AI-generated branches |
| `feature/<desc>` | Human feature branches |
| `fix/<desc>` | Bug fixes |

- **Never push directly to `main` or `master`.**
- AI assistants must work on their designated `claude/` branch.
- Branch names for AI sessions: `claude/<short-description>-<sessionId>`.

### Commits

- Commits are **SSH-signed** — never pass `--no-gpg-sign`.
- Imperative present-tense messages: `Add flood risk scoring`, `Fix insurance cache expiry`.
- Do not amend published commits; create new ones.

### Push

```bash
git push -u origin <branch-name>
```

On network failure retry up to 4 times with exponential backoff: 2 s, 4 s, 8 s, 16 s.

---

## CI/CD

| Workflow | Trigger | Steps |
|---|---|---|
| `ci.yml` | Push / PR | typecheck, lint, test, build, Docker build |
| `deploy.yml` | Push to `main` | Prisma migrate + push Docker images to registry |
| `db-migrate.yml` | Manual | Run migrations against staging or production |

Required GitHub Actions secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `CONTAINER_REGISTRY`, `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`, `PRODUCTION_API_URL`.

---

## Notes for AI Assistants

1. **Read before editing.** Always read a file before modifying it.
2. **Minimal changes.** Only change what is requested; avoid refactoring unrelated code.
3. **No new files without reason.** Prefer editing existing files.
4. **Stay in shared types.** When adding a new data shape, add it to `packages/shared/src/types/` so both apps can use it.
5. **Supabase admin is server-only.** Never import `supabaseAdmin` from frontend code.
6. **Check your branch.** Confirm you are on the correct `claude/` branch before committing or pushing.
7. **No secrets.** Never commit `.env` files, API keys, or credentials.
8. **Keep this file updated.** After adding new services, routes, or architectural patterns, update the relevant section above.
