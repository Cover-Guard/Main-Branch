# CI/CD Optimization Guide

This document covers caching strategies, build-time improvements, and
troubleshooting tips for CoverGuard's GitHub Actions workflows.

---

## Current workflow overview

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push / PR | Typecheck, lint, test, build |
| `deploy.yml` | Push to `main` | DB migration, Docker build & push, deploy |
| `db-migrate.yml` | Manual | On-demand Prisma migrations |

---

## Caching strategies

### npm dependency cache

All jobs use `actions/setup-node` with `cache: 'npm'`, which caches
`~/.npm` based on `package-lock.json`. This saves 30–60 s per job.

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'   # ← enables npm cache
```

### Turborepo remote cache

Turborepo can cache build artefacts across CI runs, avoiding rebuilds when
inputs haven't changed.

```yaml
# In turbo.json — already configured for local cache.
# To enable remote cache, add to your CI environment:
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

Set up a remote cache:
- **Self-hosted** (recommended) with
  [turborepo-remote-cache](https://github.com/fox1t/turborepo-remote-cache)
- **Vercel Remote Cache** — Turborepo's remote cache is a standalone feature
  of Turborepo and does **not** require deploying to Vercel. You can use a
  Vercel account solely for caching while CoverGuard is deployed via Docker.

Expected savings: 2–4 minutes on unchanged packages.

### Docker layer cache (BuildKit)

The deploy workflow uses `docker/build-push-action` with GitHub Actions cache:

```yaml
- uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to:   type=gha,mode=max
```

`mode=max` caches every layer, not just the final image. This reduces Docker
build time from ~4 minutes to ~1 minute on cache hits.

### Prisma client generation cache

The `prisma generate` step re-runs on every CI job that needs types. Cache the
output to save ~15 s:

```yaml
- name: Cache Prisma client
  uses: actions/cache@v4
  with:
    path: apps/api/node_modules/.prisma
    key: prisma-${{ hashFiles('apps/api/prisma/schema.prisma') }}
```

---

## Build time improvements

### Parallel jobs

The `ci.yml` workflow runs `typecheck` and `lint` in parallel; `build` waits
for both. Tests run independently. This is already optimised.

To further parallelise, split the `test` job by workspace:

```yaml
test-api:
  name: Tests (API)
  runs-on: ubuntu-latest
  steps:
    - ...
    - run: npm run test --workspace=@coverguard/api

test-web:
  name: Tests (Web)
  runs-on: ubuntu-latest
  steps:
    - ...
    - run: npm run test --workspace=@coverguard/web
```

### Sparse checkout

If the repository grows large, use sparse checkout to fetch only the files
each job needs:

```yaml
- uses: actions/checkout@v4
  with:
    sparse-checkout: |
      apps/api
      packages/shared
      package.json
      package-lock.json
      turbo.json
```

### Docker multi-platform builds

For ARM64 servers (AWS Graviton, Apple Silicon), build multi-arch images:

```yaml
- uses: docker/setup-qemu-action@v3
- uses: docker/setup-buildx-action@v3
- uses: docker/build-push-action@v5
  with:
    platforms: linux/amd64,linux/arm64
```

> **Note:** Multi-platform builds are 2–3× slower. Only enable if you actually
> run ARM64 servers.

---

## Workflow configuration tips

### Skip CI on documentation-only changes

Add a path filter so documentation changes don't trigger a full CI run:

```yaml
on:
  push:
    branches: [main, 'claude/**', 'feature/**']
    paths-ignore:
      - 'docs/**'
      - '**.md'
      - '.github/ISSUE_TEMPLATE/**'
```

### Fail fast on the most common errors

Move the cheapest check (typecheck) before the others, and fail the job
quickly if it fails:

```yaml
jobs:
  typecheck:
    # runs fastest — fail here before spending time on lint/test
```

This is already the case in the current `ci.yml`.

### Concurrency groups

The `ci.yml` cancels in-progress runs on the same ref:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

The `deploy.yml` uses `cancel-in-progress: false` to prevent concurrent
deployments from colliding.

---

## Reducing registry pull costs

Pull the `latest` image as a build cache layer before building:

```yaml
- name: Pull cache image
  run: docker pull ${{ env.REGISTRY }}/coverguard-api:latest || true

- uses: docker/build-push-action@v5
  with:
    cache-from: |
      type=registry,ref=${{ env.REGISTRY }}/coverguard-api:latest
      type=gha
```

This is especially useful for ECR and GCR where pull egress is free within the
same region as your CI runner.

---

## Workflow troubleshooting

### "npm ci" fails with "missing package-lock.json"

The `package-lock.json` must be committed. If it's in `.gitignore`, remove it.

### Docker build fails: "failed to solve: failed to read dockerfile"

Check that the `context` in the workflow is the repo root (`.`), not
`apps/api` or `apps/web`. The Dockerfiles use `COPY packages/shared` which
requires the monorepo root as context.

### Prisma generate fails: "Environment variable not found: DATABASE_URL"

`prisma generate` does **not** need a live database — it only reads the schema.
Set a dummy value:

```yaml
env:
  DATABASE_URL: postgresql://placeholder:placeholder@localhost:5432/placeholder
```

### "push access denied" to Docker registry

1. Confirm `REGISTRY_USERNAME` and `REGISTRY_PASSWORD` secrets are set.
2. Confirm the `docker/login-action` step runs before `build-push-action`.
3. For GHCR, the `GITHUB_TOKEN` needs `packages: write` permission:
   ```yaml
   permissions:
     contents: read
     packages: write
   ```

### Deploy workflow SSH step fails: "Host key verification failed"

Add the server's host key to known hosts before connecting:

```yaml
- name: Add server to known hosts
  run: |
    mkdir -p ~/.ssh
    ssh-keyscan -H ${{ secrets.DEPLOY_HOST }} >> ~/.ssh/known_hosts
```

### Workflow takes > 15 minutes

Common causes and fixes:

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `npm ci` slow | npm cache miss | Check `cache: 'npm'` is set |
| Docker build slow | No layer cache | Add `cache-from: type=gha` |
| Tests timing out | External API calls | Mock external services in tests |
| Deploy SSH slow | Large image pull | Pre-pull image before deployment |

---

## Notifications

Add a Slack notification step at the end of `deploy.yml`:

```yaml
- name: Notify Slack
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "Deploy ${{ job.status }}: ${{ github.ref_name }} @ ${{ github.sha }}",
        "attachments": [{
          "color": "${{ job.status == 'success' && 'good' || 'danger' }}",
          "text": "View run: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
        }]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
    SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK
```
