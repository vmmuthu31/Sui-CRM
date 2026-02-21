"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@suiet/wallet-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Contract create_profile(org_id, wallet_address, unique_tag, blob_id, encryption_id)
// requires Seal encrypt + Walrus upload for blob_id/encryption_id. Wire when ready.

export function AddContactForm() {
  const router = useRouter();
  const wallet = useWallet();
  const [walletAddress, setWalletAddress] = useState("");
  const [twitter, setTwitter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.connected) {
      setError("Connect your wallet first");
      return;
    }
    if (!walletAddress.trim()) {
      setError("Wallet address is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // TODO: Encrypt minimal profile data (e.g. { twitter }) via Seal, upload to Walrus,
      // then call profile::create_profile(org_id, wallet_address, unique_tag, blob_id, encryption_id),
      // then crm_access_control::register_profile(profile_registry, org_registry, profile_id).
      console.log("Add contact placeholder", { walletAddress, twitter });
      router.push("/contacts");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create contact");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="contact-wallet">Wallet address</Label>
        <Input
          id="contact-wallet"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="0x…"
          disabled={loading || !wallet.connected}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-twitter">Twitter (optional)</Label>
        <Input
          id="contact-twitter"
          value={twitter}
          onChange={(e) => setTwitter(e.target.value)}
          placeholder="@cryptowhale"
          disabled={loading}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading || !wallet.connected}>
        {loading ? "Creating…" : "Create Contact"}
      </Button>
    </form>
  );
}
