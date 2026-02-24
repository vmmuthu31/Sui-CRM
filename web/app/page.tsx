"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Always go to dashboard — the dashboard handles showing Sign In or the actual content
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafbfc]">
      <span className="size-8 rounded-full border-4 border-slate-200 border-t-indigo-500 animate-spin block" />
    </div>
  );
}
