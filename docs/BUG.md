---
name: Known Bugs and Issues
description: Tracked bugs, their severity, status, and fixes
type: project
---

# Known Bugs & Issues

**Last Updated:** 2026-03-15

---

## BUG-001: Onboarding UX — Misleading Wallet Funding Prompt

**Status:** OPEN (Low Priority)
**Severity:** Low
**Since:** 2026-03-14

### Issue
After implementing sponsored transactions, zkLogin users no longer need SUI for gas. However, the onboarding page (`web/app/onboarding/page.tsx`) still displays:
- "Step 1: Fund your wallet"
- Faucet link to get testnet SUI
- Balance check

### Fix
Hide Step 1 for zkLogin users using `authMode` from `useUnifiedAccount()`.

---

## BUG-002: Member Seal Decryption 403 Forbidden

**Status:** OPEN (Critical)
**Severity:** Critical
**Since:** 2026-03-15

### Issue
Members who accept invites and are registered on-chain via `add_org_member` still get Seal 403 when attempting to decrypt notes or files. Admin can decrypt the same resources successfully.

### Error
```
POST https://seal-key-server-testnet-2.mystenlabs.com/v1/fetch_key 403 (Forbidden)
InvalidParameterError: PTB contains an invalid parameter, possibly a newly created object that the FN has not yet seen
```

### Confirmed Working
- Admin decryption works
- Both admin and member use identical `orgRegistryId`, `resourceId`, `profileRegistryId`
- Member can see contacts list (via orgAdminAddress)

### Root Cause Candidates
1. **Member not in on-chain OrgAccessRegistry** — Old invites (before 2026-03-15 code change) didn't save `memberAddress`, so on-chain registration may not have happened even though UI showed green checkmarks. The backfill logic was added but existing data may need manual re-registration.
2. **Address mismatch** — Member's zkLogin address may differ between sessions if address derivation is inconsistent (different salt, different addressSeed).
3. **FN propagation delay** — Recently modified `OrgAccessRegistry` object may not be visible to Seal key servers' full node. Retry logic (3 attempts, 3s/6s/9s backoff) was added.
4. **CORS on NodeInfra Seal server** — `open-seal-testnet.nodeinfra.com` returns duplicate `Access-Control-Allow-Origin: *, *` headers. Browsers reject this. Reduces available key servers from 4 to 3, potentially breaking 2-of-4 threshold.

### Debugging Steps
1. Verify member is in on-chain registry: `sui client object <orgRegistryId> --json`
2. Compare member's `suiAddress` in MongoDB vs on-chain registry
3. Try removing + re-adding member via org page
4. Wait 15-30s after on-chain registration before decrypting

### Files
- `web/lib/services/decryptionService.ts` — Decryption pipeline
- `web/components/contacts/profile-notes.tsx` — Note decryption UI
- `web/components/contacts/profile-files.tsx` — File download/decryption UI
- `web/app/(dashboard)/organization/page.tsx` — On-chain registration UI

---

## BUG-003: Member Contacts Page Infinite Spinner (RESOLVED)

**Status:** RESOLVED
**Severity:** Medium
**Resolved:** 2026-03-15

### Issue
Member's contacts page showed infinite loading spinner. Contacts never appeared.

### Root Cause
Two issues:
1. Contacts were queried by `user.suiAddress` (member's own address) instead of `user.orgAdminAddress` (admin's address). Since contacts are stored with admin's address, query returned empty.
2. `loading` state was initialized as `true` and never set to `false` when `useUser` hook hadn't finished loading (effect returned early when `queryAddress` was undefined).

### Fix
- Query by `orgAdminAddress` for members
- Split loading into `userLoading` (from useUser) + `loadingContacts` (for API call)

---

## BUG-004: Old Invites Missing memberAddress (RESOLVED)

**Status:** RESOLVED
**Severity:** Medium
**Resolved:** 2026-03-15

### Issue
Invites created before 2026-03-15 code changes didn't have `memberAddress` saved. This caused the org page to show members as "registered" (green checkmark) when they were actually never registered on-chain.

### Root Cause
The `needsRegistration` check was `invite.memberAddress && !invite.onchainRegistered`. When `memberAddress` was undefined (old invites), this returned `false`, incorrectly showing the member as registered.

### Fix
Invites GET endpoint now backfills `memberAddress` by looking up the user record via `email + orgAdminAddress`. Once backfilled, the "Register On-Chain" button correctly appears for unregistered members.
