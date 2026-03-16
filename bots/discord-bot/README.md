# Discord Bot for Tidal

Community engagement tracking, campaign management, and server-side Seal encryption for the Tidal CRM platform.

## Features

- **Community Tracking**: Member joins, message reactions, campaign interactions — all batched and forwarded via webhooks
- **Campaign Management**: Create, list, announce, and track campaigns with real-time stats and leaderboards
- **Seal Encryption**: Encrypt text and upload to Walrus directly from Discord (`!encrypt`)
- **Seal Decryption**: Download from Walrus and decrypt directly in Discord (`!decrypt`)
- **Wallet Linking**: Help users link their Discord account to their Sui wallet (`!link`)
- **Event Batching**: Deduplicated, batched event processing with configurable flush intervals
- **Walrus Archival**: Optional encrypted archival of batched events to Walrus for permanent storage
- **Webhook Integration**: HMAC-SHA256 signed payloads sent to the Tidal API

## Architecture

```
Discord Events
    │
    ├── Member Joins ──────┐
    ├── Reactions ──────────┤── Event Batcher ──► Webhook API
    ├── Campaign Messages ──┘       │
    │                               └── (optional) Seal encrypt ──► Walrus Archive
    │
    ├── !campaign-* ──► Campaign API (stats, create, list, announce, leaderboard)
    ├── !encrypt ──► Seal SDK ──► Walrus Upload
    ├── !decrypt ──► Walrus Download ──► Seal SDK
    └── !link ──► Wallet linking instructions
```

### Services

| Service | File | Purpose |
|---------|------|---------|
| `suiClient` | `services/suiClient.ts` | Sui client, bot Ed25519 keypair, contract config from env |
| `sealService` | `services/sealService.ts` | Server-side Seal encrypt/decrypt (4 key servers, threshold=2) |
| `walrusService` | `services/walrusService.ts` | Upload/download blobs with multi-publisher/aggregator fallback |
| `campaignService` | `services/campaignService.ts` | In-memory campaign metrics, reaction tracking, stats aggregation |
| `eventBatcher` | `services/eventBatcher.ts` | Deduplicated event buffering, periodic flush, optional Walrus archival |

### Handlers

| Handler | File | Purpose |
|---------|------|---------|
| Core handlers | `handlers.ts` | Member joins, reactions, messages, `!link`, `!encrypt`, `!decrypt`, campaign command routing |
| Campaign handler | `handlers/campaignHandler.ts` | `!campaign-*` commands — stats, create, list, announce, leaderboard |

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

Copy the root `bots/.env.example` to `bots/.env` and fill in:

```bash
# Required — Discord
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
WEBHOOK_URL=http://localhost:8080/webhooks/discord
WEBHOOK_SECRET=your_webhook_secret

# Required for Seal/Walrus integration
SUI_PRIVATE_KEY=suiprivkey1...
SUI_NETWORK=testnet
PACKAGE_ID=0xd86712244386bdfd82906dae8bed7be6760df054536abde426fd2dc16f9b41a4
ORG_REGISTRY_ID=0xea7c522c85660fc793d51e64464caf29956594d47997d4217e0a22000cdcd4e6
PROFILE_REGISTRY_ID=0x395e1731de16b7393f80afba04252f18c56e1cf994e9d77c755a759f8bc5c4b0

# Optional — Campaign API
CAMPAIGN_API_BASE_URL=http://localhost:3000

# Optional — Event Batcher
BATCH_FLUSH_INTERVAL_MS=15000
BATCH_MAX_KEYS=100
BATCH_RETENTION_MS=1800000
BATCH_WALRUS_ARCHIVE=false
```

**Generating SUI_PRIVATE_KEY:**
```bash
sui keytool generate ed25519
# Copy the suiprivkey1... value
```

The bot's Sui address (derived from the keypair) must be registered as an org member in Tidal by the admin. The bot needs at least Manager role (level 2) to encrypt/decrypt.

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

## Commands

### General

| Command | Description |
|---------|-------------|
| `!link` | Get instructions to link Discord account to Sui wallet |
| `!encrypt <text>` | Encrypt text via Seal and upload to Walrus |
| `!decrypt <blobId> <resourceObjectId>` | Download from Walrus and decrypt via Seal |

### Campaign Management

| Command | Alias | Description |
|---------|-------|-------------|
| `!campaign-create <name> [description]` | `!campcreate` | Create a new campaign |
| `!campaign-list` | `!camplist` | List all active campaigns |
| `!campaign-stats <campaign_id>` | `!campstats` | View real-time campaign engagement metrics |
| `!campaign-announce <campaign_id> [text]` | `!campannounce` | Post campaign announcement to its channel |
| `!campaign-leaderboard <campaign_id>` | `!campleaderboard` | View top participants leaderboard |

Campaign commands also support the `!campaign <subcommand>` syntax (e.g., `!campaign stats my-campaign`).

## Event Tracking

### Events Tracked

| Event | Trigger | Kind |
|-------|---------|------|
| Member Join | User joins the server | `joined` |
| Reaction | User reacts to a message | `reacted` or `campaign_interaction` |
| Campaign Message | Message contains `campaign_id: <id>` | `campaign_interaction` |

### Event Batching

Events are deduplicated and batched before being sent to the webhook API:

- **Deduplication key**: `platform | kind | campaign_id | external_id | reaction`
- **Flush interval**: Every 15s (configurable via `BATCH_FLUSH_INTERVAL_MS`)
- **Max buffer**: Flushes immediately when 100 unique keys are buffered
- **Retention**: Events older than 30 minutes are dropped on flush
- **Walrus archive**: When `BATCH_WALRUS_ARCHIVE=true`, each flush batch is encrypted via Seal and stored on Walrus as a permanent record

### Event Payload

```json
{
  "external_id": "123456789",
  "platform": "discord",
  "kind": "campaign_interaction",
  "campaign_id": "nft-mint-2026",
  "timestamp": "2026-03-17T00:00:00Z",
  "metadata": {
    "guild_id": "...",
    "guild_name": "...",
    "channel_id": "...",
    "channel_name": "...",
    "message_id": "...",
    "content": "...",
    "username": "user123",
    "batch_count": 3,
    "batch_first_seen": "2026-03-17T00:00:00Z",
    "batch_last_seen": "2026-03-17T00:00:15Z",
    "dedupe_key": "discord|campaign_interaction|nft-mint-2026|123456789|",
    "walrus_blob_id": "...",
    "walrus_encryption_id": "...",
    "walrus_sui_ref": "..."
  }
}
```

## Campaign Tracking

To track a campaign, include the campaign ID in your Discord message:

```
New NFT Drop! campaign_id: nft-mint-2026

React to this message to participate!
```

When users react or reply, the bot detects the `campaign_id` pattern and sends a `campaign_interaction` event. Campaign stats (reactions, messages, top participants) are tracked in-memory and merged with API-side data when queried via `!campaign-stats`.

## Seal/Walrus Architecture

The bot uses server-side Seal encryption (no browser wallet required):

1. **Keypair**: Bot has its own Ed25519 keypair (`SUI_PRIVATE_KEY`)
2. **Session Key**: `botKeypair.signPersonalMessage()` authenticates with Seal key servers
3. **Threshold**: 4 Seal key servers, threshold of 2 required for decryption
4. **Access Control**: Seal calls `seal_approve` in the Move contract which checks `OrgAccessRegistry` for the bot's role level
5. **Storage**: Encrypted blobs stored on Walrus with multi-publisher fallback (3 publishers, 3 aggregators)
6. **EncryptedResource**: Created as immutable (frozen) objects so any authorized org member can reference them for decryption

## Security

- All webhook requests are signed with HMAC-SHA256 (`X-Webhook-Signature` header)
- `SUI_PRIVATE_KEY` is never exposed — only used server-side for signing
- Seal/Walrus failures don't break core webhook functionality (graceful degradation)
- Bot address must be registered on-chain — unauthorized bots cannot decrypt
- Campaign API requests use parameterized URLs with `encodeURIComponent` to prevent injection
