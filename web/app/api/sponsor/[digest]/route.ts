import { NextRequest, NextResponse } from "next/server";
import { executeSponsoredTransaction } from "@/lib/services/enoki.service";

/**
 * POST /api/sponsor/:digest
 *
 * Called by the frontend after the user has signed the sponsored tx bytes
 * with their ephemeral zkLogin keypair. Forwards the zkLogin signature to
 * Enoki which then broadcasts the gas-sponsored transaction on-chain.
 *
 * Body:
 *   signature   string   The user's zkLogin signature (base64)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ digest: string }> }
) {
  try {
    const { digest } = await params;
    const body = await req.json();
    const { signature } = body;

    if (!digest || !signature) {
      return NextResponse.json(
        { error: "digest (path param) and signature (body) are required" },
        { status: 400 }
      );
    }

    const result = await executeSponsoredTransaction(digest, signature);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[/api/sponsor/:digest] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
