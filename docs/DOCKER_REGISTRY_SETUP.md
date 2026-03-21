# Docker Registry Setup

This guide covers how to configure a container registry for the CoverGuard
Docker images (`coverguard-web` and `coverguard-api`).

Choose **one** of the registry options below. All options produce the same
result: a registry URL, a username, and a password/token that you add to
GitHub Actions secrets (see [GITHUB_SECRETS.md](./GITHUB_SECRETS.md)).

---

## Registry options

| Registry | Free tier | Notes |
|----------|-----------|-------|
| **Docker Hub** | Yes (public repos; 1 private repo) | Simplest to get started |
| **AWS ECR** | Yes (500 MB/month free) | Best if infra is already on AWS |
| **Google Artifact Registry (GCR)** | Yes (0.5 GB free) | Best if infra is on GCP |
| **Azure Container Registry (ACR)** | No (Basic ~$5/mo) | Best if infra is on Azure |
| **GitHub Container Registry (GHCR)** | Yes (free for public repos) | Tightest GitHub integration |

---

## Option A — Docker Hub

### 1. Create an account

Sign up at <https://hub.docker.com> if you don't have one.

### 2. Create repositories

Create two repositories under your Docker Hub namespace:

```
<your-namespace>/coverguard-web
<your-namespace>/coverguard-api
```

Set **Visibility** to *Private* for production use.

### 3. Generate an access token

1. Docker Hub → **Account Settings → Security → New Access Token**
2. Description: `coverguard-ci`
3. Permissions: **Read & Write**
4. Copy the token — it is shown only once.

### 4. GitHub secrets to add

```
DOCKER_REGISTRY    = docker.io
REGISTRY_USERNAME  = <your-docker-hub-username>
REGISTRY_PASSWORD  = <access-token>
```

Image refs will look like:
```
docker.io/<namespace>/coverguard-web:latest
docker.io/<namespace>/coverguard-api:latest
```

---

## Option B — AWS Elastic Container Registry (ECR)

### 1. Create repositories

```bash
aws ecr create-repository --repository-name coverguard-web  --region us-east-1
aws ecr create-repository --repository-name coverguard-api  --region us-east-1
```

Note the **repository URI** output for each (format:
`<account-id>.dkr.ecr.<region>.amazonaws.com/coverguard-web`).

### 2. Create an IAM user for CI

```bash
aws iam create-user --user-name coverguard-ci

aws iam attach-user-policy \
  --user-name coverguard-ci \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser
```

### 3. Create access keys

```bash
aws iam create-access-key --user-name coverguard-ci
# Returns AccessKeyId and SecretAccessKey — save both
```

### 4. GitHub secrets to add

```
DOCKER_REGISTRY       = <account-id>.dkr.ecr.<region>.amazonaws.com
REGISTRY_USERNAME     = AWS
REGISTRY_PASSWORD     = # leave empty — ECR uses OIDC or aws-actions/amazon-ecr-login
AWS_ACCESS_KEY_ID     = <AccessKeyId>
AWS_SECRET_ACCESS_KEY = <SecretAccessKey>
AWS_REGION            = us-east-1
```

> **Note:** The deploy workflow uses `aws-actions/amazon-ecr-login` for ECR
> authentication instead of a plain username/password.

### 5. Enable lifecycle policies (optional but recommended)

```bash
aws ecr put-lifecycle-policy \
  --repository-name coverguard-web \
  --lifecycle-policy-text '{
    "rules": [{
      "rulePriority": 1,
      "description": "Keep last 10 images",
      "selection": {"tagStatus": "any", "countType": "imageCountMoreThan", "countNumber": 10},
      "action": {"type": "expire"}
    }]
  }'
```

---

## Option C — Google Artifact Registry (GCR)

### 1. Enable the API

```bash
gcloud services enable artifactregistry.googleapis.com
```

### 2. Create a repository

```bash
gcloud artifacts repositories create coverguard \
  --repository-format=docker \
  --location=us-central1 \
  --description="CoverGuard container images"
```

Repository hostname: `us-central1-docker.pkg.dev`

### 3. Create a service account

```bash
gcloud iam service-accounts create coverguard-ci \
  --display-name="CoverGuard CI"

gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member="serviceAccount:coverguard-ci@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud iam service-accounts keys create /tmp/sa-key.json \
  --iam-account="coverguard-ci@<PROJECT_ID>.iam.gserviceaccount.com"
```

### 4. GitHub secrets to add

```
DOCKER_REGISTRY    = us-central1-docker.pkg.dev
REGISTRY_USERNAME  = _json_key
REGISTRY_PASSWORD  = <contents of /tmp/sa-key.json>
```

Image refs will look like:
```
us-central1-docker.pkg.dev/<project>/coverguard/coverguard-web:latest
```

---

## Option D — Azure Container Registry (ACR)

### 1. Create a registry

```bash
az group create --name coverguard-rg --location eastus

az acr create \
  --resource-group coverguard-rg \
  --name coverguardregistry \
  --sku Basic
```

### 2. Enable admin credentials

```bash
az acr update --name coverguardregistry --admin-enabled true

az acr credential show --name coverguardregistry
# Returns username and two passwords
```

### 3. GitHub secrets to add

```
DOCKER_REGISTRY    = coverguardregistry.azurecr.io
REGISTRY_USERNAME  = coverguardregistry
REGISTRY_PASSWORD  = <password1 from above>
```

---

## Option E — GitHub Container Registry (GHCR)

GHCR is the simplest option when your code is already on GitHub.

### 1. No setup required

GHCR is automatically available for all GitHub repositories.
Images are stored at `ghcr.io/<org-or-user>/<image>`.

### 2. Create a Personal Access Token (PAT)

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. Name: `coverguard-ci`
3. Permissions: **write:packages** (includes read:packages)
4. Copy the token.

### 3. GitHub secrets to add

```
DOCKER_REGISTRY    = ghcr.io
REGISTRY_USERNAME  = <github-username-or-org>
REGISTRY_PASSWORD  = <PAT>
```

Image refs will look like:
```
ghcr.io/cover-guard/coverguard-web:latest
ghcr.io/cover-guard/coverguard-api:latest
```

---

## Image tagging strategy

All registry options use the same tagging strategy in CI:

| Tag | When | Example |
|-----|------|---------|
| `latest` | Every push to `main` | `coverguard-web:latest` |
| `<git-sha>` | Every build | `coverguard-web:abc1234` |
| `v<semver>` | On a version tag push | `coverguard-web:v1.2.3` |
| `<branch>` | Feature branch builds | `coverguard-web:feature-auth` |

Use the `<git-sha>` tag for deployments — it is immutable and always traceable
back to a specific commit.

---

## Verifying your registry connection

After adding secrets, you can validate locally:

```bash
# Log in
docker login $DOCKER_REGISTRY -u $REGISTRY_USERNAME -p $REGISTRY_PASSWORD

# Build and push web image
docker build -f apps/web/Dockerfile -t $DOCKER_REGISTRY/<namespace>/coverguard-web:test .
docker push $DOCKER_REGISTRY/<namespace>/coverguard-web:test

# Pull back to verify
docker pull $DOCKER_REGISTRY/<namespace>/coverguard-web:test
```

---

## Next steps

1. Choose a registry and complete the steps above.
2. Add the required secrets — see [GITHUB_SECRETS.md](./GITHUB_SECRETS.md).
3. Push a commit to `main`; the `Deploy` workflow will build and push images.
4. Follow [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) to run the
   containers on your server.
