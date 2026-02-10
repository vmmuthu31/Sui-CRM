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
    cast_hash?: string;
    cast_text?: string;
    username?: string;
    fid?: number;
    channel?: string;
    parent_hash?: string;
    mentions?: number[];
    embeds?: string[];
    target_cast_hash?: string;
    reaction_type?: string;
    target_fid?: number;
    [key: string]: unknown;
  };
}

export interface WebhookPayload {
  event: CommunityEvent;
  signature: string;
}
