import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

export type NetworkType = "mainnet" | "testnet" | "devnet" | "localnet";

const NETWORK =
  (process.env.NEXT_PUBLIC_SUI_NETWORK as NetworkType) || "testnet";

const CUSTOM_RPC_URL = process.env.NEXT_PUBLIC_SUI_RPC_URL;

const networkConfigs: Record<NetworkType, string> = {
  mainnet: CUSTOM_RPC_URL || "https://fullnode.mainnet.sui.io:443",
  testnet: CUSTOM_RPC_URL || "https://fullnode.testnet.sui.io:443",
  devnet: CUSTOM_RPC_URL || "https://fullnode.devnet.sui.io:443",
  localnet: "http://127.0.0.1:9000",
};

let suiClientInstance: SuiJsonRpcClient | null = null;

export function getSuiClient(): SuiJsonRpcClient {
  if (!suiClientInstance) {
    suiClientInstance = new SuiJsonRpcClient({
      url: networkConfigs[NETWORK],
      network: NETWORK,
    });
  }
  return suiClientInstance;
}

export function getNetwork(): NetworkType {
  return NETWORK;
}

export function getRpcUrl(): string {
  return networkConfigs[NETWORK];
}

export function getExplorerUrl(
  type: "tx" | "object" | "address",
  id: string,
): string {
  const baseUrl =
    NETWORK === "mainnet"
      ? "https://suiscan.xyz/mainnet"
      : `https://suiscan.xyz/${NETWORK}`;

  const pathMap = {
    tx: "tx",
    object: "object",
    address: "account",
  };

  return `${baseUrl}/${pathMap[type]}/${id}`;
}

export const SUI_CONFIG = {
  network: NETWORK,
  rpcUrl: networkConfigs[NETWORK],
  solverUrl: process.env.NEXT_PUBLIC_SOLVER_URL || "http://localhost:3001",
  proverUrl: process.env.NEXT_PUBLIC_PROVER_URL || "http://localhost:3002",
};
