# Isometric Registry Adapter

The Isometric adapter provides a registry-agnostic pattern for syncing local DMRV data to Isometric's carbon credit verification system. The design allows for future adapters (Puro.earth, Verra, etc.) to be added without changing the core data model.

## Architecture

```
Component → hooks/ → fn/ → adapters/isometric/ → lib/isometric/client.ts
                              ↓
                          registry_identities (sidecar table)
```

The adapter sits between business logic (`fn/`) and the low-level API client (`lib/isometric/`). Sync state is tracked in a polymorphic `registry_identities` table, keeping core entity tables clean.

## Registry Identities Table

Instead of embedding registry-specific fields in each entity table, sync state is tracked in a single polymorphic table:

```typescript
// src/db/schema/registry.ts
export const registryIdentities = pgTable('registry_identities', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Local entity reference (polymorphic)
  entityType: text('entity_type').notNull(),    // 'facility', 'production_run', etc.
  entityId: uuid('entity_id').notNull(),

  // Registry details
  registryName: text('registry_name').notNull(), // 'isometric', 'puro', 'verra'
  externalEntityType: text('external_entity_type').notNull(), // 'facility', 'storage_location', etc.
  externalId: text('external_id'),               // ID from external registry

  // Sync tracking
  syncStatus: syncStatus('sync_status').default('pending').notNull(),
  lastSyncedAt: timestamp('last_synced_at'),
  lastSyncError: text('last_sync_error'),
  metadata: jsonb('metadata'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Why a Sidecar Table?

1. **Registry-agnostic core**: Entity tables remain clean without `isometricXxxId`, `puroXxxId`, etc.
2. **Multi-step sync support**: Some entities create multiple external objects (e.g., application → storage_location + biochar_application)
3. **Partial sync recovery**: If step 1 succeeds but step 2 fails, retry only retries step 2
4. **Multi-registry support**: Same table works for Isometric, Puro, Verra, etc.

## Data Model Mapping

| Local Entity | Registry | External Entity Types | Rows Created |
|--------------|----------|----------------------|--------------|
| `facility` | Isometric | `facility` | 1 |
| `feedstock_type` | Isometric | `feedstock_type` | 1 |
| `production_run` | Isometric | `production_batch` | 1 |
| `application` | Isometric | `storage_location`, `biochar_application` | 2 |
| `credit_batch` | Isometric | `removal`, `ghg_statement` | 2 |

## Sync Status Flow

```
pending → syncing → synced
              ↓
            error → syncing (retry)
```

| Status | Meaning |
|--------|---------|
| `pending` | Not yet synced, ready for sync |
| `syncing` | Sync in progress |
| `synced` | Successfully synced, `externalId` populated |
| `error` | Sync failed, `lastSyncError` contains message |

## Sync Triggers

| Entity | Trigger Condition | Notes |
|--------|-------------------|-------|
| `facilities` | On create/update | Immediate sync |
| `feedstockTypes` | On create | Immediate sync |
| `productionRuns` | `status = 'complete'` | After all data entered |
| `applications` | `status = 'applied'` | After field application |
| `creditBatches` | `status = 'pending'` | Ready for verification |

## Usage

### Single Entity Sync

```typescript
import { isometricAdapter } from '@/lib/adapters/isometric';

// Sync a facility
const result = await isometricAdapter.syncFacility(facilityId);
if (result.success) {
  console.log('Synced to Isometric:', result.registryId);
} else {
  console.error('Failed:', result.error);
}

// Sync other entities
await isometricAdapter.syncFeedstockType(feedstockTypeId);
await isometricAdapter.syncProductionBatch(productionRunId);
await isometricAdapter.syncApplication(applicationId);
await isometricAdapter.syncGHGStatement(creditBatchId);
```

### Batch Sync (All Pending)

```typescript
import { syncAllPending, retryAllFailed } from '@/lib/adapters/isometric';

// Sync all pending entities (respects dependency order)
const stats = await syncAllPending();
console.log('Facilities:', stats.facilities.succeeded, 'succeeded');
console.log('Applications:', stats.applications.failed, 'failed');

// Retry all failed syncs
const retryStats = await retryAllFailed();
```

### Checking Sync Status

```typescript
import {
  getExternalId,
  isEntityFullySynced,
  getEntitySyncSummary
} from '@/lib/adapters';

// Check if entity has an external ID
const isometricFacilityId = await getExternalId(
  'facility',
  facilityId,
  'isometric',
  'facility'
);

// Check if fully synced (all steps complete)
const isSynced = await isEntityFullySynced(
  'application',
  applicationId,
  'isometric'
);

// Get detailed sync status per step
const summary = await getEntitySyncSummary(
  'application',
  applicationId,
  'isometric'
);
// Returns:
// {
//   storage_location: { status: 'synced', externalId: 'stl_123' },
//   biochar_application: { status: 'error', error: 'Validation failed' }
// }
```

### Confirmation Pulls

```typescript
import { confirmGHGStatements, isometricAdapter } from '@/lib/adapters/isometric';

// Pull status for all synced GHG statements
const stats = await confirmGHGStatements();

// Or check a specific statement
const result = await isometricAdapter.confirmGHGStatement(ghgStatementId);
if (result.success) {
  console.log('Status:', result.data.status);
  console.log('Credits issued:', result.data.creditsIssuedAt);
}
```

### Sync Status Dashboard

```typescript
import { getRegistrySyncStats } from '@/lib/adapters';

const stats = await getRegistrySyncStats('isometric');
// Returns:
// {
//   facility: { pending: 2, syncing: 0, synced: 10, error: 1 },
//   feedstock_type: { ... },
//   production_run: { ... },
//   ...
// }
```

## Integration with Server Functions

Add auto-sync calls when entity status changes:

```typescript
// src/fn/applications.ts
import { isometricAdapter } from '@/lib/adapters/isometric';

export async function updateApplicationStatusFn(
  applicationId: string,
  status: ApplicationStatus
) {
  // Update local status
  await db.update(applications)
    .set({ status })
    .where(eq(applications.id, applicationId));

  // Auto-sync when application is marked as 'applied'
  if (status === 'applied') {
    await isometricAdapter.syncApplication(applicationId);
  }
}
```

## Dependency Chain

The adapter handles dependencies automatically:

1. **syncProductionBatch** - First syncs the parent facility if needed
2. **syncApplication** - Creates StorageLocation first, then BiocharApplication
3. **syncGHGStatement** - Creates Removal first, then GHG Statement

### Partial Sync Recovery

If a multi-step sync fails partway:

```
Application sync attempt 1:
  ├─ storage_location → synced, externalId = "stl_abc123"
  └─ biochar_application → error, externalId = null

Application sync attempt 2 (retry):
  ├─ storage_location → already synced, skip
  └─ biochar_application → synced, externalId = "bap_xyz789"
```

## Error Handling

Failed syncs are recorded in `registry_identities`:
- `syncStatus = 'error'`
- `lastSyncError` = error message

Use `retryAllFailed()` to retry, or call individual sync methods again.

## Batch Job Setup

For production, set up a cron job to:

```typescript
// Run every hour
async function syncJob() {
  // 1. Sync pending entities
  await syncAllPending();

  // 2. Retry failures (with backoff logic if needed)
  await retryAllFailed();

  // 3. Pull confirmation status for verified batches
  await confirmGHGStatements();
}
```

## Environment Variables

```bash
# Required for Isometric sync
ISOMETRIC_PROJECT_ID=your_project_id_here
ISOMETRIC_CLIENT_SECRET=your_client_secret_here
ISOMETRIC_ACCESS_TOKEN=your_access_token_here
ISOMETRIC_ENVIRONMENT=sandbox  # or 'production'
```

## Adding Future Registries

To add a new registry (e.g., Puro.earth):

1. Create `src/lib/adapters/puro/adapter.ts` implementing `RegistryAdapter`
2. Add transformers for entity mappings
3. Update sync-config.ts with `PURO_EXTERNAL_ENTITY_TYPES`
4. **No schema changes needed** - same `registry_identities` table

```typescript
// src/lib/adapters/types.ts
export interface RegistryAdapter {
  readonly name: string;
  syncFacility(facilityId: string): Promise<SyncResult>;
  syncFeedstockType(feedstockTypeId: string): Promise<SyncResult>;
  syncProductionBatch(productionRunId: string): Promise<SyncResult>;
  syncApplication(applicationId: string): Promise<SyncResult>;
  syncGHGStatement(creditBatchId: string): Promise<SyncResult>;
  confirmRemoval(registryRemovalId: string): Promise<SyncResult>;
  confirmGHGStatement(registryStatementId: string): Promise<SyncResult>;
}
```

## Files Reference

| File | Purpose |
|------|---------|
| `src/db/schema/registry.ts` | Polymorphic `registry_identities` table |
| `src/lib/adapters/types.ts` | Registry-agnostic interfaces |
| `src/lib/adapters/sync-config.ts` | Entity-to-external-type mappings |
| `src/lib/adapters/registry-identity-service.ts` | CRUD for registry sync state |
| `src/lib/adapters/sync-helpers.ts` | Utility functions |
| `src/lib/adapters/isometric/adapter.ts` | Main `IsometricAdapter` class |
| `src/lib/adapters/isometric/sync.ts` | Batch sync & retry orchestration |
| `src/lib/adapters/isometric/transformers/*.ts` | Data transformation functions |

## Registry Identity Service API

```typescript
import {
  getOrCreateRegistryIdentity,
  getExternalId,
  markSyncing,
  markSynced,
  markError,
} from '@/lib/adapters/registry-identity-service';

// Get or create a registry identity row
const identity = await getOrCreateRegistryIdentity(
  'facility',           // entityType
  facilityId,           // entityId
  'isometric',          // registryName
  'facility'            // externalEntityType
);

// Mark as syncing before API call
await markSyncing(identity.id);

// On success
await markSynced(identity.id, 'fac_123', { projectId: 'proj_456' });

// On failure
await markError(identity.id, 'API returned 400: Invalid payload');

// Check if already synced
const externalId = await getExternalId(
  'facility',
  facilityId,
  'isometric',
  'facility'
);
if (externalId) {
  console.log('Already synced:', externalId);
}
```
