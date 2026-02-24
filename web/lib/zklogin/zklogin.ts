import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
    generateNonce,
    generateRandomness,
    jwtToAddress,
    getZkLoginSignature,
    genAddressSeed,
    computeZkLoginAddressFromSeed,
} from "@mysten/sui/zklogin";
import { jwtDecode } from "jwt-decode";
import { SessionManager } from "./session";

// NOTE: These are testnet URLs for Mysten's services.
// Do NOT use these in Mainnet production without updating to your own/mainnet providers!
const PROVER_URL = "https://prover-dev.mystenlabs.com/v1";
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
 * Core zkLogin Utility Setup for Sui-CRM
 * Designed to be clean, unintegrated, and isolated.
 */
export class ZkLoginService {
    /**
     * Initializes a new secure zkLogin session.
     * - Generates an ephemeral key pair
     * - Sets a max epoch (usually current epoch + 2)
     * - Generates randomness & nonce
     * - Saves everything to the SessionManager
     */
    static async initializeSession() {
        // 1. Generate new ephemeral keypair
        const ephemeralKeyPair = new Ed25519Keypair();

        // 2. Define validity (Max Epoch). For test environments, hardcoding or fetching current epoch + 2 is recommended.
        // In a real dApp, fetch this from `suiClient.getLatestSuiSystemState()`
        const currentEpoch = 0; // Replace with actual fetch if integrating
        const maxEpoch = currentEpoch + 2;

        // 3. Generate randomness and nonce
        const randomness = generateRandomness();
        const nonce = generateNonce(
            ephemeralKeyPair.getPublicKey(),
            maxEpoch,
            randomness
        );

        // 4. Save to local storage before redirecting
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
     * Fetches the Zero Knowledge Proof from Mysten's Prover endpoint.
     */
    static async fetchZkProof(params: {
        jwtToken: string;
        ephemeralKeyPair: Ed25519Keypair;
        randomness: string;
        maxEpoch: number;
        userSalt: string;
    }) {
        // Determine user salt. Needs a backend salt service ideally,
        // but here we demonstrate a client-side hardcoded or derived one for template purposes
        const salt = params.userSalt;

        const proofRequest = {
            jwt: params.jwtToken,
            extendedEphemeralPublicKey: params.ephemeralKeyPair.getPublicKey().toSuiPublicKey(),
            maxEpoch: params.maxEpoch,
            jwtRandomness: params.randomness,
            salt: salt,
            keyClaimName: "sub",
        };

        const response = await fetch(PROVER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(proofRequest),
        });

        if (!response.ok) {
            throw new Error(`ZKP Service error: ${response.status}`);
        }

        const proof = await response.json();
        return proof;
    }

    /**
     * Combines the User Signature (signed by ephemeral key) with the ZK Proof to
     * form the final zkLogin Signature submitted to the Sui network.
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

        // Address seed is mathematically derived from salt, claim names, claim val, and aud.
        const addressSeed = genAddressSeed(
            BigInt(userSalt),
            "sub",
            decodedJWT.sub,
            aud
        ).toString();

        // Prepare inputs as expected by `@mysten/sui/zklogin`
        const zkInputs = {
            proofPoints: {
                a: zkProof.proofPoints.a,
                b: zkProof.proofPoints.b,
                c: zkProof.proofPoints.c,
            },
            issBase64Details: zkProof.issBase64Details,
            headerBase64: zkProof.headerBase64,
            addressSeed: addressSeed,
        };

        return getZkLoginSignature({
            inputs: zkInputs,
            maxEpoch: maxEpoch,
            userSignature: ephemeralSignature,
        });
    }

    /**
     * Decodes a JWT and computes the Sui zkLogin Address.
     */
    static getZkLoginAddress(jwtToken: string, userSalt: string): string {
        return jwtToAddress(jwtToken, userSalt);
    }
}
