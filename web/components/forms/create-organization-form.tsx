"use client";

import { useState } from "react";
import { useWallet } from "@suiet/wallet-kit";
import { Transaction } from "@mysten/sui/transactions";
import CONTRACT_CONFIG from "@/lib/config/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateOrganizationFormProps {
  onSuccess?: () => void;
}

export function CreateOrganizationForm({
  onSuccess,
}: CreateOrganizationFormProps) {
  const wallet = useWallet();
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.connected) {
      setError("Please connect your wallet first");
      return;
    }
    if (!orgName.trim()) {
      setError("Organization name is required");
      return;
    }
    setLoading(true);
    setError(null);
    setTxDigest(null);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: CONTRACT_CONFIG.FUNCTIONS.ORG.CREATE_ORG,
        arguments: [tx.pure.string(orgName)],
      });
      const res = await wallet.signAndExecuteTransaction({ transaction: tx });
      setTxDigest(res.digest);
      setOrgName("");
      onSuccess?.();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to create organization",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">Organization name</Label>
        <Input
          id="org-name"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          placeholder="e.g. Acme Web3 Studio"
          disabled={loading || !wallet.connected}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {txDigest && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Created! Tx: {txDigest.slice(0, 16)}…
        </p>
      )}
      <Button
        type="submit"
        disabled={loading || !wallet.connected || !orgName.trim()}
      >
        {loading ? "Creating…" : "Create Organization"}
      </Button>
    </form>
  );
}
