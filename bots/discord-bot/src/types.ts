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
    guild_id?: string;
    guild_name?: string;
    channel_id?: string;
    channel_name?: string;
    message_id?: string;
    reaction?: string;
    content?: string;
    username?: string;
    display_name?: string;
    [key: string]: unknown;
  };
}

export interface WebhookPayload {
  event: CommunityEvent;
  signature: string;
}
