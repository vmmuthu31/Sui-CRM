"use client";

import { useEffect, useState, useRef } from "react";
import { ZkLoginService } from "@/lib/zklogin/zklogin";
import { SessionManager } from "@/lib/zklogin/session";
import { jwtDecode } from "jwt-decode";
import { DecodedJWT } from "@/lib/zklogin/zklogin";

export function ZkLoginCallbackTemplate() {
    const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
    const [errorMsg, setErrorMsg] = useState("");
    const processingRef = useRef(false);

    useEffect(() => {
        // 1. Get Google JWT token from the URL Hash Fragment
        const hash = window.location.hash;
        if (!hash || processingRef.current) return;

        processingRef.current = true;
        const urlParams = new URLSearchParams(hash.substring(1));
        const jwtToken = urlParams.get("id_token");

        if (!jwtToken) {
            setStatus("error");
            setErrorMsg("No JWT token found in URL");
            return;
        }

        const processZkLogin = async () => {
            try {
                // 2. Retrieve the active session (containing ephemeral key info)
                const session = SessionManager.getSession();
                if (!session) {
                    throw new Error("No active zkLogin session found. Please login again.");
                }

                // 3. Derive/Retrieve User Salt
                // NOTE: In production, user salt MUST be deterministic and securely fetched
                // via a backend service or Mysten's API based on the user's encoded email.
                const decodedJWT = jwtDecode<DecodedJWT>(jwtToken);
                const email = decodedJWT.email;
                let salt = session.userSalt;
                if (!salt) {
                    // TEMPLATE DEMO: Create deterministic mock salt for testing
                    const encoder = new TextEncoder();
                    const encoded = encoder.encode(email);
                    const hash = Array.from(encoded).reduce((acc, val) => (acc << 5) - acc + val, 0);
                    salt = Math.abs(hash).toString();
                }

                // 4. Recreate Keypair and Request ZK Proof
                const ephemeralKeyPair = ZkLoginService.recreateKeyPair(session.ephemeralPrivateKey);
                const zkProof = await ZkLoginService.fetchZkProof({
                    jwtToken,
                    ephemeralKeyPair,
                    randomness: session.randomness,
                    maxEpoch: parseInt(session.maxEpoch),
                    userSalt: salt
                });

                // 5. Compute Address and Store Proof Locally
                const address = ZkLoginService.getZkLoginAddress(jwtToken, salt);

                SessionManager.saveProof({
                    zkProof,
                    jwtToken,
                    address,
                    userSalt: salt,
                    maxEpoch: parseInt(session.maxEpoch),
                    randomness: session.randomness,
                    ephemeralPrivateKey: session.ephemeralPrivateKey
                });

                // Clean up the setup session
                SessionManager.clearSession();

                // 6. Navigate user to a protected route / dashboard
                setStatus("success");
                // window.location.href = "/dashboard";
            } catch (error: Omit<Error, "name"> | any) {
                setStatus("error");
                setErrorMsg(error.message || "Failed to finalize zkLogin");
            }
        };

        processZkLogin();

        // Clear fragment hash
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
            {status === "processing" && (
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-lg font-medium text-foreground">Finalizing Secure Log In...</p>
                    <p className="text-sm text-muted-foreground mt-2">Generating Zero Knowledge Proof</p>
                </div>
            )}

            {status === "success" && (
                <div className="text-center text-green-600">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-xl font-bold">Successfully Logged In!</p>
                    <p className="text-sm text-muted-foreground mt-2">Redirecting to Dashboard...</p>
                </div>
            )}

            {status === "error" && (
                <div className="text-center text-red-600 max-w-md">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xl font-bold mb-2">Login Failed</p>
                    <p className="text-sm" dangerouslySetInnerHTML={{ __html: errorMsg }}></p>
                    <button
                        onClick={() => window.location.href = "/"}
                        className="mt-6 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}
