import type { CommunityEvent } from "../types.js";

export interface CampaignApiRecord {
  id: string;
  name: string;
  description?: string;
  status: "active" | "paused" | "completed";
  created_by?: string;
  guild_id?: string;
  channel_id?: string;
  created_at: string;
  updated_at: string;
}

const CAMPAIGN_API_BASE_URL =
  process.env.CAMPAIGN_API_BASE_URL ||
  process.env.WEBHOOK_URL?.replace("/api/webhooks/telegram", "") ||
  process.env.WEBHOOK_URL?.replace("/webhooks/telegram", "") ||
  "http://localhost:3000";

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${CAMPAIGN_API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Campaign API ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function getCampaignById(campaignId: string): Promise<CampaignApiRecord | null> {
  try {
    return await requestJson<CampaignApiRecord>(
      `/api/campaigns/${encodeURIComponent(campaignId)}`,
    );
  } catch {
    return null;
  }
}

export async function enrichCampaignMetadata(
  event: CommunityEvent,
): Promise<CommunityEvent> {
  if (!event.campaign_id) return event;

  const campaign = await getCampaignById(event.campaign_id);

  return {
    ...event,
    metadata: {
      ...(event.metadata || {}),
      campaign_name: campaign?.name,
      campaign_status: campaign?.status,
      campaign_valid: !!campaign,
    },
  };
}
