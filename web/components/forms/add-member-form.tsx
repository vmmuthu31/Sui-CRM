"use client";

import { useState } from "react";
import { useWallet } from "@suiet/wallet-kit";
import { Transaction } from "@mysten/sui/transactions";
import CONTRACT_CONFIG from "@/lib/config/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS, type OrgRole } from "@/lib/types/crm";

// Placeholder: org registry ID from context/API in real app
const ORG_REGISTRY_ID = "";

export function AddMemberForm() {
  const wallet = useWallet();
  const [address, setAddress] = useState("");
  const [role, setRole] = useState<OrgRole>(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.connected) {
      setError("Connect your wallet first");
      return;
    }
    if (!address.trim()) {
      setError("Wallet address is required");
      return;
    }
    if (!ORG_REGISTRY_ID) {
      setError("Organization not set. Create an organization first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: CONTRACT_CONFIG.FUNCTIONS.ACCESS_CONTROL.ADD_ORG_MEMBER,
        arguments: [
          tx.object(ORG_REGISTRY_ID),
          tx.pure.address(address.trim()),
          tx.pure.u8(role),
        ],
      });
      await wallet.signAndExecuteTransaction({ transaction: tx });
      setAddress("");
      setRole(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="member-address">Wallet address</Label>
        <Input
          id="member-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x…"
          disabled={loading || !wallet.connected}
        />
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <Select
          value={String(role)}
          onValueChange={(v) => setRole(Number(v) as OrgRole)}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(ROLE_LABELS) as [string, string][]).map(
              ([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading || !wallet.connected}>
        {loading ? "Adding…" : "Add Member"}
      </Button>
    </form>
  );
}
