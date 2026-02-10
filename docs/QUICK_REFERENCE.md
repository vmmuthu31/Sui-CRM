# Quick Reference: CRM Configuration & Services

## Import Statements

```typescript
// Contracts config
import { 
  CONTRACT_FUNCTIONS, 
  CRM_ROLES, 
  RESOURCE_TYPES,
  SHARED_OBJECTS,
  getCurrentPackageId 
} from '@/config/contracts';

// API endpoints
import { API_ENDPOINTS, buildApiUrl } from '@/config/api';

// Services
import { crmEncryptionService } from '@/services/encryptionService';
import { crmDecryptionService } from '@/services/decryptionService';
```

## Constants

```typescript
// Roles
CRM_ROLES.VIEWER   // 1
CRM_ROLES.MANAGER  // 2
CRM_ROLES.ADMIN    // 3

// Resource Types
RESOURCE_TYPES.NOTE  // 1
RESOURCE_TYPES.FILE  // 2
```

## Contract Functions

```typescript
// Organization
CONTRACT_FUNCTIONS.ORG.CREATE_ORG

// Profile
CONTRACT_FUNCTIONS.PROFILE.CREATE_PROFILE

// Access Control
CONTRACT_FUNCTIONS.ACCESS_CONTROL.CREATE_ORG_REGISTRY
CONTRACT_FUNCTIONS.ACCESS_CONTROL.ADD_ORG_MEMBER
CONTRACT_FUNCTIONS.ACCESS_CONTROL.UPDATE_MEMBER_ROLE
CONTRACT_FUNCTIONS.ACCESS_CONTROL.REMOVE_ORG_MEMBER
CONTRACT_FUNCTIONS.ACCESS_CONTROL.REGISTER_PROFILE
CONTRACT_FUNCTIONS.ACCESS_CONTROL.CREATE_ENCRYPTED_RESOURCE
CONTRACT_FUNCTIONS.ACCESS_CONTROL.SEAL_APPROVE

// Interaction
CONTRACT_FUNCTIONS.INTERACTION.LOG_INTERACTION
```

## API Endpoints

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

// Notes
API_ENDPOINTS.NOTES_LIST(profileId)
API_ENDPOINTS.NOTE_CREATE(profileId)
API_ENDPOINTS.NOTE_DETAILS(profileId, noteId)

// Files
API_ENDPOINTS.FILES_LIST(profileId)
API_ENDPOINTS.FILE_UPLOAD(profileId)
API_ENDPOINTS.FILE_DOWNLOAD(profileId, fileId)

// Interactions
API_ENDPOINTS.INTERACTIONS_LIST(profileId)
API_ENDPOINTS.INTERACTION_LOG

// Encryption
API_ENDPOINTS.ENCRYPT_NOTE
API_ENDPOINTS.DECRYPT_NOTE
API_ENDPOINTS.ENCRYPT_FILE
API_ENDPOINTS.DECRYPT_FILE
```

## Service Methods

### Encryption Service

```typescript
// Encrypt a note
await crmEncryptionService.encryptAndUploadResource(
  noteContent: string,
  profileId: string,
  orgId: string,
  orgRegistryId: string,
  'note',
  CRM_ROLES.ADMIN,
  userAddress: string
);

// Encrypt a file
await crmEncryptionService.encryptAndUploadResource(
  file: File,
  profileId: string,
  orgId: string,
  orgRegistryId: string,
  'file',
  CRM_ROLES.MANAGER,
  userAddress: string
);

// Get blob URL
crmEncryptionService.getBlobUrl(blobId, aggregatorIndex);
crmEncryptionService.getAllBlobUrls(blobId);
```

### Decryption Service

```typescript
// Create session key
const sessionKey = await crmDecryptionService.createSessionKey(userAddress);

// Decrypt resources
const result = await crmDecryptionService.downloadAndDecryptResources(
  resources: ResourceMetadata[],
  orgRegistryId: string,
  sessionKey: SessionKey,
  onProgress?: (progress: string) => void
);

// Cleanup blob URLs
crmDecryptionService.cleanupBlobUrls(urls);
```

## TypeScript Interfaces

### EncryptionResult
```typescript
interface EncryptionResult {
  success: boolean;
  blobId?: string;
  encryptionId?: string;
  suiRef?: string;
  error?: string;
  publisherUsed?: string;
}
```

### ResourceMetadata
```typescript
interface ResourceMetadata {
  resource_id: string;
  profile_id: string;
  org_id: string;
  resource_type: 'note' | 'file';
  blob_id: string;
  encryption_id: string;
  access_level: number;
  file_name?: string;
  created_at: string;
  created_by: string;
  walrus_url: string;
  sui_explorer_url: string;
}
```

### DecryptionResult
```typescript
interface DecryptionResult {
  success: boolean;
  decryptedFileUrls?: string[];
  error?: string;
  personalMessage?: string;
  sessionKey?: SessionKey;
}
```

## Common Patterns

### 1. Create Organization with Registry
```typescript
const tx = new Transaction();

// Create org
const org = tx.moveCall({
  target: CONTRACT_FUNCTIONS.ORG.CREATE_ORG,
  arguments: [tx.pure.string("Acme Web3")],
});

// Get org ID (you'll need to extract this from transaction result)
const result = await signAndExecute(tx);
const orgId = getCreatedObjectId(result);

// Create registry (separate transaction)
const tx2 = new Transaction();
const registry = tx2.moveCall({
  target: CONTRACT_FUNCTIONS.ACCESS_CONTROL.CREATE_ORG_REGISTRY,
  arguments: [
    tx2.pure.id(orgId),
    tx2.pure.address(adminAddress),
  ],
});
tx2.transferObjects([registry], adminAddress);
await signAndExecute(tx2);
```

### 2. Add Team Member
```typescript
const tx = new Transaction();
tx.moveCall({
  target: CONTRACT_FUNCTIONS.ACCESS_CONTROL.ADD_ORG_MEMBER,
  arguments: [
    tx.object(orgRegistryId),
    tx.pure.address(memberAddress),
    tx.pure.u8(CRM_ROLES.MANAGER),
  ],
});
await signAndExecute(tx);
```

### 3. Create Profile
```typescript
const tx = new Transaction();
const profile = tx.moveCall({
  target: CONTRACT_FUNCTIONS.PROFILE.CREATE_PROFILE,
  arguments: [tx.pure.string("@cryptowhale")],
});

const result = await signAndExecute(tx);
const profileId = getCreatedObjectId(result);

// Register profile
const tx2 = new Transaction();
tx2.moveCall({
  target: CONTRACT_FUNCTIONS.ACCESS_CONTROL.REGISTER_PROFILE,
  arguments: [
    tx2.object(SHARED_OBJECTS.PROFILE_REGISTRY),
    tx2.pure.id(profileId),
    tx2.pure.address(ownerAddress),
    tx2.pure.id(orgId),
  ],
});
await signAndExecute(tx2);
```

### 4. Create Encrypted Note (Full Flow)
```typescript
// Step 1: Encrypt
const encResult = await crmEncryptionService.encryptAndUploadResource(
  "Private strategy discussion",
  profileId,
  orgId,
  orgRegistryId,
  'note',
  CRM_ROLES.ADMIN,
  userAddress
);

// Step 2: Create resource onchain
const tx = new Transaction();
const resource = tx.moveCall({
  target: CONTRACT_FUNCTIONS.ACCESS_CONTROL.CREATE_ENCRYPTED_RESOURCE,
  arguments: [
    tx.pure.id(profileId),
    tx.pure.id(orgId),
    tx.pure.u8(RESOURCE_TYPES.NOTE),
    tx.pure.vector('u8', Array.from(Buffer.from(encResult.blobId!))),
    tx.pure.vector('u8', Array.from(Buffer.from(encResult.encryptionId!))),
    tx.pure.u8(CRM_ROLES.ADMIN),
    tx.pure.u64(Date.now()),
  ],
});
tx.transferObjects([resource], userAddress);
await signAndExecute(tx);
```

### 5. Decrypt Note (Full Flow)
```typescript
// Step 1: Create session key
const sessionKey = await crmDecryptionService.createSessionKey(userAddress);

// Step 2: Prepare metadata
const resources: ResourceMetadata[] = [{
  resource_id: resourceId,
  profile_id: profileId,
  org_id: orgId,
  resource_type: 'note',
  blob_id: blobId,
  encryption_id: encryptionId,
  access_level: 3,
  file_name: 'note.txt',
  created_at: new Date().toISOString(),
  created_by: creatorAddress,
  walrus_url: `https://aggregator.../v1/blobs/${blobId}`,
  sui_explorer_url: `https://suiscan.xyz/testnet/object/${resourceId}`,
}];

// Step 3: Decrypt
const result = await crmDecryptionService.downloadAndDecryptResources(
  resources,
  orgRegistryId,
  sessionKey
);

// Step 4: Read decrypted content
if (result.success) {
  const response = await fetch(result.decryptedFileUrls![0]);
  const noteText = await response.text();
  console.log(noteText);
}
```

### 6. Log Interaction
```typescript
const tx = new Transaction();
tx.moveCall({
  target: CONTRACT_FUNCTIONS.INTERACTION.LOG_INTERACTION,
  arguments: [
    tx.pure.id(profileId),
    tx.pure.string("Sent DM about token launch"),
    tx.pure.u64(Date.now()),
  ],
});
await signAndExecute(tx);
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
```

## Deployment Checklist

- [ ] Update `CONTRACT_PACKAGES.TESTNET` with deployed package ID
- [ ] Update `SHARED_OBJECTS.PROFILE_REGISTRY` with deployed registry ID
- [ ] Set environment variables
- [ ] Test encryption/decryption flow
- [ ] Verify access control works correctly
- [ ] Test all role levels (Viewer, Manager, Admin)
