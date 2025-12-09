# Isometric Registry Adapter

The Isometric adapter provides a registry-agnostic pattern for syncing local DMRV data to Isometric's carbon credit verification system. The design allows for future adapters (Puro.earth, Verra, etc.) to be added without changing the core data model.

## Architecture

```
Component → hooks/ → fn/ → adapters/isometric/ → lib/isometric/client.ts
                              ↓
                          data-access/
```

The adapter sits between business logic (`fn/`) and the low-level API client (`lib/isometric/`).

## Data Model Mapping

| Varuna Entity | Isometric Entity | Sync Direction |
|---------------|------------------|----------------|
| `facilities` | Facility | Push |
| `feedstockTypes` | FeedstockType | Push |
| `productionRuns` | ProductionBatch | Push |
| `applications` | StorageLocation + BiocharApplication | Push |
| `creditBatches` | GHGStatement (+ Removals) | Push + Pull confirmation |

## Sync Tracking Fields

Each syncable table has these tracking fields:

```typescript
// Added to: facilities, feedstockTypes, productionRuns, applications, creditBatches
syncStatus: 'pending' | 'syncing' | 'synced' | 'error'
lastSyncedAt: timestamp | null
lastSyncError: text | null

// Isometric-specific IDs (varies by table)
isometricFacilityId: text | null  // facilities
isometricFeedstockTypeId: text | null  // feedstockTypes
isometricProductionBatchId: text | null  // productionRuns
isometricStorageLocationId: text | null  // applications
isometricBiocharApplicationId: text | null  // applications
isometricGhgStatementId: text | null  // creditBatches
```

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
  console.log('Synced:', result.registryId);
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
import { getSyncSummary } from '@/lib/adapters/isometric';

const summary = await getSyncSummary();
// Returns counts by status for each entity type:
// {
//   facilities: { pending: 2, syncing: 0, synced: 10, error: 1 },
//   feedstockTypes: { ... },
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
2. **syncApplication** - Creates StorageLocation, then BiocharApplication
3. **syncGHGStatement** - Syncs all linked applications as Removals first

## Error Handling

Failed syncs are recorded with:
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
3. The local schema remains unchanged - only add new registry-specific ID fields

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
| `src/lib/adapters/types.ts` | Registry-agnostic interfaces |
| `src/lib/adapters/isometric/adapter.ts` | Main `IsometricAdapter` class |
| `src/lib/adapters/isometric/sync.ts` | Batch sync & retry orchestration |
| `src/lib/adapters/isometric/transformers/*.ts` | Data transformation functions |
| `src/db/schema/common.ts` | `syncStatus` enum definition |
