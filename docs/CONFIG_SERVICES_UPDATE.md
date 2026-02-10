# CRM Configuration & Services Update Summary

## Files Updated

### 1. `/web/lib/config/contracts.ts` ✅
**Changes:**
- Replaced DID/Government whitelist configuration with CRM modules
- Updated shared objects to use `PROFILE_REGISTRY` and `EXAMPLE_ORG_REGISTRY`
- Added CRM role constants (`VIEWER`, `MANAGER`, `ADMIN`)
- Added resource type constants (`NOTE`, `FILE`)
- Updated contract functions to include:
  - `ORG.CREATE_ORG`
  - `PROFILE.CREATE_PROFILE`
  - `INTERACTION.LOG_INTERACTION`
  - `ACCESS_CONTROL.*` (all CRM access control functions)
- Updated event types for CRM events
- Removed DID-specific constants
- Updated gas configuration for CRM operations

**Usage:**
```typescript
import { CONTRACT_FUNCTIONS, CRM_ROLES, RESOURCE_TYPES } from '@/config/contracts';

// Create organization
tx.moveCall({
  target: CONTRACT_FUNCTIONS.ORG.CREATE_ORG,
  arguments: [tx.pure.string("Acme Web3")]
});

// Add team member
tx.moveCall({
  target: CONTRACT_FUNCTIONS.ACCESS_CONTROL.ADD_ORG_MEMBER,
  arguments: [
    tx.object(orgRegistryId),
    tx.pure.address(memberAddress),
    tx.pure.u8(CRM_ROLES.MANAGER)
  ]
});
```

---

### 2. `/web/lib/config/api.ts` ✅
**Changes:**
- Replaced Aadhaar/PAN/DID endpoints with CRM endpoints
- Added organization management endpoints
- Added profile/contact management endpoints
- Added encrypted notes endpoints
- Added encrypted files endpoints
- Added interaction tracking endpoints
- Added analytics endpoints

**New Endpoints:**
```typescript
// Organizations
API_ENDPOINTS.ORGS_LIST
API_ENDPOINTS.ORG_CREATE
API_ENDPOINTS.ORG_DETAILS(orgId)
API_ENDPOINTS.ORG_MEMBERS(orgId)
API_ENDPOINTS.ORG_ADD_MEMBER(orgId)

// Profiles
API_ENDPOINTS.PROFILES_LIST
API_ENDPOINTS.PROFILE_CREATE
API_ENDPOINTS.PROFILE_DETAILS(profileId)
API_ENDPOINTS.PROFILE_ONCHAIN_ACTIVITY(profileId)

// Notes (encrypted)
API_ENDPOINTS.NOTES_LIST(profileId)
API_ENDPOINTS.NOTE_CREATE(profileId)

// Files (encrypted)
API_ENDPOINTS.FILES_LIST(profileId)
API_ENDPOINTS.FILE_UPLOAD(profileId)

// Interactions
API_ENDPOINTS.INTERACTIONS_LIST(profileId)
API_ENDPOINTS.INTERACTION_LOG

// Encryption
API_ENDPOINTS.ENCRYPT_NOTE
API_ENDPOINTS.DECRYPT_NOTE
API_ENDPOINTS.ENCRYPT_FILE
API_ENDPOINTS.DECRYPT_FILE
```

---

### 3. `/web/lib/services/encryptionService.ts` ✅
**Changes:**
- Renamed from government document encryption to CRM resource encryption
- Updated to use `PROFILE_REGISTRY_ID` instead of `GOVERNMENT_WHITELIST_ID`
- Changed interface from `EncryptionMetadataPayload` to include:
  - `profile_id`
  - `org_id`
  - `resource_type` ('note' | 'file')
  - `access_level` (CRM role)
  - `created_by`
- Renamed main method: `encryptAndUploadDocument` → `encryptAndUploadResource`
- Added support for both File objects and string data (for notes)
- Updated to use org registry ID for encryption policy
- Exported as `crmEncryptionService`

**New Usage:**
```typescript
import { crmEncryptionService } from '@/services/encryptionService';
import { CRM_ROLES } from '@/config/contracts';

// Encrypt a note
const result = await crmEncryptionService.encryptAndUploadResource(
  "This is a private strategy note", // string data
  profileId,
  orgId,
  orgRegistryId,
  'note',
  CRM_ROLES.ADMIN, // Only admins can decrypt
  userAddress
);

// Encrypt a file
const result = await crmEncryptionService.encryptAndUploadResource(
  fileObject, // File object
  profileId,
  orgId,
  orgRegistryId,
  'file',
  CRM_ROLES.MANAGER, // Managers and above can decrypt
  userAddress
);
```

---

### 4. `/web/lib/services/decryptionService.ts` ✅
**Changes:**
- Updated from government document decryption to CRM resource decryption
- Changed interface: `DocumentMetadata` → `ResourceMetadata`
- Updated `createMoveCallConstructor` to call `crm_access_control::seal_approve`
- Now requires `resourceId`, `orgRegistryId`, and `profileRegistryId`
- Renamed method: `downloadAndDecryptDocuments` → `downloadAndDecryptResources`
- Updated to work with CRM access control policies
- Exported as `crmDecryptionService`

**New Usage:**
```typescript
import { crmDecryptionService } from '@/services/decryptionService';

// Create session key
const sessionKey = await crmDecryptionService.createSessionKey(userAddress);

// Decrypt resources
const result = await crmDecryptionService.downloadAndDecryptResources(
  resources, // ResourceMetadata[]
  orgRegistryId,
  sessionKey,
  (progress) => console.log(progress)
);

if (result.success) {
  // result.decryptedFileUrls contains blob URLs
  result.decryptedFileUrls.forEach(url => {
    // Display or download
  });
}
```

---

## Integration Flow

### Complete Example: Creating an Encrypted Note

```typescript
import { Transaction } from '@mysten/sui/transactions';
import { crmEncryptionService } from '@/services/encryptionService';
import { CONTRACT_FUNCTIONS, CRM_ROLES } from '@/config/contracts';

async function createEncryptedNote(
  profileId: string,
  orgId: string,
  orgRegistryId: string,
  noteContent: string,
  accessLevel: number
) {
  // Step 1: Encrypt and upload to Walrus
  const encryptionResult = await crmEncryptionService.encryptAndUploadResource(
    noteContent,
    profileId,
    orgId,
    orgRegistryId,
    'note',
    accessLevel,
    currentUserAddress
  );

  if (!encryptionResult.success) {
    throw new Error(encryptionResult.error);
  }

  // Step 2: Create EncryptedResource onchain
  const tx = new Transaction();
  
  const resource = tx.moveCall({
    target: CONTRACT_FUNCTIONS.ACCESS_CONTROL.CREATE_ENCRYPTED_RESOURCE,
    arguments: [
      tx.pure.id(profileId),
      tx.pure.id(orgId),
      tx.pure.u8(1), // RESOURCE_TYPES.NOTE
      tx.pure.vector('u8', Array.from(Buffer.from(encryptionResult.blobId!))),
      tx.pure.vector('u8', Array.from(Buffer.from(encryptionResult.encryptionId!))),
      tx.pure.u8(accessLevel),
      tx.pure.u64(Date.now()),
    ],
  });

  // Share or transfer the resource
  tx.transferObjects([resource], currentUserAddress);

  // Execute transaction
  const result = await signAndExecuteTransaction({ transaction: tx });
  
  return {
    resourceId: getCreatedObjectId(result),
    blobId: encryptionResult.blobId,
    encryptionId: encryptionResult.encryptionId,
  };
}
```

### Complete Example: Decrypting a Note

```typescript
import { crmDecryptionService } from '@/services/decryptionService';

async function viewEncryptedNote(
  resourceId: string,
  profileId: string,
  orgId: string,
  orgRegistryId: string,
  blobId: string,
  encryptionId: string
) {
  // Step 1: Create session key
  const sessionKey = await crmDecryptionService.createSessionKey(currentUserAddress);

  // Step 2: Prepare resource metadata
  const resources: ResourceMetadata[] = [{
    resource_id: resourceId,
    profile_id: profileId,
    org_id: orgId,
    resource_type: 'note',
    blob_id: blobId,
    encryption_id: encryptionId,
    access_level: 3, // From onchain data
    file_name: 'note.txt',
    created_at: new Date().toISOString(),
    created_by: '0x...',
    walrus_url: `https://aggregator.../v1/blobs/${blobId}`,
    sui_explorer_url: `https://suiscan.xyz/testnet/object/${resourceId}`,
  }];

  // Step 3: Decrypt
  const result = await crmDecryptionService.downloadAndDecryptResources(
    resources,
    orgRegistryId,
    sessionKey,
    (progress) => console.log(progress)
  );

  if (result.success && result.decryptedFileUrls) {
    // Fetch the decrypted blob
    const response = await fetch(result.decryptedFileUrls[0]);
    const noteText = await response.text();
    
    return noteText;
  } else {
    throw new Error(result.error || 'Decryption failed');
  }
}
```

---

## Next Steps

### 1. Deploy Smart Contracts
```bash
cd contracts/sui_crm
sui move build
sui client publish --gas-budget 100000000
```

After deployment, update `/web/lib/config/contracts.ts`:
```typescript
export const CONTRACT_PACKAGES = {
  TESTNET: '0xYOUR_DEPLOYED_PACKAGE_ID',
};

export const SHARED_OBJECTS = {
  PROFILE_REGISTRY: '0xYOUR_PROFILE_REGISTRY_ID',
};
```

### 2. Implement Backend API Routes
Create the following API routes in your Next.js app:
- `/api/organizations/*`
- `/api/profiles/*`
- `/api/encryption/note`
- `/api/encryption/file`
- `/api/interactions/*`

### 3. Build Frontend Components
- Organization creation form
- Profile management UI
- Note editor with encryption
- File upload with encryption
- Decryption UI with session key management

### 4. Set Up Indexer
- Listen to CRM events
- Index to PostgreSQL
- Provide fast queries for frontend

---

## Key Differences from Previous Implementation

| Aspect | Before (DID/Government) | After (CRM) |
|--------|------------------------|-------------|
| **Access Control** | Government whitelist | Organization + Role-based |
| **Encryption Policy** | Government whitelist ID | Org registry ID |
| **Resource Types** | Documents only | Notes + Files |
| **Metadata** | DID type, document type | Profile ID, org ID, access level |
| **Seal Approve** | `government_whitelist::seal_approve` | `crm_access_control::seal_approve` |
| **Decryption Auth** | Government address | Org member with sufficient role |

---

## Testing Checklist

- [ ] Deploy contracts to testnet
- [ ] Update package ID in config
- [ ] Test organization creation
- [ ] Test adding team members with different roles
- [ ] Test profile creation and registration
- [ ] Test note encryption (Admin-only)
- [ ] Test note decryption (Admin can decrypt)
- [ ] Test note decryption (Manager cannot decrypt Admin-only note)
- [ ] Test file encryption and decryption
- [ ] Test profile owner can always decrypt their own data
- [ ] Test interaction logging
- [ ] Verify events are emitted correctly
