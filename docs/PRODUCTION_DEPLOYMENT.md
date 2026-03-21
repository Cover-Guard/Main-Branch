# Production Deployment Guide

This document covers deploying CoverGuard to production using Docker.

---

## Prerequisites

- A Linux server (Ubuntu 22.04 LTS recommended) with Docker and Docker Compose
  installed
- A domain with DNS configured (see [DNS_CDN_SETUP.md](./DNS_CDN_SETUP.md))
- A container registry with images pushed by CI
  (see [DOCKER_REGISTRY_SETUP.md](./DOCKER_REGISTRY_SETUP.md))
- GitHub Actions secrets configured
  (see [GITHUB_SECRETS.md](./GITHUB_SECRETS.md))

---

## Server setup (first time only)

### 1. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker --version
```

### 2. Install Docker Compose (v2)

```bash
sudo apt install -y docker-compose-plugin
docker compose version
```

### 3. Create the application directory

```bash
sudo mkdir -p /opt/coverguard
sudo chown $USER:$USER /opt/coverguard
cd /opt/coverguard
```

### 4. Create the production compose file

Create `/opt/coverguard/docker-compose.prod.yml`:

```yaml
version: '3.9'

services:
  api:
    image: ${DOCKER_REGISTRY}/coverguard-api:${IMAGE_TAG:-latest}
    restart: unless-stopped
    env_file: .env.production
    environment:
      NODE_ENV: production
      PORT: 4000
    ports:
      - "127.0.0.1:4000:4000"   # bind to loopback — nginx proxies externally
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  web:
    image: ${DOCKER_REGISTRY}/coverguard-web:${IMAGE_TAG:-latest}
    restart: unless-stopped
    env_file: .env.production
    environment:
      NODE_ENV: production
      PORT: 3000
    ports:
      - "127.0.0.1:3000:3000"   # bind to loopback — nginx proxies externally
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    depends_on:
      api:
        condition: service_healthy
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

networks:
  default:
    name: coverguard-prod
```

### 5. Create the production environment file

Create `/opt/coverguard/.env.production` (do **not** commit this file):

```bash
# Supabase
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
DATABASE_URL=postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres

# API
NODE_ENV=production
PORT=4000
JWT_SECRET=<long-random-secret>
CORS_ALLOWED_ORIGINS=https://coverguard.io,https://www.coverguard.io
ATTOM_API_KEY=<attom-key>

# Web (Next.js public env vars are baked into the image at build time)
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_API_URL=https://api.coverguard.io
NEXT_PUBLIC_MAPBOX_TOKEN=<mapbox-token>
```

---

## Deploying a new version

CI pushes images tagged with `latest` and the git SHA on every push to `main`.

### Manual deployment

```bash
cd /opt/coverguard

# Pull the latest images
docker compose -f docker-compose.prod.yml pull

# Rolling restart — API first, then Web
docker compose -f docker-compose.prod.yml up -d --no-deps api
# Wait for API health check (≈ 30 s)
sleep 35
docker compose -f docker-compose.prod.yml up -d --no-deps web

# Verify
docker compose -f docker-compose.prod.yml ps
curl https://api.coverguard.io/health
```

### Automated deployment via GitHub Actions

The `Deploy` workflow in `.github/workflows/deploy.yml` runs automatically on
every push to `main`:

1. Runs DB migrations
2. Builds and pushes `coverguard-api` and `coverguard-web` images
3. SSH-es into the production server and runs the rolling restart

No manual steps are required once the workflow is set up.

---

## Blue-green deployment strategy

For zero-downtime deployments, run two sets of containers and switch the
reverse proxy target.

```bash
# Start the "green" stack on alternate ports
IMAGE_TAG=<new-sha> docker compose \
  -f docker-compose.prod.yml \
  -p coverguard-green \
  up -d

# Wait for green health checks to pass
until curl -s http://localhost:4001/health | grep -q '"status":"ok"'; do
  sleep 5
done

# Switch nginx upstream to green (update ports in nginx config)
sudo nginx -s reload

# Stop the old "blue" stack
docker compose -f docker-compose.prod.yml -p coverguard-blue down
```

---

## Database migrations

Migrations run automatically in the `Deploy` workflow before the Docker images
are deployed. To run manually:

```bash
DATABASE_URL=<prod-url> npx prisma migrate deploy \
  --schema apps/api/prisma/schema.prisma
```

> Always back up the database before running migrations in production
> (Supabase Dashboard → Database → Backups → Create backup).

---

## Scaling considerations

### Horizontal scaling (multiple instances)

To run multiple API instances behind a load balancer:

1. Remove the direct port mapping from `docker-compose.prod.yml`.
2. Add an nginx `upstream` block with multiple server addresses.
3. Ensure `JWT_SECRET` and all environment variables are identical across
   instances.

```nginx
upstream coverguard_api {
    least_conn;
    server 127.0.0.1:4001;
    server 127.0.0.1:4002;
}
```

### Vertical scaling

The API is stateless and memory-efficient. For high traffic:
- Allocate more CPU/memory to the Docker host
- Increase the `--max-old-space-size` Node.js flag in the container CMD
- Add a Redis cache for risk profile lookups (replace in-memory `Map` in
  `riskService.ts`)

### Container resource limits

Add resource limits to prevent a single service from consuming all server
resources:

```yaml
# In docker-compose.prod.yml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

---

## Environment-specific configurations

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| `NODE_ENV` | `development` | `production` | `production` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | `https://staging.coverguard.io` | `https://coverguard.io,https://www.coverguard.io` |
| `LOG_LEVEL` | `debug` | `info` | `warn` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | `https://api-staging.coverguard.io` | `https://api.coverguard.io` |

---

## Monitoring and alerting

### Container logs

```bash
# Follow live logs
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 api
```

### Health check endpoint

The API exposes `GET /health` → `{"status":"ok","uptime":<seconds>}`.

Configure an uptime monitoring service (UptimeRobot, Better Uptime, Pingdom)
to poll `https://api.coverguard.io/health` every 60 seconds and alert on
non-200 responses.

### Log aggregation

For production, ship logs to a centralised service:

```yaml
# In docker-compose.prod.yml — replace json-file driver with:
logging:
  driver: awslogs
  options:
    awslogs-region: us-east-1
    awslogs-group: /coverguard/api
    awslogs-stream: production
```

Or use a sidecar log shipper (Fluentd, Promtail, Datadog Agent).

---

## Disaster recovery procedures

### Full server failure

1. Provision a new server (same OS and Docker version).
2. Restore `/opt/coverguard/.env.production` from a secure secrets vault.
3. Pull the last known good image from your registry:
   ```bash
   docker pull $DOCKER_REGISTRY/coverguard-api:<last-good-sha>
   docker pull $DOCKER_REGISTRY/coverguard-web:<last-good-sha>
   ```
4. Start the stack:
   ```bash
   IMAGE_TAG=<last-good-sha> docker compose -f docker-compose.prod.yml up -d
   ```
5. Restore the database from the most recent Supabase backup if needed.
6. Update DNS to point to the new server IP.

**RTO target:** < 30 minutes  
**RPO target:** Last Supabase backup (hourly by default on paid plans)

### Database corruption / accidental deletion

1. Supabase Dashboard → Database → Backups → select a restore point.
2. Supabase restores to a new database instance; update `DATABASE_URL` once
   the restore is complete.
3. Re-run any migrations that were applied after the restore point.

---

## Security hardening

- [ ] Bind container ports to `127.0.0.1` (not `0.0.0.0`) so they are only
  accessible via nginx.
- [ ] Enable `ufw` firewall; allow only ports 22, 80, 443.
  ```bash
  sudo ufw allow ssh && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
  sudo ufw enable
  ```
- [ ] Configure fail2ban to block brute-force SSH attempts.
- [ ] Run containers as non-root users (already set in Dockerfiles).
- [ ] Rotate secrets periodically — see [GITHUB_SECRETS.md](./GITHUB_SECRETS.md).
- [ ] Enable Supabase Row Level Security (RLS) on all tables.
- [ ] Keep Docker and OS packages up to date.
