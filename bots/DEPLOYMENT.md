# Production Deployment Guide

This guide covers deploying all four CRM bots to production.

## Prerequisites

- Docker and Docker Compose installed
- Bot tokens and API keys configured
- Axum API server running and accessible
- Domain/IP for webhook endpoints

## Quick Start (Docker Compose)

### 1. Configure Environment

```bash
cd bots
cp .env.example .env
```

Edit `.env` and fill in all required values:

```bash
# Webhook Configuration
WEBHOOK_URL=https://your-api-domain.com
WEBHOOK_SECRET=generate_a_secure_random_string_here

# Discord Bot
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Twitter Bot
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...
TWITTER_BEARER_TOKEN=...
TRACKED_HASHTAGS=#YourCampaign,#AnotherCampaign
TRACKED_ACCOUNTS=@YourAccount,@YourProject

# Farcaster Bot
FARCASTER_HUB_URL=https://hub.farcaster.xyz:2281
TRACKED_CHANNELS=your-channel,another-channel
TRACKED_USERS=12345,67890
```

### 2. Build and Run

```bash
# Build all bots
docker-compose build

# Start all bots
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all bots
docker-compose down
```

### 3. Individual Bot Control

```bash
# Start specific bot
docker-compose up -d discord-bot

# Restart specific bot
docker-compose restart telegram-bot

# View specific bot logs
docker-compose logs -f twitter-bot

# Stop specific bot
docker-compose stop farcaster-bot
```

## Individual Deployment

### Discord Bot

```bash
cd discord-bot

# Install dependencies
npm install

# Build
npm run build

# Run
npm start
```

### Telegram Bot

```bash
cd telegram-bot
npm install
npm run build
npm start
```

### Twitter Bot

```bash
cd twitter-bot
npm install
npm run build
npm start
```

### Farcaster Bot

```bash
cd farcaster-bot
npm install
npm run build
npm start
```

## Cloud Deployment Options

### Option 1: Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. For each bot:
   ```bash
   cd discord-bot
   railway init
   railway up
   ```
4. Set environment variables in Railway dashboard

### Option 2: Fly.io

1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. For each bot:
   ```bash
   cd discord-bot
   fly launch
   fly secrets set DISCORD_TOKEN=your_token
   fly deploy
   ```

### Option 3: AWS ECS

1. Build and push Docker images to ECR
2. Create ECS task definitions for each bot
3. Create ECS services
4. Configure environment variables in task definitions

### Option 4: Google Cloud Run

```bash
# For each bot
cd discord-bot
gcloud run deploy discord-bot \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-env-vars DISCORD_TOKEN=your_token
```

### Option 5: Kubernetes

```yaml
# Example deployment for Discord bot
apiVersion: apps/v1
kind: Deployment
metadata:
  name: discord-bot
spec:
  replicas: 1
  selector:
    matchLabels:
      app: discord-bot
  template:
    metadata:
      labels:
        app: discord-bot
    spec:
      containers:
        - name: discord-bot
          image: your-registry/discord-bot:latest
          envFrom:
            - secretRef:
                name: discord-bot-secrets
```

## Monitoring and Logging

### Health Checks

Add health check endpoints to each bot:

```typescript
// Add to index.ts
import http from "http";

const healthServer = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200);
    res.end("OK");
  }
});

healthServer.listen(3000);
```

### Logging

All bots log to stdout. Configure log aggregation:

**Docker Compose:**

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

**Production:**

- Use Datadog, New Relic, or Grafana Loki
- Configure log shipping from Docker/K8s

### Metrics

Add Prometheus metrics:

```bash
npm install prom-client
```

```typescript
import { register, Counter } from "prom-client";

const eventCounter = new Counter({
  name: "bot_events_total",
  help: "Total number of events processed",
  labelNames: ["platform", "kind"],
});

// In your handlers
eventCounter.inc({ platform: "discord", kind: "joined" });
```

## Security Best Practices

### 1. Secrets Management

**Never commit secrets to git!**

Use environment variables or secret managers:

- AWS Secrets Manager
- Google Secret Manager
- HashiCorp Vault
- Kubernetes Secrets

### 2. Network Security

- Run bots in private network
- Only expose webhook API publicly
- Use TLS for all connections
- Implement rate limiting

### 3. Webhook Verification

All bots sign webhooks with HMAC-SHA256. Your API **must** verify:

```rust
use hmac::{Hmac, Mac};
use sha2::Sha256;

fn verify_webhook(payload: &str, signature: &str, secret: &str) -> bool {
    let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes()).unwrap();
    mac.update(payload.as_bytes());
    let expected = hex::encode(mac.finalize().into_bytes());
    expected == signature
}
```

## Scaling

### Horizontal Scaling

Most bots can run multiple instances:

```yaml
# docker-compose.yml
discord-bot:
  deploy:
    replicas: 3
```

**Note:** Twitter and Farcaster bots use streaming APIs - only run 1 instance per account.

### Vertical Scaling

Increase resources if needed:

```yaml
discord-bot:
  deploy:
    resources:
      limits:
        cpus: "0.5"
        memory: 512M
      reservations:
        cpus: "0.25"
        memory: 256M
```

## Troubleshooting

### Bot not starting

```bash
# Check logs
docker-compose logs discord-bot

# Common issues:
# - Missing environment variables
# - Invalid tokens
# - Network connectivity
```

### Webhooks not working

```bash
# Test webhook endpoint
curl -X POST https://your-api.com/webhooks/discord \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Check bot logs for errors
docker-compose logs -f discord-bot
```

### High memory usage

```bash
# Check memory usage
docker stats

# Restart bot if needed
docker-compose restart discord-bot
```

## Backup and Recovery

### Configuration Backup

```bash
# Backup environment variables
cp .env .env.backup

# Store securely (encrypted)
gpg -c .env.backup
```

### Disaster Recovery

1. Keep Docker images in registry
2. Store environment variables in secret manager
3. Document deployment process
4. Test recovery procedure regularly

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy Bots

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Discord Bot
        run: |
          cd bots/discord-bot
          docker build -t discord-bot .

      - name: Push to Registry
        run: |
          docker tag discord-bot ${{ secrets.REGISTRY }}/discord-bot:latest
          docker push ${{ secrets.REGISTRY }}/discord-bot:latest

      - name: Deploy
        run: |
          # Deploy to your platform
```

## Cost Optimization

### Resource Limits

Set appropriate limits to avoid over-provisioning:

```yaml
resources:
  limits:
    cpus: "0.25"
    memory: 256M
```

### Spot Instances

Use spot/preemptible instances for non-critical bots:

- AWS Spot Instances
- GCP Preemptible VMs
- Azure Spot VMs

### Serverless Options

For low-traffic bots, consider serverless:

- AWS Lambda (with adapter)
- Google Cloud Functions
- Azure Functions

## Support

For issues:

1. Check bot logs
2. Verify environment variables
3. Test webhook connectivity
4. Review API documentation
5. Open GitHub issue
