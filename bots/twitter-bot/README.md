# Twitter Bot for Decentralized CRM

This Twitter bot tracks tweet interactions and sends events to the CRM webhook service using Twitter API v2 streaming.

## Features

- **Real-time Tweet Streaming**: Monitors tweets matching your criteria
- **Hashtag Tracking**: Track specific campaign hashtags
- **Account Monitoring**: Monitor tweets from specific accounts
- **Campaign Detection**: Automatically detect campaign IDs in tweets
- **Webhook Integration**: Sends all events to the Axum webhook service

## Setup

### 1. Create Twitter Developer Account

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Apply for a developer account (if you don't have one)
3. Create a new app
4. Generate API keys and tokens:
   - API Key
   - API Secret
   - Access Token
   - Access Secret
   - Bearer Token

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in:

```bash
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
TWITTER_BEARER_TOKEN=your_bearer_token
WEBHOOK_URL=http://localhost:8080/webhooks/twitter
WEBHOOK_SECRET=your_webhook_secret
TRACKED_HASHTAGS=#YourCampaign,#AnotherCampaign
TRACKED_ACCOUNTS=@YourAccount,@YourProject
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

## Events Tracked

### Tweet with Campaign ID

Triggered when a tweet contains a campaign ID.

```json
{
  "external_id": "1234567890",
  "platform": "twitter",
  "kind": "campaign_interaction",
  "campaign_id": "nft-mint-2026",
  "timestamp": "2026-02-11T00:00:00Z",
  "metadata": {
    "tweet_id": "...",
    "tweet_text": "...",
    "hashtags": ["YourCampaign"],
    "mentions": ["YourAccount"]
  }
}
```

### Tweet with Tracked Hashtag

```json
{
  "external_id": "1234567890",
  "platform": "twitter",
  "kind": "messaged",
  "timestamp": "2026-02-11T00:00:00Z",
  "metadata": {
    "tweet_id": "...",
    "tweet_text": "...",
    "hashtags": ["YourCampaign"]
  }
}
```

## Campaign Tracking

### Method 1: Hashtag Tracking

Configure tracked hashtags in `.env`:

```bash
TRACKED_HASHTAGS=#NFTMint2026,#YourProject
```

Any tweet with these hashtags will be tracked.

### Method 2: Campaign ID in Tweet

Include campaign ID in tweet text:

```
Excited for the new NFT drop! campaign_id: nft-mint-2026 #NFT #Web3
```

The bot will extract the campaign ID and send a `campaign_interaction` event.

### Method 3: Account Monitoring

Track all tweets from specific accounts:

```bash
TRACKED_ACCOUNTS=@YourProject,@YourFounder
```

## Streaming Rules

The bot automatically configures Twitter streaming rules based on your environment variables:

```typescript
// Hashtag rule
{
  value: "#YourCampaign OR #AnotherCampaign",
  tag: "campaign-hashtags"
}

// Account rule
{
  value: "from:YourAccount OR from:YourProject",
  tag: "tracked-accounts"
}
```

## Rate Limits

Twitter API v2 has the following limits:

- **Filtered stream**: 50 rules per app
- **Tweet cap**: 500,000 tweets/month (Essential access)
- **Connections**: 50 concurrent connections

For higher limits, upgrade to:

- **Elevated access**: 2M tweets/month
- **Academic Research**: 10M tweets/month

## Advanced Configuration

### Custom Stream Rules

Modify `src/index.ts` to add custom rules:

```typescript
const newRules = [
  {
    value: "your custom query",
    tag: "custom-rule",
  },
];
```

Twitter query operators:

- `from:username` - Tweets from specific user
- `#hashtag` - Tweets with hashtag
- `@mention` - Tweets mentioning user
- `keyword` - Tweets containing keyword
- `lang:en` - English tweets only
- `has:media` - Tweets with media

Example complex rule:

```typescript
{
  value: '(#NFT OR #Web3) from:YourAccount -is:retweet lang:en',
  tag: 'nft-original-tweets',
}
```

## Security

All webhook requests are signed with HMAC-SHA256. The signature is sent in the `X-Webhook-Signature` header.

## Monitoring

### Check Stream Status

The bot logs when:

- Stream rules are configured
- Stream starts successfully
- Tweets are received
- Errors occur

### Reconnection

The bot automatically reconnects if the stream disconnects.

## Troubleshooting

### "Invalid authentication credentials"

- Check your API keys and tokens
- Ensure Bearer Token is correct
- Verify app permissions in Twitter Developer Portal

### "Too many rules"

- Twitter allows max 50 rules per app
- Delete old rules or consolidate with OR operators

### "No tweets received"

- Verify your hashtags/accounts are correct
- Check if there are any tweets matching your criteria
- Test with a broader query first

### "Stream disconnects frequently"

- Check your network connection
- Verify rate limits aren't exceeded
- Review Twitter API status page

## Best Practices

1. **Start with broad rules** then narrow down
2. **Monitor rate limits** to avoid hitting caps
3. **Use specific hashtags** for better targeting
4. **Combine rules** with OR operators to save rule slots
5. **Test locally** before deploying to production

## Examples

### Track NFT Campaign

```bash
TRACKED_HASHTAGS=#NFTDrop,#MintNow
TRACKED_ACCOUNTS=@YourNFTProject
```

### Track Community Engagement

```bash
TRACKED_HASHTAGS=#YourDAO,#Governance
TRACKED_ACCOUNTS=@YourDAO,@YourFounder
```

### Track Product Launch

```bash
TRACKED_HASHTAGS=#ProductLaunch,#NewFeature
TRACKED_ACCOUNTS=@YourProduct,@YourCEO
```

## Resources

- [Twitter API v2 Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [Filtered Stream Guide](https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/introduction)
- [Building Rules](https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/integrate/build-a-rule)
- [twitter-api-v2 npm package](https://www.npmjs.com/package/twitter-api-v2)
