"use client";

import { useState } from "react";
import { ConnectButton, useWallet } from "@suiet/wallet-kit";
import { Transaction } from "@mysten/sui/transactions";
import CONTRACT_CONFIG from "@/lib/config/contracts";

export default function Home() {
  const wallet = useWallet();
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateOrg = async (e: React.FormEvent) => {
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
        target: CONTRACT_CONFIG.FUNCTIONS.ORG.CREATE_ORG, // sui_crm::org::create_org
        arguments: [
          tx.pure.string(orgName),
        ],
      });

      // Execute transaction via wallet
      const resData = await wallet.signAndExecuteTransaction({
        transaction: tx,
      });

      console.log("Transaction successfully executed", resData);
      setTxDigest(resData.digest);
      setOrgName("");
    } catch (err: any) {
      console.error("Transaction failed:", err);
      setError(err.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center p-24 bg-zinc-50 dark:bg-zinc-950">
      <div className="mb-8 self-end">
        <ConnectButton />
      </div>

      <main className="flex w-full max-w-xl flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
          Create Organization
        </h1>

        <form onSubmit={handleCreateOrg} className="w-full space-y-4">
          <div>
            <label htmlFor="orgName" className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
              Organization Name
            </label>
            <input
              id="orgName"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Acme Web3 Studio"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
              disabled={loading || !wallet.connected}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !wallet.connected || !orgName.trim()}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating..." : "Create Organization"}
          </button>
        </form>

        {error && (
          <div className="mt-6 w-full p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {txDigest && (
          <div className="mt-6 w-full p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800">
            <p className="font-semibold mb-1">Organization Created Successfully! ✅</p>
            <p className="text-sm truncate">
              Transaction: <a href={`https://suiscan.xyz/testnet/tx/${txDigest}`} target="_blank" rel="noopener noreferrer" className="underline">{txDigest}</a>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
