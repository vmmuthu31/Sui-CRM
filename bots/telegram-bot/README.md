# Telegram Bot for Decentralized CRM

This Telegram bot tracks community engagement and sends events to the CRM webhook service.

## Features

- **Member Joins**: Track when users join Telegram groups/channels
- **Campaign Interactions**: Track button clicks and campaign messages
- **Wallet Linking**: Help users link their Telegram account to their wallet
- **Webhook Integration**: Sends all events to the Axum webhook service

## Setup

### 1. Create Telegram Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow the instructions
3. Copy the bot token

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in:

```bash
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
WEBHOOK_URL=http://localhost:8080/webhooks/telegram
WEBHOOK_SECRET=your_webhook_secret
```

### 4. Run the Bot

Development:

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

## Commands

### `/start`

Welcome message with bot information.

### `/link`

Get instructions to link Telegram account to wallet address.

### `/campaign <id>`

Interact with a specific campaign. Creates a button for easy participation tracking.

Example:

```
/campaign nft-mint-2026
```

## Events Tracked

### Joined

Triggered when a user joins a group/channel.

```json
{
  "external_id": "123456789",
  "platform": "telegram",
  "kind": "joined",
  "timestamp": "2026-02-11T00:00:00Z",
  "metadata": {
    "chat_id": "...",
    "chat_title": "...",
    "username": "user123"
  }
}
```

### Campaign Interaction

Triggered when a user clicks a campaign button or sends a campaign message.

```json
{
  "external_id": "123456789",
  "platform": "telegram",
  "kind": "campaign_interaction",
  "campaign_id": "nft-mint-2026",
  "timestamp": "2026-02-11T00:00:00Z",
  "metadata": {
    "chat_id": "...",
    "username": "user123",
    "action": "button_click"
  }
}
```

## Campaign Tracking

### Method 1: Bot Command

Use the `/campaign` command:

```
/campaign nft-mint-2026
```

The bot will create a message with a participation button.

### Method 2: Message Text

Include the campaign ID in any message:

```
Join our NFT mint! campaign_id: nft-mint-2026
```

## Wallet Linking Flow

1. User sends `/link` to the bot
2. Bot responds with:
   - Link to the web portal
   - Unique verification code (their Telegram user ID)
3. User visits the portal and connects wallet
4. Portal calls the linking API with the verification code
5. CRM associates Telegram ID ↔ Wallet address

## Security

All webhook requests are signed with HMAC-SHA256. The signature is sent in the `X-Webhook-Signature` header.

## Adding to Groups

1. Add the bot to your Telegram group
2. Make the bot an admin (to track member joins)
3. The bot will start tracking events automatically
