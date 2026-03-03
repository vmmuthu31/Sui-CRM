"use client";

import { User, Shield, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProfileOverviewProps {
  profileId: string;
}

export function ProfileOverview({ profileId }: ProfileOverviewProps) {
  return (
    <Card className="border-none shadow-xl shadow-slate-900/5 bg-white rounded-[32px] overflow-hidden">
      <div className="h-1.5 w-full flex">
        <div className="h-full flex-1 bg-indigo-500 rounded-bl-full" />
        <div className="h-full flex-1 bg-purple-500" />
        <div className="h-full flex-1 bg-indigo-400 rounded-br-full" />
      </div>
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
            <User className="size-7 stroke-[1.5]" />
          </div>
          <div>
            <Badge className="bg-indigo-50 text-indigo-600 border-none px-2.5 py-0.5 font-bold text-[10px] uppercase tracking-widest mb-1.5">
              Profile
            </Badge>
            <CardTitle className="text-2xl font-black text-[#1a1a1a] tracking-tight">
              Overview
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium mt-0.5">
              Identity and activity summary. Use the tabs to manage notes,
              files, and interactions.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 space-y-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Profile ID
            </p>
            <p className="font-mono text-sm font-medium text-[#1a1a1a] break-all">
              {profileId}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-100 p-4">
              <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Shield className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Encryption
                </p>
                <p className="text-sm font-bold text-[#1a1a1a]">
                  Seal + Walrus
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-100 p-4">
              <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Zap className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Network
                </p>
                <p className="text-sm font-bold text-[#1a1a1a]">
                  Sui
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
