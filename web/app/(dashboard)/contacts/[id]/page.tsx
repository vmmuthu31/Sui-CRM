"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileOverview } from "@/components/contacts/profile-overview";
import { ProfileNotes } from "@/components/contacts/profile-notes";
import { ProfileFiles } from "@/components/contacts/profile-files";
import { ProfileInteractions } from "@/components/contacts/profile-interactions";
import { ProfileOnchain } from "@/components/contacts/profile-onchain";

export default function ContactProfilePage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white/60 backdrop-blur-md p-6 sm:p-8 rounded-[32px] border border-slate-100 shadow-lg shadow-black/5">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-2xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shrink-0"
            asChild
          >
            <Link href="/contacts">
              <ArrowLeft className="size-5" />
              <span className="sr-only">Back to contacts</span>
            </Link>
          </Button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <User className="size-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#1a1a1a] truncate">
                Contact profile
              </h1>
              <p className="font-mono text-xs sm:text-sm text-slate-500 truncate mt-0.5">
                {id}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full sm:w-auto h-auto flex flex-wrap gap-1 p-1.5 rounded-2xl bg-slate-100 border border-slate-200/80">
          <TabsTrigger
            value="overview"
            className="rounded-xl px-5 py-2.5 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-[#1a1a1a] data-[state=active]:shadow-sm"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="rounded-xl px-5 py-2.5 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-[#1a1a1a] data-[state=active]:shadow-sm"
          >
            Notes
          </TabsTrigger>
          <TabsTrigger
            value="files"
            className="rounded-xl px-5 py-2.5 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-[#1a1a1a] data-[state=active]:shadow-sm"
          >
            Files
          </TabsTrigger>
          <TabsTrigger
            value="interactions"
            className="rounded-xl px-5 py-2.5 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-[#1a1a1a] data-[state=active]:shadow-sm"
          >
            Interactions
          </TabsTrigger>
          <TabsTrigger
            value="onchain"
            className="rounded-xl px-5 py-2.5 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-[#1a1a1a] data-[state=active]:shadow-sm"
          >
            Onchain
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <ProfileOverview profileId={id} />
        </TabsContent>
        <TabsContent value="notes" className="mt-6">
          <ProfileNotes profileId={id} />
        </TabsContent>
        <TabsContent value="files" className="mt-6">
          <ProfileFiles profileId={id} />
        </TabsContent>
        <TabsContent value="interactions" className="mt-6">
          <ProfileInteractions profileId={id} />
        </TabsContent>
        <TabsContent value="onchain" className="mt-6">
          <ProfileOnchain profileId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
