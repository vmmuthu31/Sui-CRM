"use client";

import {
  WalletProvider as SuietWalletProvider,
  SuietWallet,
  SuiWallet,
  defineStashedWallet,
} from "@suiet/wallet-kit";
import "@suiet/wallet-kit/style.css";
import { type ReactNode } from "react";

const StashedWallet = defineStashedWallet({
  appName: "ZK-IntentBook",
});

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <SuietWalletProvider
      defaultWallets={[SuietWallet, SuiWallet, StashedWallet]}
      autoConnect={true}
    >
      {children}
    </SuietWalletProvider>
  );
}
