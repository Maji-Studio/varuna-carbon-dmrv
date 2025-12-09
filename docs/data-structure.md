# Data Structure Documentation

Dark Earth Carbon - Biochar DMRV System

## Overview

This document describes the database schema for the biochar production Digital Measurement, Reporting, and Verification (DMRV) system. The schema is designed to:

- **Align with Figma designs** (see `dark-earth-carbon-schema.json`)
- **Full Isometric Protocol v1.2 compliance** for carbon credit certification
- **Support Biochar Storage in Soil Environments Module v1.2**
- **Support Transportation Emissions Accounting Module v1.1**

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
    ├── production.ts     # Production runs, samples, incidents, readings
    ├── products.ts       # Formulations, biochar products
    ├── logistics.ts      # Orders, deliveries, transport legs
    ├── application.ts    # Field applications, soil temperature
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
├─────────────────────────────────────────────────────────────────────────────┤
│                           MONITORING & EMISSIONS                             │
│                                                                              │
│  ProductionRun ← ProductionRunReadings (time-series monitoring)             │
│  Application ← SoilTemperatureMeasurements (durability baseline)            │
│  * ← TransportLegs (emissions tracking for any entity)                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tables (26 total)

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
| `samples` | Biochar quality samples | Section 8.3, Table 2 - Full characterization |
| `incident_reports` | Production issues | Section 5 - Adaptive management |
| `lab_analyses` | External lab reports | Section 8.3 - ISO 17025 compliance |

### Monitoring & Emissions (NEW)

| Table | Description | Isometric Requirement |
|-------|-------------|----------------------|
| `production_run_readings` | Time-series reactor monitoring | Appendix II - 5-min temp, 1-min pressure/emissions |
| `soil_temperature_measurements` | Durability baseline data | G-QMBJ-0 - 10+ measurements per site-month |
| `transport_legs` | Transportation emissions | Transportation Module v1.1 |

### Supporting

| Table | Description |
|-------|-------------|
| `documentation` | Polymorphic attachments (photos, videos, PDFs) |
| `credit_batch_applications` | Junction table (M:M) |
| `users` | User accounts |

## Isometric Protocol Compliance Fields

### Samples - Full Biochar Characterization (Table 2)

```
# Carbon Measurements
total_carbon_percent           # Required - ISO 29541/ASTM D5373
inorganic_carbon_percent       # Required - ISO 16948/ASTM D4373
organic_carbon_percent         # Calculated: Total C - Inorganic C

# Elemental Analysis
hydrogen_content_percent       # Required - ISO 29541/ASTM D5373
oxygen_content_percent         # Required - ISO 16948/DIN 51733
nitrogen_percent               # Required - ISO 29541/ASTM D5373
sulfur_percent                 # Required - ISO 15178/DIN 51724

# Stability Ratios (CRITICAL FOR ELIGIBILITY)
h_corg_molar_ratio             # Required, threshold < 0.5
o_corg_molar_ratio             # Required, threshold < 0.2

# Proximate Analysis
moisture_percent               # Required - ISO 18134/ASTM D1762
ash_percent                    # Required - ISO 18122/ISO 1171
volatile_matter_percent        # Recommended
fixed_carbon_percent           # Recommended

# Physical Properties
ph                             # Required - ISO 10390
salt_content_g_per_kg          # Required - ISO 10390
bulk_density_kg_per_m3         # Required (<3mm) - ISO 17828
water_holding_capacity_percent # Recommended - ISO 14238

# Heavy Metals (ALL REQUIRED with thresholds)
lead_mg_per_kg                 # ≤300 mg/kg DM
cadmium_mg_per_kg              # ≤5 mg/kg DM
copper_mg_per_kg               # ≤200 mg/kg DM
nickel_mg_per_kg               # ≤100 mg/kg DM
mercury_mg_per_kg              # ≤2 mg/kg DM
zinc_mg_per_kg                 # ≤1000 mg/kg DM
chromium_mg_per_kg             # ≤200 mg/kg DM
arsenic_mg_per_kg              # ≤20 mg/kg DM

# Contaminants (ALL REQUIRED)
pahs_efsa8_mg_per_kg           # ≤1 g/t DM (EFSA 8)
pahs_epa16_mg_per_kg           # Declaration (EPA 16)
pcdd_f_ng_per_kg               # ≤20 ng/kg DM (17 PCDD/F)
pcb_mg_per_kg                  # ≤0.2 mg/kg DM (12 WHO PCB)

# Nutrients Declaration (REQUIRED)
phosphorus_g_per_kg
potassium_g_per_kg
magnesium_g_per_kg
calcium_g_per_kg
iron_g_per_kg

# 1000-Year Durability (Optional - Table 3)
random_reflectance_r0          # >2% for inertinite (ISO 7404-5)
residual_organic_carbon_percent # Rock-Eval/Hawk analysis

# Lab Compliance
lab_name
lab_accreditation_number       # ISO 17025
analysis_method
```

### Production Run Readings - Continuous Monitoring (Appendix II)

```
timestamp                      # Recording time
temperature_c                  # 5-minute intervals required
pressure_bar                   # 1-minute intervals (if >0.5 bar)
ch4_composition                # 1-minute intervals (Option 1)
n2o_composition                # 1-minute intervals (Option 1)
co_composition                 # 1-minute intervals (Option 1)
co2_composition                # 1-minute intervals (Option 1)
gas_flow_rate                  # 1-minute intervals (Option 1)
```

### Production Run - Energy Accounting

```
pyrolysis_temperature_c        # Summary value
residence_time_minutes         # Process parameter
diesel_operation_liters        # Energy accounting
diesel_genset_liters
preprocessing_fuel_liters
electricity_kwh
emissions_from_fossils_kg      # Calculated
emissions_from_grid_kg         # Calculated
total_emissions_kg             # Calculated
```

### Application - Field-Level Data (Section 5)

```
# Field Details
gps_lat                        # GPS required for soil storage
gps_lng
field_size_ha
application_method             # manual/mechanical
field_identifier               # Field name/parcel ID
gis_boundary_reference         # Link to GIS layer

# Application Quantities
biochar_applied_tons
biochar_dry_matter_tons
total_applied_tons             # Calculated

# Calculated Output
co2e_stored_tonnes             # This field's CO2e contribution
```

Note: Durability calculation inputs (soil_temperature, durability_option, f_durable)
are now at Credit Batch level since they apply to the entire project/batch.

### Soil Temperature Measurements (G-QMBJ-0)

```
measurement_date               # Date of measurement
temperature_c                  # Temperature reading
measurement_method             # ISO 4974 or equivalent
measurement_depth_cm           # Depth of measurement
measurement_lat                # Location within field
measurement_lng
```

Minimum 10 measurements per site-month required for baseline.

### Transport Legs - Emissions Tracking (Module v1.1)

```
# Entity Reference (Polymorphic)
entity_type                    # feedstock | biochar | sample | delivery
entity_id

# Route
origin_lat, origin_lng, origin_name
destination_lat, destination_lng, destination_name
distance_km

# Transport Details
transport_method               # road | rail | ship | pipeline | aircraft
vehicle_type                   # e.g., "Class 8 heavy-duty truck"
vehicle_model_year

# Energy Usage Method (Preferred - Section 3.2)
fuel_type
fuel_consumed_liters
electricity_kwh

# Distance-Based Method (Section 3.3)
load_weight_tonnes
load_capacity_utilization_percent

# Emissions Calculation
calculation_method             # 'energy_usage' | 'distance_based'
emission_factor_used
emission_factor_source
emissions_co2e_kg

# Book and Claim Units (Section 4)
bcu_used
bcu_provider
bcu_certification_ref

# Documentation
bill_of_lading
weigh_scale_ticket_ref
```

### Credit Batch - Verification (Isometric Section 5.1, G-SZZR-0)

```
# Overview
certifier                      # "Isometric"
registry
credits_tco2e                  # Net CO2e removal (aggregated from applications)
buffer_pool_percent            # Risk-based (2-20%)
status                         # pending → verified → issued

# Durability Calculation (Project-Level)
durability_option              # '200_year' | '1000_year'
soil_temperature_c             # Annual average for project area
soil_temperature_source        # 'baseline' | 'global_database'
f_durable_calculated           # Durability fraction (max 0.95)

# Site Management Summary (Section 5.2.1)
site_management_notes          # Irrigation, tillage, fertilizer summary

# Third-Party Sale Verification (G-SZZR-0)
# Required when biochar is sold to third parties before application
affidavit_reference            # Legally binding declaration ref
intended_use_confirmation      # Explicit soil application intent
company_verification_ref       # 3+ years active ag company proof
mixing_timeline_days           # Days until mixed with soil
```

Formula for 200-year durability:
```
F_durable,200 = min(0.95, 1 - [c + (a + b·ln(T_soil))·H/C_org])
Where: a=-0.383, b=0.350, c=-0.048

CO2e_stored = C_biochar × m_biochar × F_durable × 44.01/12.01
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
| `sync_status` | pending, syncing, synced, error | facilities, feedstock_types, production_runs, applications, credit_batches |

### Type Enums

| Enum | Values | Used By |
|------|--------|---------|
| `storage_location_type` | feedstock_bin, feedstock_pile, biochar_pile, product_pile | storage_locations |
| `packaging_type` | loose, bagged | orders |
| `application_method` | manual, mechanical | applications |
| `documentation_type` | photo, video, pdf | documentation |
| `documentation_entity_type` | feedstock, production_run, sample, incident_report, biochar_product, order, delivery, application, credit_batch | documentation |

### Isometric Protocol Enums

| Enum | Values | Used By | Protocol Reference |
|------|--------|---------|-------------------|
| `durability_option` | 200_year, 1000_year | credit_batches | Section 5.1 |
| `transport_entity_type` | feedstock, biochar, sample, delivery | transport_legs | Transportation Module |
| `transport_method` | road, rail, ship, pipeline, aircraft | transport_legs | Transportation Module |
| `emissions_calculation_method` | energy_usage, distance_based | transport_legs | Section 3.2, 3.3 |

## Registry Sync Tracking

Tables that sync to external registries (Isometric, etc.) include tracking fields:

### Sync Status Fields (Common)

```typescript
// Added to: facilities, feedstockTypes, productionRuns, applications, creditBatches
syncStatus: syncStatus('sync_status').default('pending')  // pending | syncing | synced | error
lastSyncedAt: timestamp('last_synced_at')                 // Last successful sync time
lastSyncError: text('last_sync_error')                    // Error message if sync failed
```

### Isometric Registry IDs (Entity-Specific)

| Table | Isometric ID Field | Isometric Entity |
|-------|-------------------|------------------|
| `facilities` | `isometric_facility_id` | Facility |
| `feedstock_types` | `isometric_feedstock_type_id` | FeedstockType |
| `production_runs` | `isometric_production_batch_id` | ProductionBatch |
| `applications` | `isometric_storage_location_id` | StorageLocation |
| `applications` | `isometric_biochar_application_id` | BiocharApplication |
| `credit_batches` | `isometric_ghg_statement_id` | GHGStatement |

See [isometric-adapter.md](./isometric-adapter.md) for adapter usage.

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

### Isometric Thresholds
- Heavy metal thresholds in mg/kg DM (dry matter)
- Contaminant thresholds vary by compound (see Table 2)
- H:Corg < 0.5 and O:Corg < 0.2 required for eligibility

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

### One-to-Many (Time Series)

```typescript
// Production Run has many Readings
productionRuns → productionRunReadings

// Application has many Soil Temperature Measurements
applications → soilTemperatureMeasurements
```

## Usage Examples

### Query Production Run with Readings

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
    readings: true, // Time-series monitoring data
  },
});
```

### Query Application with Durability Data

```typescript
import { db } from '@/db';
import { applications } from '@/db/schema';

const app = await db.query.applications.findFirst({
  where: eq(applications.code, 'AP-2025-001'),
  with: {
    facility: true,
    delivery: true,
    soilTemperatureMeasurements: true, // Baseline measurements
  },
});
```

### Insert Sample with Full Characterization

```typescript
import { samples } from '@/db/schema';

await db.insert(samples).values({
  productionRunId: runUuid,
  samplingTime: new Date(),

  // Carbon
  totalCarbonPercent: 75.2,
  inorganicCarbonPercent: 1.3,
  organicCarbonPercent: 73.9,

  // Stability ratios
  hCorgMolarRatio: 0.32, // Must be < 0.5
  oCorgMolarRatio: 0.08, // Must be < 0.2

  // Heavy metals
  leadMgPerKg: 15.2,     // Threshold: ≤300
  cadmiumMgPerKg: 0.3,   // Threshold: ≤5

  // Lab info
  labName: 'AccreditedLab Inc.',
  labAccreditationNumber: 'ISO17025-12345',
  analysisMethod: 'ASTM D5291',
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
- [Transportation Emissions Accounting Module v1.1](https://registry.isometric.com/module/transportation/1.1)
- [Figma Schema](./dark-earth-carbon-schema.json)
