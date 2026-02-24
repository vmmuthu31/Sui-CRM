import { NextResponse } from "next/server";
import { isSponsorshipConfigured } from "@/lib/services/enoki.service";

/**
 * GET /api/sponsor/status
 * Returns whether the Enoki secret key is configured on the server.
 * Safe to expose — only returns a boolean, never the key itself.
 */
export async function GET() {
  const configured = await isSponsorshipConfigured();
  return NextResponse.json({ configured });
}
