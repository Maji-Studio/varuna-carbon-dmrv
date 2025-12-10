import { pgTable, text, timestamp, uuid, real, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { feedstockStatus } from './common';
import { facilities, storageLocations } from './facilities';
import { suppliers, drivers } from './parties';

// ============================================
// Feedstock Deliveries - Incoming biomass shipments
// Tracks transport details separately from feedstock material info
// ============================================

export const feedstockDeliveries = pgTable('feedstock_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(), // e.g., "FD-2025-001"
  facilityId: uuid('facility_id')
    .notNull()
    .references(() => facilities.id),
  status: feedstockStatus('status').default('missing_data').notNull(),

  // --- Delivery Details ---
  deliveryDate: timestamp('delivery_date'),
  supplierId: uuid('supplier_id').references(() => suppliers.id),
  driverId: uuid('driver_id').references(() => drivers.id),
  vehicleType: text('vehicle_type'),
  fuelType: text('fuel_type'),
  fuelConsumedLiters: real('fuel_consumed_liters'),
  // Isometric: Transport emissions (calculated)
  transportEmissionsTco2e: real('transport_emissions_tco2e'),

  // --- Documentation ---
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Feedstock Types - Biomass classification
// ============================================

export const feedstockTypes = pgTable('feedstock_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(), // e.g., "Mixed Wood Chips", "Hardwood"

  // --- Isometric Registry Sync ---
  isometricFeedstockTypeId: text('isometric_feedstock_type_id'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Feedstocks - Incoming biomass batches
// Isometric Protocol: Biomass Feedstock Accounting Module
// ============================================

export const feedstocks = pgTable('feedstocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(), // e.g., "FS-2025-001"
  facilityId: uuid('facility_id')
    .notNull()
    .references(() => facilities.id),
  date: date('date').notNull(),
  status: feedstockStatus('status').default('missing_data').notNull(),

  // --- Delivery Reference ---
  feedstockDeliveryId: uuid('feedstock_delivery_id').references(
    () => feedstockDeliveries.id
  ),

  // --- Legacy Delivery Information (kept for backward compatibility) ---
  collectionDate: timestamp('collection_date'),
  deliveryDate: timestamp('delivery_date'),
  supplierId: uuid('supplier_id').references(() => suppliers.id),
  driverId: uuid('driver_id').references(() => drivers.id),
  vehicleType: text('vehicle_type'),
  fuelType: text('fuel_type'), // e.g., "Diesel"
  fuelConsumedLiters: real('fuel_consumed_liters'),
  // Isometric: Transport emissions (calculated)
  transportEmissionsTco2e: real('transport_emissions_tco2e'),

  // --- Feedstock Details ---
  feedstockTypeId: uuid('feedstock_type_id').references(() => feedstockTypes.id),
  weightKg: real('weight_kg'),
  moisturePercent: real('moisture_percent'),
  storageLocationId: uuid('storage_location_id').references(
    () => storageLocations.id
  ),

  // --- Documentation ---
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Relations
// ============================================

export const feedstockDeliveriesRelations = relations(
  feedstockDeliveries,
  ({ one, many }) => ({
    facility: one(facilities, {
      fields: [feedstockDeliveries.facilityId],
      references: [facilities.id],
    }),
    supplier: one(suppliers, {
      fields: [feedstockDeliveries.supplierId],
      references: [suppliers.id],
    }),
    driver: one(drivers, {
      fields: [feedstockDeliveries.driverId],
      references: [drivers.id],
    }),
    feedstocks: many(feedstocks),
  })
);

export const feedstockTypesRelations = relations(feedstockTypes, ({ many }) => ({
  feedstocks: many(feedstocks),
}));

export const feedstocksRelations = relations(feedstocks, ({ one }) => ({
  facility: one(facilities, {
    fields: [feedstocks.facilityId],
    references: [facilities.id],
  }),
  feedstockDelivery: one(feedstockDeliveries, {
    fields: [feedstocks.feedstockDeliveryId],
    references: [feedstockDeliveries.id],
  }),
  supplier: one(suppliers, {
    fields: [feedstocks.supplierId],
    references: [suppliers.id],
  }),
  driver: one(drivers, {
    fields: [feedstocks.driverId],
    references: [drivers.id],
  }),
  feedstockType: one(feedstockTypes, {
    fields: [feedstocks.feedstockTypeId],
    references: [feedstockTypes.id],
  }),
  storageLocation: one(storageLocations, {
    fields: [feedstocks.storageLocationId],
    references: [storageLocations.id],
  }),
}));
