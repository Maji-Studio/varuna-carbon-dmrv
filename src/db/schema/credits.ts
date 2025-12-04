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
import { creditBatchStatus } from './common';
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
