# Post-Migration Checklist

Use this checklist every time you complete a deployment to a new environment,
or after any infrastructure change. Check each item in order — later items
depend on earlier ones being green.

---

## 1. Docker image builds

Run on CI or locally after every merge to `main`.

- [ ] `coverguard-api` image builds without errors
  ```bash
  docker build -f apps/api/Dockerfile -t coverguard-api:test .
  ```
- [ ] `coverguard-web` image builds without errors
  ```bash
  docker build -f apps/web/Dockerfile -t coverguard-web:test .
  ```
- [ ] Both images start and respond to health checks
  ```bash
  docker run -d --name api-test -p 4000:4000 \
    --env-file .env coverguard-api:test
  curl http://localhost:4000/health   # expect {"status":"ok"}

  docker run -d --name web-test -p 3001:3000 \
    --env-file .env coverguard-web:test
  curl -o /dev/null -s -w "%{http_code}" http://localhost:3001  # expect 200

  docker rm -f api-test web-test
  ```
- [ ] Images are tagged with git SHA and `latest`, and pushed to registry
  ```bash
  docker images | grep coverguard
  ```

---

## 2. Staging deployment

Deploy to staging **before** touching production.

- [ ] SSH into staging server and pull latest images
  ```bash
  docker compose -f docker-compose.prod.yml pull
  docker compose -f docker-compose.prod.yml up -d
  ```
- [ ] API health check passes on staging
  ```bash
  curl https://api-staging.coverguard.io/health
  ```
- [ ] Web frontend loads on staging URL
- [ ] Authentication flow works end-to-end:
  - [ ] Register new user
  - [ ] Receive verification email
  - [ ] Log in
  - [ ] Accept terms at `/onboarding`
  - [ ] Access `/dashboard`
- [ ] Property search returns results
- [ ] Risk data loads on a property detail page
- [ ] Prisma migrations ran successfully (check `_prisma_migrations` table)

---

## 3. Production deployment

Only proceed after staging is green.

- [ ] Take a database snapshot (Supabase Dashboard → Database → Backups)
- [ ] Note the current git SHA that is live:
  ```bash
  docker inspect coverguard-api:latest | grep -i "sha\|created"
  ```
- [ ] Deploy via CI (`git push origin main`) or manually:
  ```bash
  # On production server
  docker compose -f docker-compose.prod.yml pull
  docker compose -f docker-compose.prod.yml up -d --no-deps api
  # Wait 30 s for API health check, then:
  docker compose -f docker-compose.prod.yml up -d --no-deps web
  ```
- [ ] API health check passes on production
  ```bash
  curl https://api.coverguard.io/health
  ```
- [ ] Web frontend loads at `https://coverguard.io`
- [ ] Check container logs for errors
  ```bash
  docker compose -f docker-compose.prod.yml logs --tail=50 api
  docker compose -f docker-compose.prod.yml logs --tail=50 web
  ```
- [ ] Monitor error rate in logs for 5 minutes post-deploy

---

## 4. Supabase connection validation

- [ ] API can connect to Supabase Postgres (check migration job output)
- [ ] Supabase Auth returns a valid JWT for a test login
- [ ] `SUPABASE_SERVICE_ROLE_KEY` secret is set correctly (API `/api/auth/me`
  endpoint works for a logged-in user)
- [ ] Supabase allowed URLs include the production domain
  (Dashboard → Authentication → URL Configuration)

---

## 5. Monitoring checks

- [ ] Container restart policy is set to `unless-stopped` or `always`
- [ ] Log rotation is configured (Docker `json-file` driver with `max-size`)
- [ ] Disk usage on server is < 80%
- [ ] Uptime monitoring (e.g. UptimeRobot, Better Uptime) alerts are configured
  for `/health` endpoint

---

## 6. Rollback procedures

If anything goes wrong after a production deployment:

### Rollback to the previous image

```bash
# On the production server:

# 1. Find the previous SHA tag
docker images coverguard-api --format "{{.Tag}}" | head -5

# 2. Roll back the API
docker compose -f docker-compose.prod.yml stop api
docker tag coverguard-api:<previous-sha> coverguard-api:latest
docker compose -f docker-compose.prod.yml up -d api

# 3. Roll back the web (if needed)
docker compose -f docker-compose.prod.yml stop web
docker tag coverguard-web:<previous-sha> coverguard-web:latest
docker compose -f docker-compose.prod.yml up -d web

# 4. Verify
curl https://api.coverguard.io/health
```

### Rollback a database migration

If the deploy included a destructive migration:

```bash
# 1. Restore from the Supabase backup taken before deployment
#    (Supabase Dashboard → Database → Backups → Restore)

# 2. Or reverse the migration manually if it is non-destructive:
DATABASE_URL=<prod-url> npx prisma migrate resolve \
  --rolled-back <migration-name> \
  --schema apps/api/prisma/schema.prisma
```

> **Always take a database backup before running migrations in production.**

---

## 7. Post-migration cleanup

After a successful migration and a stabilisation period of ≥ 24 hours:

- [ ] Remove old Docker images from the server to free disk space:
  ```bash
  docker image prune -a --filter "until=72h"
  ```
- [ ] Remove deprecated GitHub secrets (see [GITHUB_SECRETS.md](./GITHUB_SECRETS.md))
- [ ] Archive Vercel project in Vercel dashboard (optional — suspending billing)
- [ ] Update team calendar / on-call schedule to reflect new deployment process
- [ ] Update [TEAM_ONBOARDING.md](./TEAM_ONBOARDING.md) if any steps changed

---

## Completion sign-off

| Item | Verified by | Date |
|------|------------|------|
| Docker images build & push | | |
| Staging deployment green | | |
| Production deployment green | | |
| Monitoring configured | | |
| Deprecated secrets removed | | |
| Team notified | | |
