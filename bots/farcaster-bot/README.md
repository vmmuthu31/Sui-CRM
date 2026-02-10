# Farcaster Bot for Decentralized CRM

This Farcaster bot tracks casts, reactions, and follows using the Farcaster Hub API and sends events to the CRM webhook service.

## Features

- **Cast Tracking**: Monitor casts (posts) from specific users or channels
- **Reaction Tracking**: Track likes and recasts
- **Follow Tracking**: Monitor when users follow tracked accounts
- **Channel Monitoring**: Track activity in specific channels
- **Webhook Integration**: Sends all events to the Axum webhook service

## Setup

### 1. Farcaster Hub Access

You can use:

**Option A: Public Hub (Recommended for testing)**

```bash
FARCASTER_HUB_URL=https://hub.farcaster.xyz:2281
```

**Option B: Run Your Own Hub**

- Follow [Farcaster Hub Setup Guide](https://docs.farcaster.xyz/developers/guides/apps/hub)
- Requires significant resources (8GB RAM, 200GB storage)

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in:

```bash
FARCASTER_HUB_URL=https://hub.farcaster.xyz:2281
WEBHOOK_URL=http://localhost:8080/webhooks/farcaster
WEBHOOK_SECRET=your_webhook_secret
TRACKED_CHANNELS=your-channel,another-channel
TRACKED_USERS=12345,67890
```

**Finding FIDs (Farcaster IDs):**

- Go to [Warpcast](https://warpcast.com/)
- Visit user profile
- FID is in the URL: `warpcast.com/username` → check profile data

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

## Events Tracked

### Cast (Post)

Triggered when a tracked user posts or posts in a tracked channel.

```json
{
  "external_id": "12345",
  "platform": "farcaster",
  "kind": "casted",
  "timestamp": "2026-02-11T00:00:00Z",
  "metadata": {
    "cast_hash": "0x...",
    "cast_text": "...",
    "fid": 12345,
    "channel": "your-channel",
    "mentions": [67890],
    "embeds": ["https://..."]
  }
}
```

### Campaign Cast

Triggered when a cast contains a campaign ID.

```json
{
  "external_id": "12345",
  "platform": "farcaster",
  "kind": "campaign_interaction",
  "campaign_id": "nft-mint-2026",
  "timestamp": "2026-02-11T00:00:00Z",
  "metadata": {
    "cast_hash": "0x...",
    "cast_text": "Join our NFT mint! campaign_id: nft-mint-2026",
    "fid": 12345
  }
}
```

### Reaction (Like/Recast)

```json
{
  "external_id": "12345",
  "platform": "farcaster",
  "kind": "reacted",
  "timestamp": "2026-02-11T00:00:00Z",
  "metadata": {
    "fid": 12345,
    "target_cast_hash": "0x...",
    "reaction_type": "like"
  }
}
```

### Follow

Triggered when someone follows a tracked user.

```json
{
  "external_id": "12345",
  "platform": "farcaster",
  "kind": "followed",
  "timestamp": "2026-02-11T00:00:00Z",
  "metadata": {
    "fid": 12345,
    "target_fid": 67890
  }
}
```

## Campaign Tracking

Include campaign ID in your cast:

```
Excited for our new NFT drop! campaign_id: nft-mint-2026 🎨
```

The bot will automatically detect the campaign ID and send a `campaign_interaction` event.

## Channel Tracking

Configure channels to monitor:

```bash
TRACKED_CHANNELS=nfts,web3,your-project
```

All casts in these channels will be tracked.

## User Tracking

Configure specific users (FIDs) to monitor:

```bash
TRACKED_USERS=12345,67890,11111
```

All casts, reactions, and follows from/to these users will be tracked.

## Hub API

The bot uses the Farcaster Hub gRPC API:

```typescript
import { getSSLHubRpcClient } from "@farcaster/hub-nodejs";

const client = getSSLHubRpcClient(HUB_URL);

// Subscribe to events
const stream = await client.subscribe({
  eventTypes: [1, 3, 6], // Casts, Reactions, Links
  fromId: 0,
});
```

Event types:

- `1` - Cast (post)
- `3` - Reaction (like/recast)
- `6` - Link (follow)

## Rate Limits

Public Farcaster Hub:

- **Read operations**: Generally unlimited
- **Write operations**: Rate limited per FID
- **Streaming**: 1 connection per client

For production, consider:

- Running your own hub
- Using a dedicated hub service
- Implementing connection pooling

## Advanced Configuration

### Custom Event Filtering

Modify `src/index.ts` to add custom filters:

```typescript
async function handleCast(message: Message) {
  const text = castAddBody.text || "";

  // Custom filter
  if (text.includes("your-keyword")) {
    await sendWebhook(event);
  }
}
```

### Multiple Channel Tracking

```bash
TRACKED_CHANNELS=nfts,web3,dao,governance,community
```

### Specific User Monitoring

```bash
# Track your team members
TRACKED_USERS=12345,67890,11111,22222
```

## Security

All webhook requests are signed with HMAC-SHA256. The signature is sent in the `X-Webhook-Signature` header.

## Monitoring

### Check Connection Status

The bot logs when:

- Hub connection established
- Events received
- Errors occur

### Reconnection

The bot automatically reconnects if the connection drops.

## Troubleshooting

### "Failed to connect to hub"

- Check `FARCASTER_HUB_URL` is correct
- Verify network connectivity
- Try public hub: `https://hub.farcaster.xyz:2281`

### "No events received"

- Verify tracked FIDs are correct
- Check if tracked users are active
- Test with a broader filter first

### "Connection drops frequently"

- Check network stability
- Consider running your own hub
- Verify hub service status

## Best Practices

1. **Start with specific users** then expand
2. **Monitor popular channels** for engagement
3. **Use campaign IDs** for attribution
4. **Track key influencers** in your space
5. **Test locally** before production deployment

## Examples

### Track NFT Project

```bash
TRACKED_CHANNELS=nfts,art
TRACKED_USERS=12345,67890  # Your team FIDs
```

### Track DAO Activity

```bash
TRACKED_CHANNELS=governance,proposals
TRACKED_USERS=11111,22222  # Core contributors
```

### Track Community Growth

```bash
TRACKED_CHANNELS=your-project,community
TRACKED_USERS=12345  # Your project account
```

## Finding FIDs

### Method 1: Warpcast Profile

1. Go to user's Warpcast profile
2. Check URL or use Warpcast API
3. FID is the numeric identifier

### Method 2: Farcaster API

```bash
curl https://api.warpcast.com/v2/user-by-username?username=dwr
```

### Method 3: Hub API

```typescript
const userDataResult = await client.getUserDataByFid({ fid: 12345 });
```

## Resources

- [Farcaster Documentation](https://docs.farcaster.xyz/)
- [Hub API Reference](https://docs.farcaster.xyz/reference/hubble/httpapi/httpapi)
- [Farcaster Hub GitHub](https://github.com/farcasterxyz/hub-monorepo)
- [@farcaster/hub-nodejs](https://www.npmjs.com/package/@farcaster/hub-nodejs)
- [Warpcast](https://warpcast.com/) - Official Farcaster client

## Hub Setup (Advanced)

If you want to run your own hub:

```bash
# Clone hub repository
git clone https://github.com/farcasterxyz/hub-monorepo.git

# Follow setup instructions
cd hub-monorepo
# See README for detailed setup
```

Requirements:

- 8GB RAM minimum
- 200GB SSD storage
- Reliable network connection
- Docker or Node.js 18+
