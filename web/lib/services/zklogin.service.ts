"use server";

import { getSuiClient, getNetwork } from "@/lib/config/sui";
import { decodeJwt } from "jose";
import {
  generateNonce,
  generateRandomness,
  getExtendedEphemeralPublicKey,
  jwtToAddress,
  getZkLoginSignature,
  genAddressSeed,
} from "@mysten/sui/zklogin";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";
import { toBase64 } from "@mysten/sui/utils";
import {
  type OAuthProvider,
  type ZkLoginSession,
  type ZkLoginProof,
  type EphemeralKeyPair,
  OAUTH_PROVIDER_CONFIG,
  PROVER_ENDPOINTS,
} from "../types/zklogin";

const SALT_SECRET = process.env.ZKLOGIN_SALT_SECRET || "zk-intentbook-salt-v1";

function generateUserSalt(sub: string, aud: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${SALT_SECRET}:${sub}:${aud}`);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash + char) | 0;
  }
  const saltBigInt = BigInt(Math.abs(hash)) * BigInt("1000000000000000");
  return saltBigInt.toString();
}

export async function createEphemeralKeyPair(): Promise<EphemeralKeyPair> {
  const client = getSuiClient();
  const { epoch } = await client.getLatestSuiSystemState();
  const maxEpoch = Number(epoch) + 10;

  const keypair = new Ed25519Keypair();
  const randomness = generateRandomness();
  const nonce = generateNonce(keypair.getPublicKey(), maxEpoch, randomness);

  const privateKeyBase64 = keypair.getSecretKey();
  const publicKeyBytes = keypair.getPublicKey().toRawBytes();

  return {
    publicKey: toBase64(publicKeyBytes),
    privateKey: privateKeyBase64,
    nonce,
    maxEpoch,
    randomness,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
}

export async function getOAuthLoginUrl(
  provider: OAuthProvider,
  nonce: string,
  redirectUri: string,
): Promise<string> {
  const config = OAUTH_PROVIDER_CONFIG[provider];
  const clientId = getClientId(provider);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "id_token",
    scope: "openid",
    nonce: nonce,
  });

  if (provider === "google") {
    params.set("scope", "openid email profile");
  } else if (provider === "facebook") {
    params.set("scope", "openid");
  } else if (provider === "twitch") {
    params.set("scope", "openid user:read:email");
    params.set("claims", JSON.stringify({ id_token: { email: null } }));
  } else if (provider === "apple") {
    params.set("scope", "openid email name");
    params.set("response_mode", "fragment");
  }

  return `${config.authUrl}?${params.toString()}`;
}

function getClientId(provider: OAuthProvider): string {
  const envKey = `NEXT_PUBLIC_${provider.toUpperCase()}_CLIENT_ID`;
  const clientId = process.env[envKey];

  if (!clientId) {
    throw new Error(`Missing ${envKey} environment variable`);
  }

  return clientId;
}

export async function processJwtToken(
  jwt: string,
  ephemeralKeyPair: EphemeralKeyPair,
  provider: OAuthProvider,
): Promise<ZkLoginSession> {
  const decoded = decodeJwt(jwt);

  const sub = decoded.sub as string;
  const aud = Array.isArray(decoded.aud)
    ? decoded.aud[0]
    : (decoded.aud as string);
  const iss = decoded.iss as string;

  if (!sub || !aud || !iss) {
    throw new Error("Invalid JWT: missing required claims");
  }

  const salt = generateUserSalt(sub, aud);
  const address = jwtToAddress(jwt, salt, false);

  return {
    ephemeralKeyPair,
    jwt,
    salt,
    address,
    provider,
    sub,
    aud,
    expiresAt: ephemeralKeyPair.expiresAt,
  };
}

export async function generateZkProof(
  jwt: string,
  ephemeralPublicKey: string,
  maxEpoch: number,
  randomness: string,
  salt: string,
): Promise<ZkLoginProof> {
  const network = getNetwork();
  const proverUrl = PROVER_ENDPOINTS[network] || PROVER_ENDPOINTS.testnet;

  const publicKeyBytes = Buffer.from(ephemeralPublicKey, "base64");
  const publicKey = new Ed25519PublicKey(publicKeyBytes);
  const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(publicKey);

  const response = await fetch(proverUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jwt,
      extendedEphemeralPublicKey,
      maxEpoch,
      jwtRandomness: randomness,
      salt,
      keyClaimName: "sub",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to generate ZK proof: ${error}`);
  }

  return response.json();
}

export async function createZkLoginSignature(
  userSignature: string,
  zkProof: ZkLoginProof,
  maxEpoch: number,
  jwt: string,
  salt: string,
): Promise<string> {
  const decoded = decodeJwt(jwt);
  const aud = Array.isArray(decoded.aud)
    ? decoded.aud[0]
    : (decoded.aud as string);
  const sub = decoded.sub as string;

  const addressSeed = genAddressSeed(BigInt(salt), "sub", sub, aud).toString();

  return getZkLoginSignature({
    inputs: {
      ...zkProof,
      addressSeed,
    },
    maxEpoch,
    userSignature,
  });
}

export async function getCurrentEpoch(): Promise<number> {
  const client = getSuiClient();
  const { epoch } = await client.getLatestSuiSystemState();
  return Number(epoch);
}

export async function verifyZkLoginSession(
  session: ZkLoginSession,
): Promise<boolean> {
  if (Date.now() > session.expiresAt) {
    return false;
  }

  const currentEpoch = await getCurrentEpoch();
  if (currentEpoch > session.ephemeralKeyPair.maxEpoch) {
    return false;
  }

  return true;
}
