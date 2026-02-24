"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Search,
  ChevronRight,
  LayoutGrid,
  Share2,
  Plus,
  ArrowLeft,
  LogOut,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SessionManager, type CachedProofData } from "@/lib/zklogin/session";

/**
 * Header wallet area:
 * - Not logged in → "Connect Wallet" button → navigates to /login
 * - Logged in     → Shows short Sui address + logout icon
 */
function WalletArea() {
  const router = useRouter();
  const [proof, setProof] = useState<CachedProofData | null>(null);

  useEffect(() => {
    setProof(SessionManager.getProof());
  }, []);

  const handleLogout = () => {
    SessionManager.clearAll();
    setProof(null);
  };

  if (!proof) {
    return (
      <Button
        onClick={() => router.push("/login")}
        className="h-10 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl px-5 shadow-lg shadow-indigo-200 transition-all active:scale-95"
      >
        <ShieldCheck className="size-3.5" />
        Connect&nbsp;·&nbsp;ZK Login
      </Button>
    );
  }

  const shortAddress = `${proof.address.slice(0, 6)}…${proof.address.slice(-4)}`;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 h-10 pl-3 pr-4 bg-indigo-50 border border-indigo-100 rounded-xl">
        <Wallet className="size-3.5 text-indigo-500 shrink-0" />
        <span className="text-[10px] font-black text-indigo-600 tracking-widest font-mono">
          {shortAddress}
        </span>
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={handleLogout}
        className="size-10 rounded-xl border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all"
        title="Sign out"
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#fafbfc]">
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <header className="flex h-20 shrink-0 items-center justify-between px-8 bg-white/40 backdrop-blur-xl sticky top-0 z-20 border-b border-white/60 shadow-sm">
            <div className="flex items-center gap-6">
              <Button variant="outline" size="icon" className="size-10 text-slate-400 border-slate-100 rounded-xl hover:bg-white hover:text-slate-900 transition-all shadow-sm">
                <ArrowLeft className="size-5" />
              </Button>
              <nav className="hidden md:flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <span>CRM</span>
                <ChevronRight className="size-3.5 mx-3 opacity-30" />
                <span className="text-[#1a1a1a]">Workspace</span>
              </nav>
            </div>

            <div className="flex-1 max-w-xl mx-12">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  placeholder="Universal Search (⌘+K)"
                  className="w-full pl-11 h-11 bg-slate-100/50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all rounded-2xl text-sm font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-10 gap-2 text-[10px] font-black uppercase tracking-widest px-4 rounded-xl border-slate-100 bg-white hover:bg-slate-50 text-slate-600 shadow-sm transition-all">
                <LayoutGrid className="size-3.5" />
                Manage
              </Button>
              <Button variant="outline" size="sm" className="h-10 gap-2 text-[10px] font-black uppercase tracking-widest px-4 rounded-xl border-slate-100 bg-white hover:bg-slate-50 text-slate-600 shadow-sm transition-all">
                <Share2 className="size-3.5" />
                Share
              </Button>
              <div className="mx-2 h-6 w-[1px] bg-slate-100" />
              <Button size="sm" className="h-10 gap-2 bg-[#1a1a1a] hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl px-6 shadow-xl shadow-black/10 transition-all active:scale-95">
                <Plus className="size-4" />
                Add Entry
              </Button>
              <div className="mx-1" />
              {/* Renders after hydration to avoid localStorage SSR mismatch */}
              {mounted && <WalletArea />}
            </div>
          </header>
          <div className="flex-1 overflow-auto p-10">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
