# Isometric Registry Sync

Simple functions for syncing local DMRV data to Isometric's Certify API.

## Usage

```typescript
import { syncFacility, syncCreditBatch } from '@/lib/adapters';

// Sync a facility
const result = await syncFacility(facilityId);
if (result.success) {
  console.log('Synced to Isometric:', result.isometricId);
} else {
  console.error('Sync failed:', result.error);
}
```

## Sync Functions

| Function | Entity | Isometric Entities Created |
|----------|--------|---------------------------|
| `syncFacility(id)` | Facility | Facility |
| `syncFeedstockType(id)` | FeedstockType | FeedstockType |
| `syncProductionRun(id)` | ProductionRun | ProductionBatch |
| `syncApplication(id)` | Application | StorageLocation + BiocharApplication |
| `syncCreditBatch(id)` | CreditBatch | Removal + GHGStatement |
| `confirmGHGStatement(id)` | CreditBatch | (pulls status from Isometric) |

## How It Works

Each sync function:
1. Loads the entity from the database
2. Checks if already synced (via `isometric_*_id` column)
3. Validates required fields
4. Transforms data to Isometric format
5. Calls Isometric API
6. Stores the returned Isometric ID

Isometric IDs are stored directly on entity tables:
- `facilities.isometric_facility_id`
- `feedstock_types.isometric_feedstock_type_id`
- `production_runs.isometric_production_batch_id`
- `applications.isometric_storage_location_id`
- `applications.isometric_biochar_application_id`
- `credit_batches.isometric_removal_id`
- `credit_batches.isometric_ghg_statement_id`

## Sync Triggers

Sync is triggered manually or via scheduled jobs:

```typescript
// Manual trigger (recommended)
await syncCreditBatch(creditBatchId);

// Check if synced
if (creditBatch.isometricGhgStatementId) {
  console.log('Already synced');
}
```

## Dependency Order

When syncing, dependencies are handled automatically:
- `syncProductionRun` will first sync the facility if needed
- `syncApplication` creates StorageLocation before BiocharApplication
- `syncCreditBatch` creates Removal before GHGStatement

## Confirmation Pulls

To check verification status from Isometric:

```typescript
import { confirmGHGStatement } from '@/lib/adapters';

// Pull status and update local credit batch
const result = await confirmGHGStatement(creditBatchId);
// Updates creditBatch.status based on Isometric's GHGStatement status
```

## Adding a Cron Job (Optional)

For automated syncing, add a scheduled job:

```typescript
// Example: Sync pending credit batches hourly
async function syncJob() {
  const pendingBatches = await db.query.creditBatches.findMany({
    where: and(
      eq(creditBatches.status, 'pending'),
      isNull(creditBatches.isometricGhgStatementId)
    ),
  });

  for (const batch of pendingBatches) {
    await syncCreditBatch(batch.id);
  }
}
```

## Environment Variables

```bash
ISOMETRIC_PROJECT_ID=your_project_id
ISOMETRIC_CLIENT_SECRET=your_client_secret
ISOMETRIC_ACCESS_TOKEN=your_access_token
ISOMETRIC_ENVIRONMENT=sandbox  # or 'production'
```

## Files

| File | Purpose |
|------|---------|
| `src/lib/adapters/isometric/adapter.ts` | Sync functions (~300 lines) |
| `src/lib/adapters/isometric/transformers/*.ts` | Data transformers (~500 lines) |
| `src/lib/isometric/client.ts` | Low-level API client |
