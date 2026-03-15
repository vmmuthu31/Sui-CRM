"use client";

import { Activity, Database } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProfileOnchainProps {
  profileId: string;
  contact?: { onchainObjectId?: string; onchainTxDigest?: string; walletAddress?: string } | null;
}

export function ProfileOnchain({ profileId, contact }: ProfileOnchainProps) {
  return (
    <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-lg font-semibold text-[#0f0f0f]">
          Onchain activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-2">
        <div className="space-y-4">
          {contact?.onchainObjectId && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Profile Object (Sui)</p>
              <a href={`https://suiscan.xyz/testnet/object/${contact.onchainObjectId}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium font-mono">
                {contact.onchainObjectId}
                <Activity className="size-3" />
              </a>
            </div>
          )}
          {contact?.onchainTxDigest && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Creation Transaction</p>
              <a href={`https://suiscan.xyz/testnet/tx/${contact.onchainTxDigest}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium font-mono">
                {contact.onchainTxDigest}
                <Activity className="size-3" />
              </a>
            </div>
          )}
          {contact?.walletAddress && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Contact Wallet</p>
              <a href={`https://suiscan.xyz/testnet/account/${contact.walletAddress}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium font-mono">
                {contact.walletAddress}
                <Activity className="size-3" />
              </a>
            </div>
          )}
          {!contact?.onchainObjectId && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/30 py-16 text-center">
              <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 mb-4">
                <Database className="size-7" />
              </div>
              <h3 className="font-bold text-[#1a1a1a]">No on-chain data yet</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-[280px]">
                On-chain profile object ID not captured. Create this contact again to get explorer links.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
