# Data Structure Documentation

Dark Earth Carbon - Biochar DMRV System

## Overview

This document describes the database schema for the biochar production Digital Measurement, Reporting, and Verification (DMRV) system. The schema is designed to:

- **Align with Figma designs** (see `dark-earth-carbon-schema.json`)
- **Full Isometric Protocol v1.2 compliance** for carbon credit certification
- **Support Biochar Storage in Soil Environments Module v1.2**

## Schema File Structure

```
src/db/
├── index.ts              # Database connection
├── schema.ts             # Main schema export
└── schema/
    ├── index.ts          # Re-export all schemas
    ├── common.ts         # Enums and shared types
    ├── users.ts          # User accounts
    ├── facilities.ts     # Facilities, reactors, storage locations
    ├── parties.ts        # Suppliers, customers, drivers, operators
    ├── feedstock.ts      # Feedstock types and batches
    ├── production.ts     # Production runs, samples, incidents
    ├── products.ts       # Formulations, biochar products
    ├── logistics.ts      # Orders, deliveries
    ├── application.ts    # Field applications (soil storage)
    ├── credits.ts        # Credit batches, lab analyses
    └── documentation.ts  # Polymorphic attachments
```

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CHAIN OF CUSTODY                                   │
│                                                                              │
│  Feedstock → ProductionRun → BiocharProduct → Order → Delivery → Application│
│      │              │              │            │         │           │      │
│      └──────────────┴──────────────┴────────────┴─────────┴───────────┘      │
│                                      ↓                                       │
│                              CreditBatch                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tables (22 total)

### Core Infrastructure

| Table | Description | Key Fields |
|-------|-------------|------------|
| `facilities` | Production sites | name, location, gps_lat, gps_lng |
| `reactors` | Pyrolysis equipment | code (R-001), facility_id, reactor_type |
| `storage_locations` | Storage bins/piles | name, type (enum), facility_id |
| `formulations` | Product recipes | code (BCF-01), biochar_ratio, compost_ratio |

### Parties

| Table | Description | Key Fields |
|-------|-------------|------------|
| `suppliers` | Biomass suppliers | name, location, gps coords |
| `customers` | Buyers/farmers | name, location, gps coords, crop_type |
| `drivers` | Transport drivers | name, contact |
| `operators` | Reactor operators | name |

### Chain of Custody

| Table | Code Format | Status Enum | Description |
|-------|-------------|-------------|-------------|
| `feedstock_types` | - | - | Biomass classification |
| `feedstocks` | FS-YYYY-NNN | missing_data, complete | Incoming biomass batches |
| `production_runs` | PR-YYYY-NNN | running, complete | Pyrolysis batches |
| `biochar_products` | BP-YYYY-NNN | testing, ready | Finished product batches |
| `orders` | OR-YYYY-NNN | ordered, processed | Customer orders |
| `deliveries` | DL-YYYY-NNN | processing, delivered | Product deliveries |
| `applications` | AP-YYYY-NNN | delivered, applied | Field applications |
| `credit_batches` | CB-YYYY-NNN | pending, verified, issued | Carbon credits |

### Quality & Verification

| Table | Description | Isometric Requirement |
|-------|-------------|----------------------|
| `samples` | Biochar quality samples | Section 8.3 - C_biochar calculation |
| `incident_reports` | Production issues | Section 5 - Adaptive management |
| `lab_analyses` | External lab reports | Section 8.3 - Sampling requirements |

### Supporting

| Table | Description |
|-------|-------------|
| `documentation` | Polymorphic attachments (photos, videos, PDFs) |
| `credit_batch_applications` | Junction table (M:M) |
| `users` | User accounts |

## Isometric Protocol Compliance Fields

### Production Run - Pyrolysis Monitoring (Section 9)

```
pyrolysis_temperature_c     # Continuous monitoring required
residence_time_minutes      # Process parameter
diesel_operation_liters     # Energy accounting
diesel_genset_liters
preprocessing_fuel_liters
electricity_kwh
emissions_from_fossils_kg   # Calculated
emissions_from_grid_kg      # Calculated
total_emissions_kg          # Calculated
```

### Samples - Biochar Quality (Section 8.3)

```
carbon_content_percent      # C_biochar (ASTM D5291)
hydrogen_content_percent    # For H:C ratio
oxygen_content_percent      # For O:C ratio
ash_percent
volatile_matter_percent
fixed_carbon_percent
moisture_percent
```

Supports both sampling methods:
- **Method A**: Sample every production batch
- **Method B**: Sample every 10th batch (after 30 initial samples)

### Application - Soil Storage (Module v1.2)

```
gps_lat                     # GPS required for soil storage
gps_lng
field_size_ha
application_method          # manual/mechanical
biochar_applied_tons
biochar_dry_matter_tons
```

### Credit Batch - Verification

```
certifier                   # "Isometric"
registry
credits_tco2e               # Net CO2e removal
buffer_pool_percent         # Risk-based (2-20%)
status                      # pending → verified → issued
```

## Enums

### Status Enums

| Enum | Values | Used By |
|------|--------|---------|
| `feedstock_status` | missing_data, complete | feedstocks |
| `production_run_status` | running, complete | production_runs |
| `biochar_product_status` | testing, ready | biochar_products |
| `order_status` | ordered, processed | orders |
| `delivery_status` | processing, delivered | deliveries |
| `application_status` | delivered, applied | applications |
| `credit_batch_status` | pending, verified, issued | credit_batches |

### Type Enums

| Enum | Values | Used By |
|------|--------|---------|
| `storage_location_type` | feedstock_bin, feedstock_pile, biochar_pile, product_pile | storage_locations |
| `packaging_type` | loose, bagged | orders |
| `application_method` | manual, mechanical | applications |
| `documentation_type` | photo, video, pdf | documentation |
| `documentation_entity_type` | feedstock, production_run, sample, incident_report, biochar_product, order, delivery, application, credit_batch | documentation |

## Conventions

### IDs
- All tables use **UUID** primary keys (`uuid('id').primaryKey().defaultRandom()`)
- Human-readable codes for chain of custody entities (e.g., `FS-2025-001`)

### Timestamps
- All tables include `created_at` and `updated_at` timestamps
- Default to `now()` on creation

### Naming
- **Database columns**: snake_case (`created_at`, `facility_id`)
- **TypeScript fields**: camelCase (`createdAt`, `facilityId`)

### GPS Coordinates
- Stored as separate `gps_lat` and `gps_lng` real columns
- No PostGIS dependency (simpler for now)

## Relationships

### Foreign Key Patterns

```typescript
// Required reference
facilityId: uuid('facility_id')
  .notNull()
  .references(() => facilities.id)

// Optional reference
supplierId: uuid('supplier_id')
  .references(() => suppliers.id)
```

### Many-to-Many (Credit Batches ↔ Applications)

Uses `credit_batch_applications` junction table with composite primary key:

```typescript
primaryKey({ columns: [table.creditBatchId, table.applicationId] })
```

## Usage Examples

### Query Production Run with Relations

```typescript
import { db } from '@/db';
import { productionRuns } from '@/db/schema';

const run = await db.query.productionRuns.findFirst({
  where: eq(productionRuns.code, 'PR-2025-001'),
  with: {
    facility: true,
    reactor: true,
    operator: true,
    samples: true,
    incidentReports: true,
  },
});
```

### Insert with Enum

```typescript
import { feedstocks, feedstockStatus } from '@/db/schema';

await db.insert(feedstocks).values({
  code: 'FS-2025-001',
  facilityId: facilityUuid,
  date: '2025-01-15',
  status: 'missing_data',
  weightKg: 1500,
  moisturePercent: 18.5,
});
```

## Migration

Generate migrations after schema changes:

```bash
pnpm db:generate   # Generate migration files
pnpm db:migrate    # Apply migrations
pnpm db:studio     # Visual DB management
```

## References

- [Isometric Biochar Protocol v1.2](https://registry.isometric.com/protocol/biochar/1.2)
- [Biochar Storage in Soil Environments Module v1.2](https://registry.isometric.com/module/biochar-storage-soil-environments/1.2)
- [Figma Schema](./dark-earth-carbon-schema.json)
