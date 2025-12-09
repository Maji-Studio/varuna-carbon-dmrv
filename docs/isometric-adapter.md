# Isometric Registry Sync

Simple functions for syncing local DMRV data to Isometric's Certify API.

## Quick Start

```bash
# 1. Start the database
pnpm docker:up

# 2. Seed test data
pnpm tsx scripts/seed-test-data.ts

# 3. Run the sync
pnpm tsx scripts/test-isometric-sync.ts
```

## Usage

```typescript
import { syncCreditBatch, pullFeedstockTypes } from '@/lib/adapters/isometric';

// Pull feedstock types from Isometric (match by name)
const feedstockResult = await pullFeedstockTypes();
console.log(`Matched ${feedstockResult.matched} feedstock types`);

// Sync a credit batch (creates Removal + GHG Statement)
const result = await syncCreditBatch(creditBatchId);
if (result.success) {
  console.log('Synced to Isometric:', result.isometricId);
} else {
  console.error('Sync failed:', result.error);
}
```

## Architecture: Template-Driven Approach

Instead of modeling Isometric's full component hierarchy locally, we use a **template-driven approach**:

1. **Pull** the removal template structure from Isometric
2. **Map** our local data directly to template component inputs
3. **Push** a complete removal with populated `removal_template_components`

This keeps the architecture simple while actually submitting verifiable data.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Local DMRV     │     │  Removal        │     │  Isometric      │
│  Data           │ ──▶ │  Data Mapper    │ ──▶ │  API            │
│                 │     │                 │     │                 │
│ - ProductionRun │     │ Maps fields to  │     │ Creates:        │
│ - Sample        │     │ template inputs │     │ - Removal       │
│ - Application   │     │                 │     │ - GHG Statement │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Sync Functions

| Function | Description |
|----------|-------------|
| `syncFacility(id)` | Sync facility → Isometric Facility |
| `pullFeedstockTypes()` | Pull feedstock types from Isometric, match by name |
| `syncProductionRun(id)` | Sync production run → Isometric ProductionBatch |
| `syncApplication(id)` | Sync application → StorageLocation + BiocharApplication |
| `syncCreditBatch(id)` | **Main function** - Creates Removal with component data + GHG Statement |
| `confirmGHGStatement(id)` | Pull verification status from Isometric |

### syncCreditBatch (Main Flow)

This is the primary function for submitting data to Isometric:

```typescript
async function syncCreditBatch(creditBatchId: string): Promise<SyncResult> {
  // 1. Load credit batch with related data
  // 2. Load applications, production run, and samples
  // 3. Validate local data (carbon content, H:Corg ratio, etc.)
  // 4. Fetch removal template from Isometric
  // 5. Map local data to template component inputs
  // 6. Create Removal with actual component data
  // 7. Create GHG Statement for verification
}
```

### pullFeedstockTypes

Feedstock types can **only** be created via Isometric's Certify UI. This function pulls existing types and matches them to local feedstock types by name:

```typescript
const result = await pullFeedstockTypes();
// { success: true, matched: 3, unmatched: ['Unknown Type'] }
```

## Data Mapping

The removal data mapper (`transformers/removal.ts`) maps local fields to Isometric template inputs:

| Isometric Input | Local Source | Field |
|-----------------|--------------|-------|
| `carbon_content` | Sample | `organicCarbonPercent / 100` |
| `product_mass` | ProductionRun | `biocharAmountKg` |
| `volume_of_fuel` | ProductionRun | `dieselOperationLiters` |
| `electricity_use` | ProductionRun | `electricityKwh` |
| `feedstock_mass` | ProductionRun | `feedstockAmountKg` |

The key component for CO2 calculation is **"CO₂ stored from biochar application"** which needs:
- `carbon_content` - Organic carbon fraction (dimensionless)
- `product_mass` - Mass of biochar in kg

## Multi-Source Blending

When a credit batch contains biochar from **multiple production runs** (a "Storage Batch" in Isometric terminology), the adapter automatically aggregates data following Isometric Protocol v1.2.

### Aggregation Rules

| Field | Aggregation Method | Description |
|-------|-------------------|-------------|
| `carbon_content` | Mass-weighted average | `SUM(carbon_p × mass_p) / SUM(mass_p)` |
| `product_mass` | Sum | Total biochar mass across all runs |
| `volume_of_fuel` | Sum | Total diesel usage |
| `electricity_use` | Sum | Total electricity usage |
| `feedstock_mass` | Sum | Total feedstock mass |
| `H:Corg ratio` | Mass-weighted average | Weighted by biochar mass |
| `O:Corg ratio` | Mass-weighted average | Weighted by biochar mass |

### Isometric Protocol v1.2 Formula

```
CO2e_Stored = SUM(C_biochar,p × m_biochar,p / 100) × 44.01/12.01
```

Where:
- `p` = Production Batch identifier
- `C_biochar,p` = carbon concentration (weight %) from production batch p
- `m_biochar,p` = mass of biochar from production batch p

### Sample Handling

For each production run, sample values are averaged, then mass-weighted across runs:

1. **Per-run average**: `run_carbon = AVG(sample_1, sample_2, ..., sample_n)`
2. **Cross-run weighting**: `weighted_carbon = SUM(run_carbon × run_mass) / SUM(run_mass)`

### Validation

The adapter validates multi-source data before sync:

| Condition | Result |
|-----------|--------|
| Missing `biocharAmountKg` on any run | ERROR - required for weighting |
| Missing samples on any run | WARNING |
| Carbon variance >20% across runs | WARNING - heterogeneous blend |
| Weighted H:Corg >= 0.5 | ERROR - fails durability |
| Weighted O:Corg >= 0.2 | ERROR - fails durability |

### Logging

When multiple production runs are detected:

```
Multi-source blend detected: 3 production runs
Source IDs: abc-123, def-456, ghi-789
Weighted carbon content: 72.45%
Total biochar mass: 1500 kg
```

### Code Location

- Aggregation utilities: `src/lib/adapters/isometric/utils/aggregation.ts`
- Aggregated mapping: `src/lib/adapters/isometric/transformers/removal.ts`

## Validation

Before syncing, the mapper validates:

- Sample has `organicCarbonPercent` (required for CO2 calculation)
- Production run has `biocharAmountKg` (required for CO2 calculation)
- H:Corg ratio < 0.5 (required for 200-year durability)
- O:Corg ratio < 0.2 (required for 200-year durability)

```typescript
const validation = validateLocalDataForRemoval(localData);
if (!validation.valid) {
  console.error('Errors:', validation.errors);
}
if (validation.warnings.length > 0) {
  console.warn('Warnings:', validation.warnings);
}
```

## Isometric IDs Storage

Isometric IDs are stored directly on entity tables:

| Table | Column | Isometric Entity |
|-------|--------|------------------|
| `facilities` | `isometric_facility_id` | Facility |
| `feedstock_types` | `isometric_feedstock_type_id` | FeedstockType |
| `production_runs` | `isometric_production_batch_id` | ProductionBatch |
| `applications` | `isometric_storage_location_id` | StorageLocation |
| `applications` | `isometric_biochar_application_id` | BiocharApplication |
| `credit_batches` | `isometric_removal_id` | Removal |
| `credit_batches` | `isometric_ghg_statement_id` | GHGStatement |

## Environment Variables

```bash
# Isometric API credentials
ISOMETRIC_CLIENT_SECRET=your_client_secret
ISOMETRIC_ACCESS_TOKEN=your_access_token
ISOMETRIC_ENVIRONMENT=sandbox  # or 'production'

# Isometric project configuration
ISOMETRIC_PROJECT_ID=prj_your_project_id
ISOMETRIC_REMOVAL_TEMPLATE_ID=rvt_your_template_id
```

Get these from:
- Credentials: https://registry.isometric.com/account/team-settings
- Project ID: https://certify.isometric.com (your project URL)
- Template ID: Run `pnpm tsx scripts/inspect-isometric.ts`

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/inspect-isometric.ts` | Inspect removal templates and feedstock types |
| `scripts/seed-test-data.ts` | Seed complete test data for one verification |
| `scripts/test-isometric-sync.ts` | Test end-to-end sync flow |

### Inspect Template Structure

```bash
pnpm tsx scripts/inspect-isometric.ts
```

Shows:
- Removal template with all component groups
- Required inputs for each component
- Available feedstock types

### Seed Test Data

```bash
pnpm tsx scripts/seed-test-data.ts
```

Creates a complete chain of custody:
- Facility (Maji Test Facility - Arusha)
- Feedstock Type (Mixed Wood Chips)
- Production Run with pyrolysis data
- Sample with full Isometric-required characterization
- Application (field spreading)
- Credit Batch linked to application

### Test Sync

```bash
pnpm tsx scripts/test-isometric-sync.ts
```

Runs the full sync and shows results.

## Files

| File | Purpose |
|------|---------|
| `src/lib/isometric/client.ts` | Low-level API client |
| `src/lib/isometric/types.ts` | TypeScript types for Isometric API |
| `src/lib/adapters/isometric/adapter.ts` | Sync functions |
| `src/lib/adapters/isometric/transformers/removal.ts` | Template → local data mapping |
| `src/lib/adapters/isometric/transformers/*.ts` | Other data transformers |
| `src/config/env.server.ts` | Environment variable configuration |

## Confirmation Pulls

To check verification status from Isometric:

```typescript
import { confirmGHGStatement } from '@/lib/adapters/isometric';

// Pull status and update local credit batch
const result = await confirmGHGStatement(creditBatchId);
// Updates creditBatch.status based on Isometric's GHGStatement status:
// - DRAFT/SUBMITTED → 'pending'
// - VERIFIED → 'verified'
```

## Troubleshooting

### "Credit batch has no linked applications"
Run `pnpm tsx scripts/seed-test-data.ts` to create test data with proper relationships.

### "No production run found for facility"
The credit batch's facility needs at least one production run with samples.

### "Data validation failed: Sample organic carbon percent is required"
The production run's sample needs `organicCarbonPercent` set.

### "H:Corg ratio must be < 0.5 for 200-year durability"
The biochar sample doesn't meet Isometric's stability requirements. Check the sample data.
