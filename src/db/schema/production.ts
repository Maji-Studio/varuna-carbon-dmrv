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

  // Registry sync tracking moved to registry_identities table

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Production Run Readings - Time-series monitoring data
// Isometric Protocol: Appendix II Monitoring Plan
// Temperature: 5-min intervals, Pressure/Emissions: 1-min intervals
// ============================================

export const productionRunReadings = pgTable('production_run_readings', {
  id: uuid('id').primaryKey().defaultRandom(),
  productionRunId: uuid('production_run_id')
    .notNull()
    .references(() => productionRuns.id),

  timestamp: timestamp('timestamp').notNull(),

  // Temperature monitoring (5-min intervals required)
  temperatureC: real('temperature_c'),

  // Pressure monitoring (1-min intervals, required if reactor >0.5 bar)
  pressureBar: real('pressure_bar'),

  // Emissions monitoring (1-min intervals, Option 1: continuous measurement)
  ch4Composition: real('ch4_composition'), // Methane
  n2oComposition: real('n2o_composition'), // Nitrous oxide
  coComposition: real('co_composition'), // Carbon monoxide
  co2Composition: real('co2_composition'), // Carbon dioxide
  gasFlowRate: real('gas_flow_rate'), // m³/s or equivalent

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// Samples - Biochar quality samples
// Isometric Protocol: Section 8.3 (Calculation of C_biochar)
// Biochar Storage in Soil Environments Module v1.2: Section 3, Table 2
// Supports Method A (every batch) and Method B (every 10th batch)
// Minimum 3 samples per production batch required
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

  // --- Carbon Measurements (Isometric: Table 2) ---
  // Total Carbon Content (Required - ISO 29541 or ASTM D5373)
  totalCarbonPercent: real('total_carbon_percent'),
  // Inorganic Carbon (Required - ISO 16948 or ASTM D4373)
  inorganicCarbonPercent: real('inorganic_carbon_percent'),
  // Organic Carbon (Calculated: Total C - Inorganic C)
  organicCarbonPercent: real('organic_carbon_percent'),

  // Legacy field - keeping for backward compatibility
  carbonContentPercent: real('carbon_content_percent'),

  // --- Elemental Analysis (Isometric: Table 2) ---
  hydrogenContentPercent: real('hydrogen_content_percent'), // Required - ISO 29541/ASTM D5373
  oxygenContentPercent: real('oxygen_content_percent'), // Required - ISO 16948/DIN 51733
  nitrogenPercent: real('nitrogen_percent'), // Required - ISO 29541/ASTM D5373
  sulfurPercent: real('sulfur_percent'), // Required - ISO 15178/DIN 51724

  // --- Stability Ratios (Isometric: Table 2) ---
  // H:Corg molar ratio (Required, threshold < 0.5 for eligibility)
  hCorgMolarRatio: real('h_corg_molar_ratio'),
  // O:Corg molar ratio (Required, threshold < 0.2 for eligibility)
  oCorgMolarRatio: real('o_corg_molar_ratio'),

  // --- Proximate Analysis ---
  moisturePercent: real('moisture_percent'), // Required - ISO 18134/ASTM D1762
  ashPercent: real('ash_percent'), // Required - ISO 18122/ISO 1171
  volatileMatterPercent: real('volatile_matter_percent'), // Recommended - ASTM D1762
  fixedCarbonPercent: real('fixed_carbon_percent'), // Recommended

  // --- Physical Properties (Isometric: Table 2) ---
  ph: real('ph'), // Required - ISO 10390
  saltContentGPerKg: real('salt_content_g_per_kg'), // Required - ISO 10390
  bulkDensityKgPerM3: real('bulk_density_kg_per_m3'), // Required (<3mm) - ISO 17828
  waterHoldingCapacityPercent: real('water_holding_capacity_percent'), // Recommended - ISO 14238

  // --- Heavy Metals (Isometric: Table 2 - all REQUIRED with thresholds) ---
  leadMgPerKg: real('lead_mg_per_kg'), // ≤300 mg/kg DM
  cadmiumMgPerKg: real('cadmium_mg_per_kg'), // ≤5 mg/kg DM
  copperMgPerKg: real('copper_mg_per_kg'), // ≤200 mg/kg DM
  nickelMgPerKg: real('nickel_mg_per_kg'), // ≤100 mg/kg DM
  mercuryMgPerKg: real('mercury_mg_per_kg'), // ≤2 mg/kg DM
  zincMgPerKg: real('zinc_mg_per_kg'), // ≤1000 mg/kg DM
  chromiumMgPerKg: real('chromium_mg_per_kg'), // ≤200 mg/kg DM
  arsenicMgPerKg: real('arsenic_mg_per_kg'), // ≤20 mg/kg DM

  // --- Contaminants (Isometric: Table 2 - all REQUIRED) ---
  pahsEfsa8MgPerKg: real('pahs_efsa8_mg_per_kg'), // ≤1 g/t DM (EFSA 8)
  pahsEpa16MgPerKg: real('pahs_epa16_mg_per_kg'), // Declaration (EPA 16)
  pcddFNgPerKg: real('pcdd_f_ng_per_kg'), // ≤20 ng/kg DM (17 PCDD/F)
  pcbMgPerKg: real('pcb_mg_per_kg'), // ≤0.2 mg/kg DM (12 WHO PCB)

  // --- Nutrients Declaration (Isometric: Table 2 - REQUIRED) ---
  phosphorusGPerKg: real('phosphorus_g_per_kg'),
  potassiumGPerKg: real('potassium_g_per_kg'),
  magnesiumGPerKg: real('magnesium_g_per_kg'),
  calciumGPerKg: real('calcium_g_per_kg'),
  ironGPerKg: real('iron_g_per_kg'),

  // --- 1000-Year Durability Fields (Isometric: Table 3 - Optional) ---
  // Required only for 1000-year durability crediting option
  randomReflectanceR0: real('random_reflectance_r0'), // >2% for inertinite (ISO 7404-5, 500+ measurements)
  residualOrganicCarbonPercent: real('residual_organic_carbon_percent'), // Rock-Eval/Hawk analysis

  // --- Lab Information (Isometric: ISO 17025 compliance) ---
  labName: text('lab_name'),
  labAccreditationNumber: text('lab_accreditation_number'), // ISO 17025 accreditation
  analysisMethod: text('analysis_method'), // e.g., "ASTM D5291", "ISO 29541"

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
    readings: many(productionRunReadings),
  })
);

export const productionRunReadingsRelations = relations(
  productionRunReadings,
  ({ one }) => ({
    productionRun: one(productionRuns, {
      fields: [productionRunReadings.productionRunId],
      references: [productionRuns.id],
    }),
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
