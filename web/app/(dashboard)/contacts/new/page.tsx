"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddContactForm } from "@/components/forms/add-contact-form";

export default function NewContactPage() {
  return (
    <div className="max-w-xl mx-auto space-y-6 pb-16">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="size-9 rounded-xl border border-slate-200 hover:bg-slate-50">
          <Link href="/contacts">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0f0f0f]">Add Contact</h1>
          <p className="text-sm text-slate-500">Create a new on-chain contact profile.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
        <AddContactForm />
      </div>
    </div>
  );
}
