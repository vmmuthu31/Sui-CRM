import { NextRequest, NextResponse } from "next/server";
import { createSponsoredTransaction } from "@/lib/services/enoki.service";

/**
 * POST /api/sponsor
 *
 * Called by the frontend after building a transaction with onlyTransactionKind: true.
 * Forwards the tx kind bytes to Enoki and returns sponsored { digest, bytes } for the
 * user to sign with their ephemeral zkLogin keypair.
 *
 * Body:
 *   transactionKindBytes  string   Base64 tx kind bytes
 *   sender                string   User's zkLogin Sui address
 *   allowedMoveCallTargets? string[]
 *   allowedAddresses?       string[]
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transactionKindBytes, sender, jwtToken, allowedMoveCallTargets, allowedAddresses } = body;

    if (!transactionKindBytes || !sender) {
      return NextResponse.json(
        { error: "transactionKindBytes and sender are required" },
        { status: 400 }
      );
    }

    const result = await createSponsoredTransaction({
      transactionKindBytes,
      sender,
      jwtToken,
      allowedMoveCallTargets,
      allowedAddresses,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[/api/sponsor] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
