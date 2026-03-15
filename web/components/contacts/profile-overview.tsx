"use client";

import { Shield, Zap, ExternalLink, Mail, Twitter, Building2, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileOverviewProps {
  profileId: string;
  contact?: {
    name?: string;
    walletAddress?: string;
    email?: string;
    company?: string;
    twitter?: string;
    tag?: string;
    onchainTxDigest?: string;
    onchainObjectId?: string;
    createdAt?: string;
  } | null;
}

export function ProfileOverview({ profileId, contact }: ProfileOverviewProps) {
  const [copied, setCopied] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-lg font-semibold text-[#0f0f0f]">{contact?.name ?? "Overview"}</CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-2 space-y-5">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 space-y-4">

          {contact?.walletAddress && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Wallet Address</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm font-medium text-[#1a1a1a] break-all">{contact.walletAddress}</p>
                <button onClick={() => copy(contact.walletAddress!)} className="shrink-0 text-slate-400 hover:text-slate-700 transition-colors">
                  {copied ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {contact?.email && (
              <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-100 p-3">
                <Mail className="size-4 text-slate-400 shrink-0" />
                <p className="text-sm text-[#1a1a1a] truncate">{contact.email}</p>
              </div>
            )}
            {contact?.company && (
              <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-100 p-3">
                <Building2 className="size-4 text-slate-400 shrink-0" />
                <p className="text-sm text-[#1a1a1a] truncate">{contact.company}</p>
              </div>
            )}
            {contact?.twitter && (
              <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-100 p-3">
                <Twitter className="size-4 text-slate-400 shrink-0" />
                <p className="text-sm text-[#1a1a1a]">{contact.twitter}</p>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-100 p-4">
              <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Shield className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Encryption</p>
                <p className="text-sm font-bold text-[#1a1a1a]">Seal + Walrus</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-100 p-4">
              <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Zap className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Network</p>
                <p className="text-sm font-bold text-[#1a1a1a]">Sui Testnet</p>
              </div>
            </div>
          </div>

          {contact?.onchainTxDigest && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Creation Transaction</p>
              <a
                href={`https://suiscan.xyz/testnet/tx/${contact.onchainTxDigest}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium font-mono"
              >
                {contact.onchainTxDigest.slice(0, 16)}…{contact.onchainTxDigest.slice(-8)}
                <ExternalLink className="size-3" />
              </a>
            </div>
          )}

          {!contact && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Profile ID</p>
              <p className="font-mono text-sm font-medium text-[#1a1a1a] break-all">{profileId}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
