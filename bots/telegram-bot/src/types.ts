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
    chat_id?: string;
    chat_title?: string;
    message_id?: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    content?: string;
    action?: string;
    [key: string]: unknown;
  };
}

export interface WebhookPayload {
  event: CommunityEvent;
  signature: string;
}
