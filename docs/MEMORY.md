# Sui CRM - Central Documentation Index

**Last Updated:** 2026-03-15
**Status:** Phase 2 member access implemented; Seal member decryption 403 UNRESOLVED

## Quick Start

### For New Sessions
1. Read **[ARCHITECTURE.md](ARCHITECTURE.md)** — System design, data flows, dual auth
2. Skim **[TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)** — One-liner codebase map
3. For implementation → **[IMPLEMENTATION_AND_USERFLOW.md](IMPLEMENTATION_AND_USERFLOW.md)**
4. For bugs → **[BUG.md](BUG.md)**
5. For handover → **[HANDOVER.md](HANDOVER.md)** — Phase 2 changes, active bugs, debugging steps

### Quick Answers
- **"How do sponsored transactions work?"** → See [How Enoki Sponsorship Works](#how-enoki-sponsorship-works)
- **"What changed in Phase 2?"** → See [Latest Changes (2026-03-15)](#latest-changes-2026-03-15)
- **"Why can't members decrypt?"** → See [BUG.md — BUG-002](BUG.md) and [HANDOVER.md — Active Bug](HANDOVER.md)
- **"How do I add a new onchain action?"** → Read TECHNICAL_ARCHITECTURE.md - Critical Paths
- **"Is there a bug?"** → Check [BUG.md](BUG.md)

---

## Documentation Map

| File | Purpose | When to Read |
|------|---------|--------------|
| **ARCHITECTURE.md** | Complete system design, tech stack, encryption, contracts | Understanding system design |
| **TECHNICAL_ARCHITECTURE.md** | One-liner codebase reference, file map, critical paths | Finding specific files, planning features |
| **IMPLEMENTATION_AND_USERFLOW.md** | User journeys + roadmap (Phases 1-6) | Understanding user flows, verifying features |
| **BUG.md** | Known issues, severity, fixes | Debugging, UX planning |
| **HANDOVER.md** | Phase 2 changes, active bug details, debugging steps | Picking up where last session left off |

---

## Latest Changes (2026-03-15)

### Phase 2: Member Access & Org Management

**What was implemented:**
1. Members see admin's contacts (query by `orgAdminAddress`)
2. `orgRegistryId` propagated to members during invite acceptance + useUser fallback
3. Admin can register members on-chain via org page ("Register On-Chain" button)
4. Admin can remove members (on-chain `remove_org_member` + DB cleanup)
5. Role selection in invite flow (Viewer / Manager / Admin)
6. Old invites without `memberAddress` are backfilled from user records
7. Decryption service: validation for empty `resource_id`, retry logic, debug logging

**What's broken:**
- Member Seal decryption 403 — see BUG.md BUG-002
- Member cannot decrypt notes/files even after on-chain registration

**Files changed:**
- `web/app/(dashboard)/contacts/page.tsx`
- `web/app/(dashboard)/organization/page.tsx`
- `web/app/api/contacts/route.ts`
- `web/app/api/invites/[token]/route.ts`
- `web/app/api/invites/route.ts`
- `web/app/api/users/route.ts`
- `web/app/auth/callback/page.tsx`
- `web/hooks/useUser.ts`
- `web/lib/mongodb.ts`
- `web/lib/services/decryptionService.ts`

### Previous: Enoki zkLogin Fix (2026-03-15 earlier)

**Problem:** "Enoki execute error (400): expired" on sponsored transaction execution.
**Root Cause:** Mismatch between nonce/proof endpoints (Enoki) and address derivation (local salt).
**Solution:** Full Enoki-native zkLogin flow with Enoki's addressSeed.
**Result:** Sponsored transactions work end-to-end.

---

## How Enoki Sponsorship Works

### Setup (One-Time)
1. Create Enoki account at https://portal.enoki.mystenlabs.com
2. Deposit SUI into gas pool
3. Get `ENOKI_SECRET_KEY` from portal
4. Add to `.env.local`
5. Whitelist 11 CRM Move targets in portal
6. Leave "Allowed Addresses" empty

### Flow
```
User builds tx → Backend calls Enoki create → Enoki returns sponsored bytes
→ Frontend signs with ephemeral key → Backend calls Enoki execute
→ Enoki broadcasts on-chain → Gas from org pool
```

---

## Key Addresses (Testnet)

| Item | Address |
|------|---------|
| Package ID | `0xd86712244386bdfd82906dae8bed7be6760df054536abde426fd2dc16f9b41a4` |
| Profile Registry | `0x395e1731de16b7393f80afba04252f18c56e1cf994e9d77c755a759f8bc5c4b0` |
| Example Org Registry | `0xea7c522c85660fc793d51e64464caf29956594d47997d4217e0a22000cdcd4e6` |
| Sui Clock | `0x0000000000000000000000000000000000000000000000000000000000000006` |

---

## System Overview

- **Project:** Sui-CRM — privacy-first Web3 CRM (E2E encryption via Seal, decentralized storage via Walrus, password-less auth via zkLogin)
- **Tech Stack:** Next.js 14+, React 19, TypeScript, @mysten/sui, Seal, Walrus
- **Network:** Testnet (mainnet pending)

---

## References
- Enoki: https://docs.enoki.mystenlabs.com
- Sui: https://docs.sui.io
- Seal: https://github.com/mystenlabs/seal-sdk
