"use server";

/**
 * Enoki Sponsored Transactions Service
 *
 * This service allows the organization (manager) to sponsor gas fees for
 * all team members, so users can interact with the Sui blockchain without
 * holding any SUI tokens.
 *
 * Flow:
 *   1. User builds a transaction (onlyTransactionKind: true)
 *   2. Backend calls Enoki POST /v1/transaction-blocks/sponsor → gets { digest, bytes }
 *   3. User signs `bytes` with their ephemeral keypair (zkLogin)
 *   4. Backend calls Enoki POST /v1/transaction-blocks/sponsor/{digest} with signature
 *   5. Enoki broadcasts the sponsored tx; returns final digest
 *
 * Setup:
 *   - Create an account at https://portal.enoki.mystenlabs.com
 *   - Fund your gas pool via the Enoki Portal (Manager deposits SUI)
 *   - Set ENOKI_SECRET_KEY in your server environment (never expose client-side)
 *   - Set NEXT_PUBLIC_SUI_NETWORK to match your Enoki app network (testnet/mainnet)
 */

const ENOKI_API_BASE = "https://api.enoki.mystenlabs.com/v1";
const ENOKI_SECRET_KEY = process.env.ENOKI_SECRET_KEY;
const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";

export interface CreateSponsoredTxInput {
  /** Base64-encoded transaction kind bytes (built with onlyTransactionKind: true) */
  transactionKindBytes: string;
  /** The sender's Sui address (the zkLogin user's derived address) */
  sender: string;
  /** JWT token for zkLogin users — sent as zklogin-jwt header so Enoki can bind the sponsored tx to the session */
  jwtToken?: string;
  /** Optional: restrict which Move call targets are permitted */
  allowedMoveCallTargets?: string[];
  /** Optional: restrict which Sui addresses can appear in the transaction */
  allowedAddresses?: string[];
}

export interface CreateSponsoredTxResult {
  /** The transaction digest used in the next step */
  digest: string;
  /** Base64-encoded full transaction bytes for the user to sign */
  bytes: string;
}

export interface ExecuteSponsoredTxResult {
  /** The final on-chain transaction digest */
  digest: string;
}

/**
 * Step 1 of sponsorship: submit tx kind bytes to Enoki, receive full sponsored tx bytes.
 * Called from the Next.js API route — never from client-side code.
 */
export async function createSponsoredTransaction(
  input: CreateSponsoredTxInput
): Promise<CreateSponsoredTxResult> {
  if (!ENOKI_SECRET_KEY) {
    throw new Error(
      "ENOKI_SECRET_KEY is not set. Add it to your server environment to enable sponsored transactions."
    );
  }

  const body: Record<string, any> = {
    network: SUI_NETWORK,
    transactionBlockKindBytes: input.transactionKindBytes,
    sender: input.sender,
  };
  if (input.allowedMoveCallTargets?.length) {
    body.allowedMoveCallTargets = input.allowedMoveCallTargets;
  }
  if (input.allowedAddresses?.length) {
    body.allowedAddresses = input.allowedAddresses;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ENOKI_SECRET_KEY}`,
  };
  if (input.jwtToken) {
    headers["zklogin-jwt"] = input.jwtToken;
  }

  const response = await fetch(`${ENOKI_API_BASE}/transaction-blocks/sponsor`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Enoki sponsor error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  return {
    digest: json.data.digest,
    bytes: json.data.bytes,
  };
}

/**
 * Step 2 of sponsorship: submit the user's zkLogin signature to finalise and broadcast the tx.
 * Called from the Next.js API route — never from client-side code.
 */
export async function executeSponsoredTransaction(
  digest: string,
  signature: string
): Promise<ExecuteSponsoredTxResult> {
  if (!ENOKI_SECRET_KEY) {
    throw new Error("ENOKI_SECRET_KEY is not set.");
  }

  const response = await fetch(
    `${ENOKI_API_BASE}/transaction-blocks/sponsor/${digest}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENOKI_SECRET_KEY}`,
      },
      body: JSON.stringify({ signature }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Enoki execute error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  return { digest: json.data.digest };
}

/**
 * Check whether sponsored transactions are configured (non-empty secret key).
 * Safe to call server-side only.
 */
export async function isSponsorshipConfigured(): Promise<boolean> {
  return !!ENOKI_SECRET_KEY;
}
