# Sponsored Transaction Bug Handover

## Context
Read `docs/ARCHITECTURE.md`, `docs/sponsored_transactions_current.md`, and `docs/implementation_checklist.md` first for full project context if the docs are not mentioned go over here as well `/home/ashwin/.claude/projects/-mnt-d-projects-Sui-CRM/memory`.

---

## What Was Done (Previous Sessions)

### Fix 1 — onboarding/page.tsx (DONE ✅)
**File:** `web/app/onboarding/page.tsx`
**Change:** Replaced `useUnifiedSignAndExecuteTransaction` with `useUnifiedTransaction` and aliased `execute` as `signAndExecuteTransaction`.
**Why:** The old hook builds a full tx requiring gas coins in the user's wallet. zkLogin users have no SUI. `useUnifiedTransaction` routes zkLogin through `sponsorAndExecute` → Enoki.

### Fix 2 — zklogin-jwt header (POSSIBLY WRONG — see bug below)
**Files:** `web/lib/services/enoki.service.ts`, `web/app/api/sponsor/route.ts`, `web/hooks/useSponsoredTransaction.ts`
**Change:** Added `jwtToken` field passed as `zklogin-jwt` header to Enoki's create step.
**Why it was added:** suiverify (working reference) sends this header.
**WARNING:** This may be the cause of the `expired` error — see hypothesis below.

---

## Active Bug: `Enoki execute error (400): {"code":"expired","message":"Sponsored transaction has expired"}`

### Error Location
`POST /api/sponsor/:digest` → `executeSponsoredTransaction()` in `enoki.service.ts`

### What the Error Means
Enoki returns `expired` when it can't execute a sponsored transaction it previously created. This happens either:
- (A) TTL exceeded between create and execute steps (unlikely — steps run in milliseconds sequentially)
- (B) Enoki marks the sponsored tx as invalid/expired immediately on create when the `zklogin-jwt` header fails its internal validation

### Root Cause Hypothesis (Most Likely)

**The `zklogin-jwt` header is the culprit.**

Enoki has **two modes** for sponsored transactions:
- **Mode A (Enoki-managed zkLogin):** You send `zklogin-jwt` header with Google JWT. Enoki validates the JWT against its own OAuth configuration, generates the ZK proof internally. Execute step expects **only the ephemeral Ed25519 signature** (not a full zkLogin signature). Enoki assembles the full zkLogin sig internally.
- **Mode B (External zkLogin, gas-only sponsorship):** No `zklogin-jwt` header. You manage your own ZK proofs. Execute step expects the **full zkLogin signature** (flag 0x05 + BCS zkLoginSignature).

**CRM is Mode B** (uses Mysten's prover at `prover-dev.mystenlabs.com/v1`, manages its own ZK proofs).

**The bug:** My earlier fix added the `zklogin-jwt` header (Mode A create) but the execute step sends the full zkLogin signature (Mode B execute). This Mode A/B mismatch may cause Enoki to immediately invalidate the sponsored tx and return `expired` on execute.

Additionally, even if seguivery also sends the JWT, suiverify uses `@mysten/sui` **v1.39.0** while CRM uses **v2.3.1** — the JWT handling path in Enoki may behave differently depending on the client ID.

### Secondary Hypothesis

The Enoki portal has **"Allowed Addresses"** containing only two hardcoded addresses:
- `0xcca6db49f975b25b2f98d76db7f505b487bcfd9eeeadfea06b51e2fe126fb9e4`
- `0x3649d92fe471b13da76475cb05f346d5c397c858478c3925819b2b3ca4dbe5e2`

The zkLogin user's address (`0x90e52c...` from the logs) is **not in this list**. If Enoki's portal-level address allowlist restricts senders, this would block execution. However, this would normally produce an `unauthorized` error at the create step, not `expired` at execute.

---

## Recommended Fix — Try In Order

### Step 1: Remove `zklogin-jwt` header (highest confidence fix)

In `web/lib/services/enoki.service.ts`, remove the `zklogin-jwt` header block:

```typescript
// REMOVE THIS BLOCK:
if (input.jwtToken) {
  headers["zklogin-jwt"] = input.jwtToken;
}
```

Also remove `jwtToken` from `CreateSponsoredTxInput`, the API route, and the hook — keep the flow clean as Mode B (gas-only sponsorship, full zkLogin sig on execute).

### Step 2: If Step 1 doesn't fix it — clear portal "Allowed Addresses"

In the Enoki portal, **empty the "Allowed Addresses" list** so all sender addresses are permitted. The per-tx `allowedMoveCallTargets` at the code level is sufficient security.

### Step 3: If Step 2 doesn't fix it — simplify allowedMoveCallTargets

In `useSponsoredTransaction.ts`, try passing `allowedMoveCallTargets: undefined` (rely only on the portal's list, not per-tx list). This removes any potential mismatch between what the code sends and what the portal expects.

---

## Files To Know

| File | Purpose |
|------|---------|
| `web/hooks/useSponsoredTransaction.ts` | Client hook: builds tx kind bytes, calls /api/sponsor, signs bytes, calls /api/sponsor/:digest |
| `web/hooks/useUnifiedAuth.ts` | Routing: wallet → dapp-kit, zkLogin → `useSponsoredTransaction` via `useUnifiedTransaction` |
| `web/lib/services/enoki.service.ts` | Server-side Enoki API calls (never exposed client-side) |
| `web/app/api/sponsor/route.ts` | Next.js API route: POST /api/sponsor → Enoki create |
| `web/app/api/sponsor/[digest]/route.ts` | Next.js API route: POST /api/sponsor/:digest → Enoki execute |
| `web/lib/zklogin/zklogin.ts` | ZkLoginService: initializeSession, fetchZkProof, createTransactionSignature |
| `web/lib/zklogin/session.ts` | SessionManager: localStorage for ephemeral session + proof |
| `web/app/auth/callback/page.tsx` | OAuth callback: fetches ZK proof, saves to SessionManager |

---

## What Has Been Verified as Correct

- `tx.build({ onlyTransactionKind: true })` for simple Move calls does NOT need any network/RPC call (confirmed by reading v2 SDK `resolve.mjs` — `needsTransactionResolution` returns false for pure inputs with `onlyTransactionKind: true`)
- `Ed25519Keypair.fromSecretKey(bech32)` correctly recreates the ephemeral keypair
- `addressSeed` computation via `genAddressSeed(BigInt(userSalt), "sub", sub, aud)` is consistent across proof generation and signature creation
- All 11 `CRM_SPONSORED_TARGETS` are whitelisted in the Enoki portal
- `onboarding/page.tsx` now uses `useUnifiedTransaction` (sponsored path) ✅

---

## Developer Notes (from user)

- CRM is testnet-only for now; mainnet later
- Enoki free tier covers gas for testnet (no payment needed)
- The reference working implementation is `/mnt/d/projects/suiverify/suiverify-main` — compare against it when debugging
- Memory files are in `/mnt/d/projects/Sui-CRM/docs/` (not the default claude memory location)
- Keep all code changes composable and minimal — no over-engineering
