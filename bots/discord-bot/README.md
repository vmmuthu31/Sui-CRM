# Discord Bot for Decentralized CRM

This Discord bot tracks community engagement and sends events to the CRM webhook service.

## Features

- **Member Joins**: Track when users join the Discord server
- **Message Reactions**: Track reactions to messages (especially campaign messages)
- **Campaign Interactions**: Track messages containing campaign IDs
- **Webhook Integration**: Sends all events to the Axum webhook service

## Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Go to "Bot" section and click "Add Bot"
4. Enable these **Privileged Gateway Intents**:
   - Server Members Intent
   - Message Content Intent
5. Copy the bot token

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in:

```bash
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
WEBHOOK_URL=http://localhost:8080/webhooks/discord
WEBHOOK_SECRET=your_webhook_secret
```

### 4. Invite Bot to Server

Use this URL (replace `YOUR_CLIENT_ID`):

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2147486720&scope=bot
```

### 5. Run the Bot

Development:

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

## Events Tracked

### Joined

Triggered when a user joins the server.

```json
{
  "external_id": "123456789",
  "platform": "discord",
  "kind": "joined",
  "timestamp": "2026-02-11T00:00:00Z",
  "metadata": {
    "guild_id": "...",
    "guild_name": "...",
    "username": "user#1234"
  }
}
```

### Reacted

Triggered when a user reacts to a message.

```json
{
  "external_id": "123456789",
  "platform": "discord",
  "kind": "reacted",
  "timestamp": "2026-02-11T00:00:00Z",
  "metadata": {
    "guild_id": "...",
    "channel_id": "...",
    "message_id": "...",
    "reaction": "👍"
  }
}
```

### Campaign Interaction

Triggered when a user interacts with a campaign message (contains `campaign_id` or `campaign-id`).

```json
{
  "external_id": "123456789",
  "platform": "discord",
  "kind": "campaign_interaction",
  "campaign_id": "nft-mint-2026",
  "timestamp": "2026-02-11T00:00:00Z",
  "metadata": {
    "guild_id": "...",
    "channel_id": "...",
    "message_id": "..."
  }
}
```

## Campaign Tracking

To track a campaign, include the campaign ID in your Discord message:

```
🎉 New NFT Drop! campaign_id: nft-mint-2026

React to this message to participate!
```

When users react or reply, the bot will send a `campaign_interaction` event with the campaign ID.

## Security

All webhook requests are signed with HMAC-SHA256. The signature is sent in the `X-Webhook-Signature` header.
