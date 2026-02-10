import crypto from "crypto";
import type { CommunityEvent, WebhookPayload } from "./types.js";

const WEBHOOK_URL =
  process.env.WEBHOOK_URL || "http://localhost:8080/webhooks/farcaster";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "default_secret";

function generateSignature(payload: string): string {
  return crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");
}

export async function sendWebhook(event: CommunityEvent): Promise<void> {
  try {
    const payload = JSON.stringify(event);
    const signature = generateSignature(payload);

    const webhookPayload: WebhookPayload = {
      event,
      signature,
    };

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook failed: ${response.status} - ${errorText}`);
    }

    console.log(
      `✅ Webhook sent for ${event.kind} event from ${event.external_id}`,
    );
  } catch (error) {
    console.error("Failed to send webhook:", error);
  }
}
