import { pgTable, text, timestamp, uuid, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { biocharProductStatus } from './common';
import { facilities, storageLocations } from './facilities';
import { productionRuns } from './production';

// ============================================
// Formulations - Product recipes
// ============================================

export const formulations = pgTable('formulations', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(), // e.g., "BCF-01"
  name: text('name').notNull(), // e.g., "Raw Biochar", "BCF-01 - Organic"
  biocharRatio: real('biochar_ratio'), // Percentage of biochar
  compostRatio: real('compost_ratio'), // Percentage of compost
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Biochar Products - Finished product batches
// ============================================

export const biocharProducts = pgTable('biochar_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(), // e.g., "BP-2025-043"
  facilityId: uuid('facility_id')
    .notNull()
    .references(() => facilities.id),
  productionDate: timestamp('production_date'),
  status: biocharProductStatus('status').default('testing').notNull(),

  // --- Composition Details ---
  formulationId: uuid('formulation_id').references(() => formulations.id),
  biocharSourceStorageId: uuid('biochar_source_storage_id').references(
    () => storageLocations.id
  ),
  linkedProductionRunId: uuid('linked_production_run_id').references(
    () => productionRuns.id
  ),
  biocharAmountKg: real('biochar_amount_kg'),
  biocharPerM3Kg: real('biochar_per_m3_kg'),
  compostWeightKg: real('compost_weight_kg'),
  compostPerM3Kg: real('compost_per_m3_kg'),

  // --- Overall Product Details ---
  totalWeightKg: real('total_weight_kg'),
  totalVolumeLiters: real('total_volume_liters'),
  densityKgL: real('density_kg_l'), // Calculated
  storageLocationId: uuid('storage_location_id').references(
    () => storageLocations.id
  ),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Relations
// ============================================

export const formulationsRelations = relations(formulations, ({ many }) => ({
  biocharProducts: many(biocharProducts),
}));

export const biocharProductsRelations = relations(
  biocharProducts,
  ({ one }) => ({
    facility: one(facilities, {
      fields: [biocharProducts.facilityId],
      references: [facilities.id],
    }),
    formulation: one(formulations, {
      fields: [biocharProducts.formulationId],
      references: [formulations.id],
    }),
    biocharSourceStorage: one(storageLocations, {
      fields: [biocharProducts.biocharSourceStorageId],
      references: [storageLocations.id],
      relationName: 'biocharSource',
    }),
    linkedProductionRun: one(productionRuns, {
      fields: [biocharProducts.linkedProductionRunId],
      references: [productionRuns.id],
    }),
    storageLocation: one(storageLocations, {
      fields: [biocharProducts.storageLocationId],
      references: [storageLocations.id],
      relationName: 'productStorage',
    }),
  })
);
