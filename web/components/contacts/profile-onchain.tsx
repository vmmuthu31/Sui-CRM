"use client";

import { Activity, Database } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProfileOnchainProps {
  profileId: string;
}

export function ProfileOnchain({ profileId }: ProfileOnchainProps) {
  return (
    <Card className="border-none shadow-xl shadow-amber-900/5 bg-white rounded-[32px] overflow-hidden">
      <div className="h-1.5 w-full flex">
        <div className="h-full flex-1 bg-amber-400 rounded-bl-full" />
        <div className="h-full flex-1 bg-orange-500" />
        <div className="h-full flex-1 bg-amber-500 rounded-br-full" />
      </div>
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm">
            <Activity className="size-7 stroke-[1.5]" />
          </div>
          <div>
            <Badge className="bg-amber-50 text-amber-600 border-none px-2.5 py-0.5 font-bold text-[10px] uppercase tracking-widest mb-1.5">
              Indexer
            </Badge>
            <CardTitle className="text-2xl font-black text-[#1a1a1a] tracking-tight">
              Onchain activity
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium mt-0.5">
              Token holdings, NFTs, DeFi positions from indexer API.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-2">
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/30 py-16 text-center">
          <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 mb-4">
            <Database className="size-7" />
          </div>
          <h3 className="font-bold text-[#1a1a1a]">Connect indexer</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-[280px]">
            Wire <code className="text-xs bg-slate-200/80 px-1.5 py-0.5 rounded">GET /api/profiles/:id/onchain</code> to display enriched on-chain data here.
          </p>
          <p className="font-mono text-xs text-slate-400 mt-4 break-all px-2">
            {profileId}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
