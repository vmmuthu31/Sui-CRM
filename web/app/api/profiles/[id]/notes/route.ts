import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/profiles/[id]/notes
 *
 * Returns encrypted note metadata for a profile. When the Sui indexer is wired,
 * this will query objects owned by the profile; for now returns an empty list.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: profileId } = await params;
    if (!profileId) {
      return NextResponse.json({ error: "Profile ID required" }, { status: 400 });
    }

    // TODO: Query Sui RPC or Postgres indexer for EncryptedResource objects
    // owned by or linked to this profile (resource_type: NOTE). Map to ResourceMetadata.
    const notes: Array<{
      resource_id: string;
      profile_id: string;
      org_id: string;
      resource_type: "note";
      blob_id: string;
      encryption_id: string;
      access_level: number;
      file_name?: string;
      created_at: string;
      created_by: string;
      walrus_url: string;
      sui_explorer_url: string;
    }> = [];

    return NextResponse.json(notes);
  } catch (err: unknown) {
    console.error("[/api/profiles/[id]/notes] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch notes" },
      { status: 500 }
    );
  }
}
