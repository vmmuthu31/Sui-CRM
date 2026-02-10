"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromBase64 } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import {
  createEphemeralKeyPair,
  getOAuthLoginUrl,
  processJwtToken,
  generateZkProof,
  createZkLoginSignature,
  verifyZkLoginSession,
} from "../services/zklogin.service";
import {
  OAuthProvider,
  type ZkLoginSession,
  type EphemeralKeyPair,
  type ZkLoginProof,
} from "../types/zklogin";

const STORAGE_KEY = "zk-intentbook-zklogin-session";
const EPHEMERAL_KEY_STORAGE = "zk-intentbook-ephemeral-key";

interface ZkLoginContextValue {
  session: ZkLoginSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  zkProof: ZkLoginProof | null;
  login: (provider: OAuthProvider) => Promise<void>;
  logout: () => void;
  handleCallback: (jwt: string) => Promise<void>;
  signTransaction: (tx: Transaction) => Promise<string>;
  signAndExecuteTransaction: (
    tx: Transaction,
    client: SuiJsonRpcClient,
  ) => Promise<string>;
  address: string | null;
  provider: OAuthProvider | null;
}

const ZkLoginContext = createContext<ZkLoginContextValue | null>(null);

interface ZkLoginProviderProps {
  children: ReactNode;
  redirectUri?: string;
}

export function ZkLoginProvider({
  children,
  redirectUri = typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : "",
}: ZkLoginProviderProps) {
  const [session, setSession] = useState<ZkLoginSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zkProof, setZkProof] = useState<ZkLoginProof | null>(null);
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(
    null,
  );

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setIsLoading(false);
        return;
      }

      const parsedSession: ZkLoginSession = JSON.parse(stored);
      const isValid = await verifyZkLoginSession(parsedSession);

      if (isValid) {
        setSession(parsedSession);
        const storedProof = localStorage.getItem(`${STORAGE_KEY}-proof`);
        if (storedProof) {
          setZkProof(JSON.parse(storedProof));
        }
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(`${STORAGE_KEY}-proof`);
        localStorage.removeItem(EPHEMERAL_KEY_STORAGE);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(
    async (provider: OAuthProvider) => {
      setIsLoading(true);
      try {
        const ephemeralKeyPair = await createEphemeralKeyPair();
        localStorage.setItem(
          EPHEMERAL_KEY_STORAGE,
          JSON.stringify(ephemeralKeyPair),
        );
        setPendingProvider(provider);

        const loginUrl = await getOAuthLoginUrl(
          provider,
          ephemeralKeyPair.nonce,
          redirectUri,
        );

        window.location.href = loginUrl;
      } catch (error) {
        console.error("Login failed:", error);
        setIsLoading(false);
        throw error;
      }
    },
    [redirectUri],
  );

  const handleCallback = useCallback(
    async (jwt: string) => {
      setIsLoading(true);
      try {
        const storedKey = localStorage.getItem(EPHEMERAL_KEY_STORAGE);
        if (!storedKey) {
          throw new Error("Ephemeral key not found");
        }

        const ephemeralKeyPair: EphemeralKeyPair = JSON.parse(storedKey);
        const storedProvider = pendingProvider || "google";

        const newSession = await processJwtToken(
          jwt,
          ephemeralKeyPair,
          storedProvider,
        );

        setSession(newSession);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));

        const proof = await generateZkProof(
          jwt,
          ephemeralKeyPair.publicKey,
          ephemeralKeyPair.maxEpoch,
          ephemeralKeyPair.randomness,
          newSession.salt,
        );

        setZkProof(proof);
        localStorage.setItem(`${STORAGE_KEY}-proof`, JSON.stringify(proof));

        localStorage.removeItem(EPHEMERAL_KEY_STORAGE);
        setPendingProvider(null);
      } catch (error) {
        console.error("Callback processing failed:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [pendingProvider],
  );

  const logout = useCallback(() => {
    setSession(null);
    setZkProof(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}-proof`);
    localStorage.removeItem(EPHEMERAL_KEY_STORAGE);
  }, []);

  const signTransaction = useCallback(
    async (tx: Transaction): Promise<string> => {
      if (!session || !zkProof) {
        throw new Error("Not authenticated");
      }

      const privateKeyBytes = fromBase64(session.ephemeralKeyPair.privateKey);
      const keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);

      const txBytes = await tx.build({ onlyTransactionKind: false });
      const { signature: userSignature } =
        await keypair.signTransaction(txBytes);

      const zkLoginSignature = await createZkLoginSignature(
        userSignature,
        zkProof,
        session.ephemeralKeyPair.maxEpoch,
        session.jwt,
        session.salt,
      );

      return zkLoginSignature;
    },
    [session, zkProof],
  );

  const signAndExecuteTransaction = useCallback(
    async (tx: Transaction, client: SuiJsonRpcClient): Promise<string> => {
      if (!session || !zkProof) {
        throw new Error("Not authenticated");
      }

      tx.setSender(session.address);

      const privateKeyBytes = fromBase64(session.ephemeralKeyPair.privateKey);
      const keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);

      const txBytes = await tx.build({ client });
      const { signature: userSignature } =
        await keypair.signTransaction(txBytes);

      const zkLoginSignature = await createZkLoginSignature(
        userSignature,
        zkProof,
        session.ephemeralKeyPair.maxEpoch,
        session.jwt,
        session.salt,
      );

      const result = await client.executeTransactionBlock({
        transactionBlock: txBytes,
        signature: zkLoginSignature,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      return result.digest;
    },
    [session, zkProof],
  );

  const value: ZkLoginContextValue = {
    session,
    isLoading,
    isAuthenticated: !!session && !!zkProof,
    zkProof,
    login,
    logout,
    handleCallback,
    signTransaction,
    signAndExecuteTransaction,
    address: session?.address || null,
    provider: session?.provider || null,
  };

  return (
    <ZkLoginContext.Provider value={value}>{children}</ZkLoginContext.Provider>
  );
}

export function useZkLogin(): ZkLoginContextValue {
  const context = useContext(ZkLoginContext);
  if (!context) {
    throw new Error("useZkLogin must be used within a ZkLoginProvider");
  }
  return context;
}
