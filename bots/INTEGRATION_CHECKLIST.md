# 🎯 Bot Service Integration Checklist

Use this checklist to ensure all bots are properly integrated with your Decentralized CRM.

## ✅ Pre-Deployment Checklist

### 1. Bot Account Setup

- [ ] **Discord Bot**
  - [ ] Created application in [Discord Developer Portal](https://discord.com/developers/applications)
  - [ ] Added bot to application
  - [ ] Enabled "Server Members Intent"
  - [ ] Enabled "Message Content Intent"
  - [ ] Copied bot token
  - [ ] Invited bot to server with correct permissions

- [ ] **Telegram Bot**
  - [ ] Created bot via [@BotFather](https://t.me/botfather)
  - [ ] Copied bot token
  - [ ] Added bot to group/channel
  - [ ] Made bot admin (for member join tracking)

- [ ] **Twitter Bot**
  - [ ] Created app in [Twitter Developer Portal](https://developer.twitter.com/)
  - [ ] Generated API keys and tokens
  - [ ] Copied all 5 credentials (API Key, API Secret, Access Token, Access Secret, Bearer Token)
  - [ ] Configured tracked hashtags
  - [ ] Configured tracked accounts

- [ ] **Farcaster Bot**
  - [ ] Configured Hub URL (public or self-hosted)
  - [ ] Identified tracked user FIDs
  - [ ] Identified tracked channels
  - [ ] Tested Hub connectivity

### 2. Environment Configuration

- [ ] Copied `.env.example` to `.env` in `bots/` directory
- [ ] Filled in `WEBHOOK_URL` (your Axum API URL)
- [ ] Generated secure `WEBHOOK_SECRET` (use: `openssl rand -hex 32`)
- [ ] Configured all bot tokens
- [ ] Verified all environment variables are set

### 3. Code Verification

- [ ] Run type check: `./verify.sh` (or manually for each bot)
- [ ] Fix any TypeScript errors
- [ ] Fix any ESLint warnings
- [ ] Verify all imports resolve correctly
- [ ] Test local build: `npm run build` for each bot

### 4. Axum API Integration

- [ ] Implemented webhook endpoints:
  - [ ] `POST /webhooks/discord`
  - [ ] `POST /webhooks/telegram`
  - [ ] `POST /webhooks/twitter`
  - [ ] `POST /webhooks/farcaster`

- [ ] Webhook verification implemented:
  - [ ] HMAC-SHA256 signature verification
  - [ ] Signature from `X-Webhook-Signature` header
  - [ ] Reject invalid signatures

- [ ] Event processing implemented:
  - [ ] Parse `CommunityEvent` from request body
  - [ ] Validate event structure
  - [ ] Store event in database
  - [ ] Record to Sui blockchain
  - [ ] Return 200 OK on success

### 5. Database Setup

- [ ] Created tables for:
  - [ ] `profiles` (user profiles)
  - [ ] `interactions` (community events)
  - [ ] `campaigns` (campaign definitions)
  - [ ] `segments` (user segments)

- [ ] Indexed columns:
  - [ ] `external_id` (for fast lookups)
  - [ ] `platform` (for filtering)
  - [ ] `campaign_id` (for analytics)
  - [ ] `timestamp` (for time-based queries)

### 6. Sui Smart Contracts

- [ ] Deployed Move modules:
  - [ ] `Org` module
  - [ ] `Profile` module
  - [ ] `Interaction` module
  - [ ] `Campaign` module

- [ ] Configured contract addresses in Axum API
- [ ] Tested onchain event recording
- [ ] Verified gas costs are acceptable

## 🚀 Deployment Checklist

### Local Testing

- [ ] Started Axum API locally
- [ ] Started each bot in development mode
- [ ] Triggered test events (join server, send message, etc.)
- [ ] Verified webhooks received by API
- [ ] Verified events stored in database
- [ ] Verified Sui transactions created

### Docker Testing

- [ ] Built Docker images: `docker-compose build`
- [ ] Started all services: `docker-compose up`
- [ ] Verified all bots started successfully
- [ ] Checked logs for errors: `docker-compose logs`
- [ ] Triggered test events
- [ ] Verified end-to-end flow

### Production Deployment

- [ ] Chose deployment platform:
  - [ ] Docker Compose (VPS)
  - [ ] Railway
  - [ ] Fly.io
  - [ ] AWS ECS
  - [ ] Google Cloud Run
  - [ ] Kubernetes

- [ ] Configured production environment variables
- [ ] Set up secrets management
- [ ] Deployed all services
- [ ] Verified all bots running
- [ ] Tested production webhooks

## 📊 Monitoring Setup

### Logging

- [ ] Configured centralized logging:
  - [ ] Datadog
  - [ ] New Relic
  - [ ] Grafana Loki
  - [ ] CloudWatch
  - [ ] Other: ****\_\_\_****

- [ ] Set up log retention policy
- [ ] Configured log levels (INFO, WARN, ERROR)
- [ ] Set up log alerts for errors

### Metrics

- [ ] Configured metrics collection:
  - [ ] Prometheus
  - [ ] Datadog
  - [ ] New Relic
  - [ ] CloudWatch
  - [ ] Other: ****\_\_\_****

- [ ] Tracking metrics:
  - [ ] Events processed per minute
  - [ ] Webhook success rate
  - [ ] Bot uptime
  - [ ] Error rate
  - [ ] Response time

### Alerts

- [ ] Set up alerts for:
  - [ ] Bot disconnections
  - [ ] Webhook failures (> 5% error rate)
  - [ ] High error rate (> 10 errors/minute)
  - [ ] Low event volume (potential bot issue)
  - [ ] Database connection failures

### Health Checks

- [ ] Implemented health check endpoints
- [ ] Configured uptime monitoring:
  - [ ] UptimeRobot
  - [ ] Pingdom
  - [ ] StatusCake
  - [ ] Other: ****\_\_\_****

## 🔐 Security Checklist

- [ ] **Secrets Management**
  - [ ] No secrets in code
  - [ ] No secrets in git
  - [ ] Using environment variables or secret manager
  - [ ] Secrets rotated regularly

- [ ] **Network Security**
  - [ ] Bots in private network
  - [ ] Only API exposed publicly
  - [ ] TLS/SSL enabled
  - [ ] Firewall configured

- [ ] **Webhook Security**
  - [ ] HMAC signature verification enabled
  - [ ] Rejecting unsigned requests
  - [ ] Rate limiting implemented
  - [ ] Request size limits configured

- [ ] **Access Control**
  - [ ] Bot tokens have minimal permissions
  - [ ] API keys scoped appropriately
  - [ ] Database access restricted
  - [ ] Sui wallet keys secured

## 📈 Analytics Setup

- [ ] **Dashboard Created**
  - [ ] Total events by platform
  - [ ] Events by type
  - [ ] Campaign performance
  - [ ] User engagement metrics
  - [ ] Funnel conversion rates

- [ ] **Reports Configured**
  - [ ] Daily event summary
  - [ ] Weekly campaign report
  - [ ] Monthly growth metrics
  - [ ] Custom reports: ****\_\_\_****

## 🧪 Testing Checklist

### Unit Tests

- [ ] Webhook signature generation
- [ ] Event normalization
- [ ] Campaign ID extraction
- [ ] Error handling

### Integration Tests

- [ ] Discord bot → API → Database
- [ ] Telegram bot → API → Database
- [ ] Twitter bot → API → Database
- [ ] Farcaster bot → API → Database

### End-to-End Tests

- [ ] User joins Discord → Event in DB → Sui transaction
- [ ] User sends Telegram message → Event in DB
- [ ] User tweets with hashtag → Event in DB
- [ ] User casts on Farcaster → Event in DB

### Load Tests

- [ ] Tested with 100 events/minute
- [ ] Tested with 1000 events/minute
- [ ] Identified bottlenecks
- [ ] Optimized performance

## 📚 Documentation

- [ ] **Internal Documentation**
  - [ ] Architecture diagram
  - [ ] Deployment runbook
  - [ ] Incident response plan
  - [ ] Troubleshooting guide

- [ ] **Team Training**
  - [ ] Team trained on bot management
  - [ ] Team knows how to check logs
  - [ ] Team knows how to restart bots
  - [ ] Team knows escalation process

## 🎉 Launch Checklist

- [ ] All bots deployed and running
- [ ] Monitoring and alerts active
- [ ] Team trained and ready
- [ ] Documentation complete
- [ ] Backup and recovery tested
- [ ] Announced to community
- [ ] Tracking first events
- [ ] Ready to scale!

## 📝 Post-Launch

### Week 1

- [ ] Monitor error rates daily
- [ ] Review event volume
- [ ] Check webhook success rate
- [ ] Verify Sui transactions
- [ ] Gather user feedback

### Month 1

- [ ] Review analytics
- [ ] Optimize performance
- [ ] Add new features
- [ ] Scale if needed
- [ ] Document learnings

## 🆘 Emergency Contacts

- **Bot Issues**: ****\_\_\_****
- **API Issues**: ****\_\_\_****
- **Database Issues**: ****\_\_\_****
- **Sui Network Issues**: ****\_\_\_****
- **On-Call Engineer**: ****\_\_\_****

## 📞 Support Resources

- **Documentation**: `/bots/README.md`
- **Deployment Guide**: `/bots/DEPLOYMENT.md`
- **Production Guide**: `/bots/PRODUCTION_READY.md`
- **Troubleshooting**: Check bot-specific README files
- **Community**: ****\_\_\_****

---

## ✅ Sign-Off

- [ ] Technical Lead: ****\_\_\_**** Date: ****\_\_\_****
- [ ] DevOps Lead: ****\_\_\_**** Date: ****\_\_\_****
- [ ] Product Manager: ****\_\_\_**** Date: ****\_\_\_****

**Status**:

- [ ] Ready for Production
- [ ] Needs Review
- [ ] Blocked (reason: ****\_\_\_****)

---

**Last Updated**: 2026-02-11
**Version**: 1.0
