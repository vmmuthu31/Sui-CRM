"use client";

import { useSuiNSName } from "@/hooks/useSuiNS";
import { shortenAddress } from "@/lib/config/suins";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface SuiAddressProps {
  /** The raw Sui address (0x…) */
  address: string;
  /** If true, shows a copy button */
  showCopy?: boolean;
  /** If true, shows a link to Sui explorer */
  showExplorer?: boolean;
  /** Number of chars to show at start/end when truncating the address */
  truncateChars?: number;
  /** Extra class names for the wrapper */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * SuiAddress
 *
 * Displays a Sui address. Automatically resolves the reverse SuiNS lookup —
 * if the address has a `.sui` name registered, that name is shown prominently
 * with the shortened address shown below it.
 *
 * @example
 *   <SuiAddress address="0xabc..." showCopy showExplorer />
 *   // Renders: "alice.sui" (resolved) + "0xabc…1234" (truncated)
 */
export function SuiAddress({
  address,
  showCopy = false,
  showExplorer = false,
  truncateChars = 4,
  className = "",
  size = "md",
}: SuiAddressProps) {
  const { suiName, loading } = useSuiNSName(address);
  const network = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";
  const explorerUrl = `https://suiscan.xyz/${network}/account/${address}`;
  const short = shortenAddress(address, truncateChars);

  const handleCopy = () => {
    navigator.clipboard.writeText(suiName ?? address);
    toast.success("Address copied");
  };

  const textSizes = {
    sm: { name: "text-xs", addr: "text-[10px]" },
    md: { name: "text-sm", addr: "text-xs" },
    lg: { name: "text-base", addr: "text-sm" },
  };

  const { name: nameSize, addr: addrSize } = textSizes[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="flex flex-col leading-tight">
        {loading ? (
          <span className={`${nameSize} font-mono text-slate-400 animate-pulse`}>
            {short}
          </span>
        ) : suiName ? (
          <>
            <span className={`${nameSize} font-bold text-indigo-600`}>
              {suiName}
            </span>
            <span className={`${addrSize} font-mono text-slate-400`}>{short}</span>
          </>
        ) : (
          <span className={`${nameSize} font-mono text-slate-600`}>{short}</span>
        )}
      </span>

      {showCopy && (
        <button
          onClick={handleCopy}
          className="text-slate-300 hover:text-slate-600 transition-colors shrink-0"
          title="Copy address"
        >
          <Copy className="size-3.5" />
        </button>
      )}

      {showExplorer && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-300 hover:text-indigo-500 transition-colors shrink-0"
          title="View on Sui Explorer"
        >
          <ExternalLink className="size-3.5" />
        </a>
      )}
    </span>
  );
}

// ── Inline badge variant ──────────────────────────────────────────────────────
/**
 * SuiAddressBadge
 * Compact pill-style badge — great for tables, lists, header.
 */
export function SuiAddressBadge({
  address,
  className = "",
}: {
  address: string;
  className?: string;
}) {
  const { suiName } = useSuiNSName(address);
  const short = shortenAddress(address, 4);

  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1 ${className}`}
    >
      {/* SuiNS dot indicator */}
      {suiName && (
        <span className="size-1.5 rounded-full bg-indigo-400 shrink-0" />
      )}
      <span className="text-[11px] font-bold text-indigo-700 font-mono">
        {suiName ?? short}
      </span>
    </span>
  );
}
