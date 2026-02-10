export type Platform = "discord" | "telegram" | "twitter" | "farcaster";

export type EventKind =
  | "joined"
  | "clicked"
  | "reacted"
  | "messaged"
  | "campaign_interaction"
  | "followed"
  | "retweeted"
  | "liked"
  | "quoted"
  | "mentioned"
  | "casted"
  | "recasted";

export interface CommunityEvent {
  external_id: string;
  platform: Platform;
  kind: EventKind;
  campaign_id?: string;
  timestamp: string;
  metadata?: {
    tweet_id?: string;
    tweet_text?: string;
    username?: string;
    user_handle?: string;
    hashtags?: string[];
    mentions?: string[];
    retweet_count?: number;
    like_count?: number;
    reply_count?: number;
    [key: string]: unknown;
  };
}

export interface WebhookPayload {
  event: CommunityEvent;
  signature: string;
}

export interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
  bearerToken: string;
}
