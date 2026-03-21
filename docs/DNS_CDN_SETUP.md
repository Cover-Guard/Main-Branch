# DNS, CDN & SSL/TLS Setup

This guide covers how to point `coverguard.io` and `api.coverguard.io` at
your Docker-hosted servers, configure a CDN for the frontend, and provision
SSL/TLS certificates — without Vercel.

---

## Architecture overview

```
User
 │
 ├─ https://coverguard.io          ──►  CDN (Cloudflare / CloudFront)
 │                                         └──► Web server (Docker: port 3000)
 │
 └─ https://api.coverguard.io      ──►  Load balancer / reverse proxy
                                           └──► API server (Docker: port 4000)
```

---

## Step 1 — Point DNS to your server

Log in to your DNS provider (IONOS, Cloudflare, Route 53, etc.) and update
the following records to point at your production server's IP address.

Replace `203.0.113.10` with your actual server IP.

| Type | Host | Value | TTL |
|------|------|-------|-----|
| `A` | `@` (apex) | `203.0.113.10` | 300 |
| `A` | `www` | `203.0.113.10` | 300 |
| `A` | `api` | `203.0.113.10` | 300 |

> Use a short TTL (300 s) during initial setup so you can make corrections
> quickly. Raise it to 3600+ once everything is confirmed working.

### IONOS-specific steps

1. Log in at **my.ionos.com → Domains & SSL → coverguard.io → DNS**.
2. Delete any existing `A` records pointing to Vercel IPs (`76.76.21.21`).
3. Add the records in the table above.

### Route 53 (AWS)

```bash
# Create or update A record for apex domain
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "coverguard.io.",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "203.0.113.10"}]
      }
    }]
  }'
```

---

## Step 2 — Reverse proxy / TLS termination (nginx)

Install nginx on your server to handle TLS termination and proxy traffic to
the Docker containers.

```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/coverguard`:

```nginx
# ── Web (coverguard.io) ───────────────────────────────────────────────────────
server {
    listen 80;
    server_name coverguard.io www.coverguard.io;
    return 301 https://coverguard.io$request_uri;
}

server {
    listen 443 ssl http2;
    server_name coverguard.io www.coverguard.io;

    ssl_certificate     /etc/letsencrypt/live/coverguard.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/coverguard.io/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # Redirect www → apex
    if ($host = www.coverguard.io) {
        return 308 https://coverguard.io$request_uri;
    }

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# ── API (api.coverguard.io) ───────────────────────────────────────────────────
server {
    listen 80;
    server_name api.coverguard.io;
    return 301 https://api.coverguard.io$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.coverguard.io;

    ssl_certificate     /etc/letsencrypt/live/api.coverguard.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.coverguard.io/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass         http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/coverguard /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Step 3 — SSL/TLS certificates (Let's Encrypt)

```bash
# Obtain certificates for both domains
sudo certbot --nginx -d coverguard.io -d www.coverguard.io
sudo certbot --nginx -d api.coverguard.io

# Verify auto-renewal
sudo certbot renew --dry-run
```

Certbot adds a cron/systemd timer that auto-renews certificates before they
expire (Let's Encrypt certificates are valid for 90 days).

---

## Step 4 — CDN configuration (optional but recommended)

A CDN reduces latency for static assets and shields your origin server.

### Option A — Cloudflare (recommended)

1. Sign up at <https://cloudflare.com> and add `coverguard.io`.
2. Cloudflare will scan your DNS records; confirm they are correct.
3. Change your IONOS nameservers to Cloudflare's nameservers (shown in onboarding).
4. In Cloudflare dashboard:
   - **SSL/TLS → Full (strict)** — Cloudflare handles the browser ↔ Cloudflare
     leg; nginx handles the Cloudflare ↔ origin leg.
   - **Caching → Cache Rules** — cache static assets:
     ```
     If URI path matches: /_next/static/*
     Then: Cache everything, Edge TTL 1 month
     ```
   - **Speed → Minification** — enable HTML, CSS, JS minification.

### Option B — AWS CloudFront

1. Create a distribution for `coverguard.io`:
   ```bash
   aws cloudfront create-distribution \
     --origin-domain-name coverguard.io \
     --default-root-object index.html
   ```
2. Set the **CNAME** for `coverguard.io` to point to the CloudFront domain
   (`xxxx.cloudfront.net`).
3. Request an ACM certificate for `coverguard.io` in `us-east-1` (required for
   CloudFront).
4. Attach the certificate to the distribution.

---

## Step 5 — Update Supabase allowed redirect URLs

After the DNS cutover, update the allowed URLs in Supabase:

**Supabase Dashboard → Authentication → URL Configuration:**

```
Site URL:        https://coverguard.io
Redirect URLs:
  https://coverguard.io/**
  https://www.coverguard.io/**
  http://localhost:3000/**        ← keep for local dev
```

---

## Health check endpoints

Use these endpoints to verify your deployment is healthy:

| Endpoint | Expected response |
|----------|------------------|
| `GET https://api.coverguard.io/health` | `200 OK` with `{"status":"ok"}` |
| `GET https://coverguard.io` | `200 OK` (Next.js landing page) |

Automated monitoring example (cron or uptime service):

```bash
#!/usr/bin/env bash
set -euo pipefail

check() {
  status=$(curl -s -o /dev/null -w "%{http_code}" "$1")
  if [[ "$status" != "200" ]]; then
    echo "ALERT: $1 returned $status" >&2
    exit 1
  fi
  echo "OK: $1 → $status"
}

check "https://api.coverguard.io/health"
check "https://coverguard.io"
```

---

## Verification checklist

```bash
# DNS propagation
dig coverguard.io A
dig api.coverguard.io A

# TLS
curl -vI https://coverguard.io 2>&1 | grep -E "SSL|issuer|subject"
curl -vI https://api.coverguard.io 2>&1 | grep -E "SSL|issuer|subject"

# API health
curl https://api.coverguard.io/health

# www redirect
curl -I https://www.coverguard.io   # should be 308 → coverguard.io

# HTTP → HTTPS redirect
curl -I http://coverguard.io        # should be 301 → https://
```
