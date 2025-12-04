import {
  pgTable,
  text,
  timestamp,
  uuid,
  real,
  date,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { productionRunStatus } from './common';
import { facilities, reactors, storageLocations } from './facilities';
import { operators } from './parties';

// ============================================
// Production Runs - Pyrolysis batches
// Isometric Protocol: Section 9 (Pyrolysis Reactor System Requirements)
// ============================================

export const productionRuns = pgTable('production_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(), // e.g., "PR-2025-043"
  facilityId: uuid('facility_id')
    .notNull()
    .references(() => facilities.id),
  date: date('date').notNull(),
  status: productionRunStatus('status').default('running').notNull(),

  // --- Overview ---
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  reactorId: uuid('reactor_id').references(() => reactors.id),
  processType: text('process_type'), // e.g., "Raw Biochar"
  operatorId: uuid('operator_id').references(() => operators.id),

  // --- Feedstock Input ---
  feedstockMix: text('feedstock_mix'), // e.g., "Mixed Wood Chips"
  feedstockStorageLocationId: uuid('feedstock_storage_location_id').references(
    () => storageLocations.id
  ),
  feedstockAmountKg: real('feedstock_amount_kg'),
  feedingRateKgHr: real('feeding_rate_kg_hr'),
  moistureBeforeDryingPercent: real('moisture_before_drying_percent'),
  moistureAfterDryingPercent: real('moisture_after_drying_percent'),

  // --- Biochar Output ---
  biocharAmountKg: real('biochar_amount_kg'),
  yieldPercent: real('yield_percent'), // Calculated: (biochar/feedstock)*100
  biocharStorageLocationId: uuid('biochar_storage_location_id').references(
    () => storageLocations.id
  ),

  // --- Processing Parameters (Isometric Protocol Section 9) ---
  // Pyrolysis monitoring requirements
  pyrolysisTemperatureC: real('pyrolysis_temperature_c'), // Continuous monitoring
  residenceTimeMinutes: integer('residence_time_minutes'), // Process parameter

  // Energy accounting (Isometric: Energy Use Accounting Module)
  dieselOperationLiters: real('diesel_operation_liters'),
  dieselGensetLiters: real('diesel_genset_liters'),
  preprocessingFuelLiters: real('preprocessing_fuel_liters'),
  electricityKwh: real('electricity_kwh'),

  // --- Emissions (Isometric Protocol Section 8.6) ---
  emissionsFromFossilsKg: real('emissions_from_fossils_kg'), // Calculated
  emissionsFromGridKg: real('emissions_from_grid_kg'), // Calculated
  totalEmissionsKg: real('total_emissions_kg'), // Calculated

  // --- Quenching ---
  quenchingDryWeightKg: real('quenching_dry_weight_kg'),
  quenchingWetWeightKg: real('quenching_wet_weight_kg'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Samples - Biochar quality samples
// Isometric Protocol: Section 8.3 (Calculation of C_biochar)
// Supports Method A (every batch) and Method B (every 10th batch)
// ============================================

export const samples = pgTable('samples', {
  id: uuid('id').primaryKey().defaultRandom(),
  productionRunId: uuid('production_run_id')
    .notNull()
    .references(() => productionRuns.id),
  samplingTime: timestamp('sampling_time').notNull(),
  operatorId: uuid('operator_id').references(() => operators.id),
  reactorId: uuid('reactor_id').references(() => reactors.id),

  // --- Sampling Details ---
  weightG: real('weight_g'),
  volumeMl: real('volume_ml'),
  temperatureC: real('temperature_c'),

  // --- Biochar Quality (Isometric Protocol Section 8.3) ---
  // Required for C_biochar calculation (ASTM D5291)
  carbonContentPercent: real('carbon_content_percent'), // C_biochar
  hydrogenContentPercent: real('hydrogen_content_percent'), // For H:C ratio
  oxygenContentPercent: real('oxygen_content_percent'), // For O:C ratio

  // Proximate analysis
  moisturePercent: real('moisture_percent'),
  ashPercent: real('ash_percent'),
  volatileMatterPercent: real('volatile_matter_percent'),
  fixedCarbonPercent: real('fixed_carbon_percent'),

  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Incident Reports - Production issues
// Isometric Protocol: Section 5 (Adaptive Management)
// ============================================

export const incidentReports = pgTable('incident_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  productionRunId: uuid('production_run_id')
    .notNull()
    .references(() => productionRuns.id),
  incidentTime: timestamp('incident_time').notNull(),
  operatorId: uuid('operator_id').references(() => operators.id),
  reactorId: uuid('reactor_id').references(() => reactors.id),
  notes: text('notes'), // e.g., "Machine running a bit hot"

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Relations
// ============================================

export const productionRunsRelations = relations(
  productionRuns,
  ({ one, many }) => ({
    facility: one(facilities, {
      fields: [productionRuns.facilityId],
      references: [facilities.id],
    }),
    reactor: one(reactors, {
      fields: [productionRuns.reactorId],
      references: [reactors.id],
    }),
    operator: one(operators, {
      fields: [productionRuns.operatorId],
      references: [operators.id],
    }),
    feedstockStorageLocation: one(storageLocations, {
      fields: [productionRuns.feedstockStorageLocationId],
      references: [storageLocations.id],
      relationName: 'feedstockStorage',
    }),
    biocharStorageLocation: one(storageLocations, {
      fields: [productionRuns.biocharStorageLocationId],
      references: [storageLocations.id],
      relationName: 'biocharStorage',
    }),
    samples: many(samples),
    incidentReports: many(incidentReports),
  })
);

export const samplesRelations = relations(samples, ({ one }) => ({
  productionRun: one(productionRuns, {
    fields: [samples.productionRunId],
    references: [productionRuns.id],
  }),
  operator: one(operators, {
    fields: [samples.operatorId],
    references: [operators.id],
  }),
  reactor: one(reactors, {
    fields: [samples.reactorId],
    references: [reactors.id],
  }),
}));

export const incidentReportsRelations = relations(incidentReports, ({ one }) => ({
  productionRun: one(productionRuns, {
    fields: [incidentReports.productionRunId],
    references: [productionRuns.id],
  }),
  operator: one(operators, {
    fields: [incidentReports.operatorId],
    references: [operators.id],
  }),
  reactor: one(reactors, {
    fields: [incidentReports.reactorId],
    references: [reactors.id],
  }),
}));
