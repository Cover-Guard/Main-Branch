# GitHub Secrets Management

This document lists every GitHub Actions secret required for CoverGuard's
CI/CD pipelines, explains how to add or rotate them, and identifies the
Vercel-era secrets that should be removed.

---

## Required secrets (current — Docker-based deployment)

Add these in your GitHub repository under
**Settings → Secrets and variables → Actions → Repository secrets**.

### Supabase / Database

| Secret | Description | Example value |
|--------|-------------|---------------|
| `SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Public anon key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — **never expose to browser** | `eyJhbGc...` |
| `DATABASE_URL` | Direct PostgreSQL connection string | `postgresql://postgres:pw@db.xxxx.supabase.co:5432/postgres` |

### Docker registry

| Secret | Description | Example value |
|--------|-------------|---------------|
| `DOCKER_REGISTRY` | Registry hostname | `docker.io` / `ghcr.io` / `<account>.dkr.ecr.<region>.amazonaws.com` |
| `REGISTRY_USERNAME` | Registry login username | `my-org` |
| `REGISTRY_PASSWORD` | Registry password or access token | `dckr_pat_xxx` |

> For AWS ECR, replace `REGISTRY_USERNAME` / `REGISTRY_PASSWORD` with
> `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_REGION`.
> See [DOCKER_REGISTRY_SETUP.md](./DOCKER_REGISTRY_SETUP.md).

### Deployment targets

| Secret | Description | Example value |
|--------|-------------|---------------|
| `PRODUCTION_API_URL` | Public API base URL | `https://api.coverguard.io` |
| `DEPLOY_HOST` | SSH hostname or IP of production server | `203.0.113.10` |
| `DEPLOY_USER` | SSH username on production server | `ubuntu` |
| `DEPLOY_SSH_KEY` | Private SSH key for deployment | `-----BEGIN OPENSSH PRIVATE KEY-----\n...` |

### Optional

| Secret | Description |
|--------|-------------|
| `ATTOM_API_KEY` | ATTOM property data API key (mock data used if absent) |
| `FBI_CDE_KEY` | FBI Crime Data Explorer key |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox GL token (baked into web image at build time) |
| `JWT_SECRET` | Override the auto-generated JWT secret for the API |
| `SLACK_WEBHOOK_URL` | Slack channel webhook for deployment notifications |

---

## Deprecated secrets to remove

The following secrets were used by the old Vercel-based deployment.
**Remove them** from GitHub Actions secrets once the Docker migration is
complete to reduce your attack surface.

| Secret to remove | Reason |
|-----------------|--------|
| `VERCEL_TOKEN` | Vercel account token — no longer used |
| `VERCEL_ORG_ID` | Vercel organisation ID — no longer used |
| `VERCEL_WEB_PROJECT_ID` | Vercel web project ID — no longer used |
| `VERCEL_API_PROJECT_ID` | Vercel API project ID — no longer used |

To remove a secret:
**Settings → Secrets and variables → Actions** → click the secret → **Delete**.

---

## How to add a secret

```
GitHub repo
  └── Settings
        └── Secrets and variables
              └── Actions
                    └── New repository secret
                          Name:  SECRET_NAME
                          Value: <secret value>
                          → Add secret
```

For organisation-level secrets shared across multiple repos, use
**Organisation secrets** under your GitHub organisation settings.

---

## Secret rotation procedures

### Supabase keys

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project →
   **Settings → API**.
2. Click **Reset** next to the key you want to rotate.
3. Copy the new value.
4. Update the corresponding GitHub secret immediately.
5. If the `SUPABASE_SERVICE_ROLE_KEY` is rotated, also update `.env` files on
   any servers running the API container.

> Rotating the anon key will temporarily break the frontend for logged-in users
> until the new secret is deployed. Coordinate with a planned maintenance window
> or roll out to staging first.

### DATABASE_URL / Prisma

1. Generate a new password in Supabase →
   **Settings → Database → Reset database password**.
2. Update `DATABASE_URL` in GitHub secrets.
3. Re-run any pending migrations:
   ```bash
   DATABASE_URL=<new-url> npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
   ```
4. Restart the API container.

### Docker registry credentials

1. Revoke the old token in your registry's dashboard.
2. Generate a new token (see [DOCKER_REGISTRY_SETUP.md](./DOCKER_REGISTRY_SETUP.md)).
3. Update `REGISTRY_PASSWORD` (and any AWS/GCP/Azure keys if applicable).
4. Trigger a new CI run to confirm images still push successfully.

### SSH deployment key (`DEPLOY_SSH_KEY`)

1. Generate a new key pair on a secure machine:
   ```bash
   ssh-keygen -t ed25519 -C "coverguard-deploy-$(date +%Y-%m)" -f /tmp/deploy_key
   ```
2. Add the **public** key (`/tmp/deploy_key.pub`) to `~/.ssh/authorized_keys`
   on the production server.
3. Update `DEPLOY_SSH_KEY` in GitHub with the **private** key contents.
4. Remove the old public key from the server's `authorized_keys`.
5. Delete the key files from your local machine.

---

## Environments

GitHub supports multiple **environments** for controlling which secrets are
available and adding required reviewers.

Recommended setup:

| Environment | Protection rules | Secrets |
|-------------|-----------------|---------|
| `production` | Required reviewer, wait timer 5 min | `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, all Supabase production secrets |
| `staging` | None | Separate `DEPLOY_HOST`, staging Supabase secrets |

Create environments at **Settings → Environments → New environment**.

---

## Troubleshooting

### "Invalid credentials" during `docker login`

- Confirm `REGISTRY_USERNAME` and `REGISTRY_PASSWORD` match exactly what you
  set in the registry dashboard.
- For Docker Hub, ensure you are using an **access token** (not your account
  password) — Docker Hub requires tokens for programmatic access.
- For ECR, confirm the IAM user has `AmazonEC2ContainerRegistryPowerUser`.

### "Secret not found" in a workflow step

- Check the secret name matches exactly (case-sensitive).
- Ensure the workflow references the correct **environment** (`environment: production`).
- Organisation secrets need explicit repository access enabled in
  **Org settings → Secrets → Repositories**.

### "Permission denied" on SSH deployment

- Verify the public key is in `~/.ssh/authorized_keys` on the server.
- Check the key format — GitHub strips trailing newlines; ensure the key is
  stored as a single block.
- Test connectivity manually:
  ```bash
  ssh -i /tmp/deploy_key $DEPLOY_USER@$DEPLOY_HOST 'echo ok'
  ```

### Secrets visible in workflow logs

- GitHub automatically redacts known secrets, but never `echo` a secret value
  directly.
- Use `::add-mask::` to redact dynamic values:
  ```yaml
  - run: echo "::add-mask::${{ secrets.MY_SECRET }}"
  ```
