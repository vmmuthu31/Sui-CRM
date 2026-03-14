import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
    jwtToAddress,
    getZkLoginSignature,
    genAddressSeed,
    computeZkLoginAddressFromSeed,
} from "@mysten/sui/zklogin";
import { jwtDecode } from "jwt-decode";
import { SessionManager } from "./session";

const OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export interface DecodedJWT {
    email: string;
    sub: string;
    aud: string | string[];
    iss: string;
    nonce: string;
    [key: string]: any;
}

/**
 * Core zkLogin Utility for Sui-CRM
 *
 * Uses Enoki API endpoints for nonce + ZKP generation (consistent with
 * Enoki's sponsored transaction flow). This avoids Mode A/B mismatches
 * that occur when mixing Mysten's prover with Enoki's sponsorship.
 */
export class ZkLoginService {
    /**
     * Initializes a new secure zkLogin session using Enoki's nonce endpoint.
     * - Generates an ephemeral keypair
     * - Calls Enoki /v1/zklogin/nonce to get nonce, maxEpoch, randomness
     * - Saves everything to SessionManager
     */
    static async initializeSession() {
        const ephemeralKeyPair = new Ed25519Keypair();

        // Enoki expects the Sui public key format (with Ed25519 flag byte)
        const ephemeralPublicKey = ephemeralKeyPair.getPublicKey().toSuiPublicKey();

        const nonceRes = await fetch(process.env.NEXT_PUBLIC_ENOKI_NONCE_URL!, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_ENOKI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                network: process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet",
                ephemeralPublicKey,
                additionalEpochs: 2,
            }),
        });

        if (!nonceRes.ok) {
            const errText = await nonceRes.text();
            throw new Error(`Enoki nonce error (${nonceRes.status}): ${errText}`);
        }

        const { data } = await nonceRes.json();
        const { nonce, randomness, maxEpoch } = data;

        // Save to localStorage before OAuth redirect
        SessionManager.saveSession({
            ephemeralPrivateKey: ephemeralKeyPair.getSecretKey(),
            randomness,
            maxEpoch: maxEpoch.toString(),
            nonce,
        });

        return { ephemeralKeyPair, nonce, randomness, maxEpoch };
    }

    /**
     * Constructs the Google OAuth URL for redirecting the user.
     */
    static getOAuthUrl(nonce: string, clientId: string, redirectUri: string) {
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: "id_token",
            scope: "openid email profile",
            nonce: nonce,
            state: "random_state_" + Date.now(),
        });

        return `${OAUTH_URL}?${params.toString()}`;
    }

    /**
     * Recreates an Ephemeral Keypair from the Bech32 secret key stored in the session.
     */
    static recreateKeyPair(secretKeyBech32: string): Ed25519Keypair {
        return Ed25519Keypair.fromSecretKey(secretKeyBech32);
    }

    /**
     * Fetches the ZK proof from Enoki's ZKP endpoint.
     *
     * Unlike Mysten's prover, Enoki's endpoint:
     *  - Uses the public API key + zklogin-jwt header (not raw salt)
     *  - Returns addressSeed in the proof (cryptographically bound)
     *  - Ensures consistency with Enoki's sponsored transaction flow
     */
    static async fetchZkProof(params: {
        jwtToken: string;
        ephemeralKeyPair: Ed25519Keypair;
        randomness: string;
        maxEpoch: number;
        userSalt: string; // kept for fallback but Enoki manages salt internally
    }) {
        const ephemeralPublicKey = params.ephemeralKeyPair.getPublicKey().toSuiPublicKey();

        const response = await fetch(process.env.NEXT_PUBLIC_ENOKI_ZKP_URL!, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_ENOKI_API_KEY}`,
                "Content-Type": "application/json",
                "zklogin-jwt": params.jwtToken,
            },
            body: JSON.stringify({
                network: process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet",
                ephemeralPublicKey,
                maxEpoch: params.maxEpoch,
                randomness: params.randomness,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Enoki ZKP error (${response.status}): ${errText}`);
        }

        const json = await response.json();
        // Enoki wraps the proof in a `data` field
        return json.data || json;
    }

    /**
     * Combines the ephemeral signature with the ZK proof to form the final
     * zkLogin signature submitted to the Sui network.
     *
     * CRITICAL: Uses Enoki's addressSeed from the proof (not locally computed).
     * The Groth16 proof is cryptographically tied to Enoki's addressSeed.
     */
    static createTransactionSignature(
        zkProof: any,
        maxEpoch: number,
        ephemeralSignature: string,
        jwtToken: string,
        userSalt: string
    ): string {
        const decodedJWT = jwtDecode<DecodedJWT>(jwtToken);
        const aud = Array.isArray(decodedJWT.aud) ? decodedJWT.aud[0] : decodedJWT.aud;

        // Extract only proof components (not addressSeed — we'll set it explicitly)
        const partialZkProof = {
            proofPoints: zkProof.proofPoints,
            issBase64Details: zkProof.issBase64Details,
            headerBase64: zkProof.headerBase64,
        };

        // Use Enoki's addressSeed if present (proof is cryptographically tied to it).
        // Fall back to local computation only if Enoki didn't provide one.
        let addressSeed: string;
        if (zkProof.addressSeed) {
            addressSeed = zkProof.addressSeed;
        } else {
            addressSeed = genAddressSeed(
                BigInt(userSalt),
                "sub",
                decodedJWT.sub,
                aud
            ).toString();
        }

        const zkInputs = {
            ...partialZkProof,
            addressSeed,
        };

        return getZkLoginSignature({
            inputs: zkInputs,
            maxEpoch,
            userSignature: ephemeralSignature,
        });
    }

    /**
     * Convenience wrapper that creates a transaction signature using cached proof data.
     */
    static getTransactionSignature(params: {
        ephemeralSignature: string | Uint8Array;
        useCache?: boolean;
        zkProof?: any;
        maxEpoch?: number;
        jwtToken?: string;
        userSalt?: string;
    }): string {
        if (params.useCache) {
            const cached = SessionManager.getProof();
            if (!cached || !cached.jwtToken || !cached.userSalt) {
                throw new Error("No cached proof available. Please log in again.");
            }
            return this.createTransactionSignature(
                cached.zkProof,
                cached.maxEpoch,
                params.ephemeralSignature as string,
                cached.jwtToken,
                cached.userSalt
            );
        }

        if (!params.zkProof || !params.maxEpoch || !params.jwtToken || !params.userSalt) {
            throw new Error("Missing required parameters for signature creation");
        }

        return this.createTransactionSignature(
            params.zkProof,
            params.maxEpoch,
            params.ephemeralSignature as string,
            params.jwtToken,
            params.userSalt
        );
    }

    /**
     * Computes the zkLogin address.
     *
     * If an Enoki addressSeed is available, uses it (consistent with the proof).
     * Otherwise falls back to jwtToAddress with local salt.
     */
    static getZkLoginAddress(jwtToken: string, userSalt: string, addressSeed?: string): string {
        if (addressSeed) {
            const decodedJWT = jwtDecode<DecodedJWT>(jwtToken);
            return computeZkLoginAddressFromSeed(
                BigInt(addressSeed),
                decodedJWT.iss,
                false
            );
        }
        return jwtToAddress(jwtToken, userSalt, false);
    }
}
