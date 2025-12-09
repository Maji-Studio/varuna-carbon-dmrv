import {
  pgTable,
  text,
  timestamp,
  uuid,
  real,
  date,
  integer,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { creditBatchStatus, durabilityOption } from './common';
import { facilities, reactors } from './facilities';
import { applications } from './application';

// ============================================
// Credit Batches - Carbon credit batches for registry
// Isometric Protocol: Verification requirements
// ============================================

export const creditBatches = pgTable('credit_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(), // e.g., "CB-2025-043"
  facilityId: uuid('facility_id')
    .notNull()
    .references(() => facilities.id),
  date: date('date'),
  status: creditBatchStatus('status').default('pending').notNull(),

  // --- Overview ---
  reactorId: uuid('reactor_id').references(() => reactors.id),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  certifier: text('certifier'), // e.g., "Isometric"
  registry: text('registry'), // e.g., "Isometric"

  // --- Credit Details (Isometric Protocol Section 8) ---
  batchesCount: integer('batches_count'),
  weightTons: real('weight_tons'),
  creditsTco2e: real('credits_tco2e'), // Net CO2e removal
  valueTzs: real('value_tzs'),

  // Isometric: Buffer pool contribution (risk-based 2-20%)
  bufferPoolPercent: real('buffer_pool_percent'),

  // --- Durability Calculation (Isometric: Soil Storage Module Section 5.1) ---
  // Project-level choice: 200-year (H:Corg + soil temp) or 1000-year (R0 reflectance)
  durabilityOptionType: durabilityOption('durability_option'),

  // Soil temperature - required for F_durable calculation (200-year option)
  // Formula: F_durable,200 = min(0.95, 1 - [c + (a + b·ln(T_soil))·H/C_org])
  // Where: a=-0.383, b=0.350, c=-0.048
  soilTemperatureC: real('soil_temperature_c'), // Annual average for project area
  soilTemperatureSource: text('soil_temperature_source'), // 'baseline' | 'global_database'

  // Calculated durability fraction (applies to all applications in this batch)
  fDurableCalculated: real('f_durable_calculated'),

  // --- Site Management Summary (Isometric: Section 5.2.1) ---
  // Aggregated info for GHG Statement submission
  siteManagementNotes: text('site_management_notes'), // Irrigation, tillage, fertilizer summary

  // --- Third-Party Sale Verification (Isometric: SubRequirement G-SZZR-0) ---
  // Required when biochar is sold to third parties before application
  affidavitReference: text('affidavit_reference'), // Legally binding declaration ref
  intendedUseConfirmation: text('intended_use_confirmation'), // Explicit soil application intent
  companyVerificationRef: text('company_verification_ref'), // 3+ years active ag company proof
  mixingTimelineDays: integer('mixing_timeline_days'), // Days until mixed with soil

  // --- Isometric Registry Sync ---
  // Credit batch maps to 2 Isometric entities: Removal + GHGStatement
  isometricRemovalId: text('isometric_removal_id'),
  isometricGhgStatementId: text('isometric_ghg_statement_id'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Lab Analyses - External laboratory reports
// Isometric Protocol: Section 8.3 (Sampling requirements)
// ============================================

export const labAnalyses = pgTable('lab_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  creditBatchId: uuid('credit_batch_id')
    .notNull()
    .references(() => creditBatches.id),
  analysisDate: timestamp('analysis_date'),
  analystName: text('analyst_name'),
  reportFile: text('report_file'), // URL/path to report file
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Credit Batch Applications - Junction table (M:M)
// Links credit batches to multiple applications
// ============================================

export const creditBatchApplications = pgTable(
  'credit_batch_applications',
  {
    creditBatchId: uuid('credit_batch_id')
      .notNull()
      .references(() => creditBatches.id),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.creditBatchId, table.applicationId] })]
);

// ============================================
// Relations
// ============================================

export const creditBatchesRelations = relations(
  creditBatches,
  ({ one, many }) => ({
    facility: one(facilities, {
      fields: [creditBatches.facilityId],
      references: [facilities.id],
    }),
    reactor: one(reactors, {
      fields: [creditBatches.reactorId],
      references: [reactors.id],
    }),
    labAnalyses: many(labAnalyses),
    creditBatchApplications: many(creditBatchApplications),
  })
);

export const labAnalysesRelations = relations(labAnalyses, ({ one }) => ({
  creditBatch: one(creditBatches, {
    fields: [labAnalyses.creditBatchId],
    references: [creditBatches.id],
  }),
}));

export const creditBatchApplicationsRelations = relations(
  creditBatchApplications,
  ({ one }) => ({
    creditBatch: one(creditBatches, {
      fields: [creditBatchApplications.creditBatchId],
      references: [creditBatches.id],
    }),
    application: one(applications, {
      fields: [creditBatchApplications.applicationId],
      references: [applications.id],
    }),
  })
);
