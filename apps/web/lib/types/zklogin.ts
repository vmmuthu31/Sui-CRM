import { z } from "zod";

export const OAuthProviderSchema = z.enum([
  "google",
  "facebook",
  "twitch",
  "apple",
  "kakao",
  "slack",
  "microsoft",
]);

export type OAuthProvider = z.infer<typeof OAuthProviderSchema>;

export interface ZkLoginConfig {
  clientId: string;
  redirectUri: string;
  provider: OAuthProvider;
}

export interface EphemeralKeyPair {
  publicKey: string;
  privateKey: string;
  nonce: string;
  maxEpoch: number;
  randomness: string;
  expiresAt: number;
}

export interface ZkLoginSession {
  ephemeralKeyPair: EphemeralKeyPair;
  jwt: string;
  salt: string;
  address: string;
  provider: OAuthProvider;
  sub: string;
  aud: string;
  expiresAt: number;
}

export interface ZkLoginProof {
  proofPoints: {
    a: string[];
    b: string[][];
    c: string[];
  };
  issBase64Details: {
    value: string;
    indexMod4: number;
  };
  headerBase64: string;
}

export interface ZkLoginSignatureInputs {
  proof: ZkLoginProof;
  maxEpoch: number;
  userSignature: string;
  jwt: string;
  salt: string;
  ephemeralPublicKey: string;
}

export interface PartialZkLoginSignature {
  inputs: ZkLoginSignatureInputs;
  addressSeed: string;
}

export const OAUTH_PROVIDER_CONFIG: Record<
  OAuthProvider,
  {
    name: string;
    authUrl: string;
    icon: string;
    color: string;
  }
> = {
  google: {
    name: "Google",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    icon: "google",
    color: "#4285F4",
  },
  facebook: {
    name: "Facebook",
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    icon: "facebook",
    color: "#1877F2",
  },
  twitch: {
    name: "Twitch",
    authUrl: "https://id.twitch.tv/oauth2/authorize",
    icon: "twitch",
    color: "#9146FF",
  },
  apple: {
    name: "Apple",
    authUrl: "https://appleid.apple.com/auth/authorize",
    icon: "apple",
    color: "#000000",
  },
  kakao: {
    name: "Kakao",
    authUrl: "https://kauth.kakao.com/oauth/authorize",
    icon: "message-circle",
    color: "#FEE500",
  },
  slack: {
    name: "Slack",
    authUrl: "https://slack.com/oauth/v2/authorize",
    icon: "slack",
    color: "#4A154B",
  },
  microsoft: {
    name: "Microsoft",
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    icon: "microsoft",
    color: "#00A4EF",
  },
};

export const PROVER_ENDPOINTS: Record<string, string> = {
  devnet: "https://prover-dev.mystenlabs.com/v1",
  testnet: "https://prover-dev.mystenlabs.com/v1",
  mainnet: "https://prover.mystenlabs.com/v1",
};

export const SALT_SERVICE_URL = process.env.NEXT_PUBLIC_SALT_SERVICE_URL;
