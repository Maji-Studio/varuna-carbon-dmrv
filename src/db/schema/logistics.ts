import { pgTable, text, timestamp, uuid, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orderStatus, deliveryStatus, packagingType } from './common';
import { facilities, storageLocations } from './facilities';
import { customers, drivers } from './parties';
import { formulations, biocharProducts } from './products';

// ============================================
// Orders - Customer orders for biochar products
// ============================================

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(), // e.g., "OR-2025-043"
  facilityId: uuid('facility_id')
    .notNull()
    .references(() => facilities.id),
  orderDate: timestamp('order_date'),
  status: orderStatus('status').default('ordered').notNull(),

  // --- Customer Details ---
  customerId: uuid('customer_id').references(() => customers.id),
  invoiceNumber: text('invoice_number'), // e.g., "24-0009"

  // --- Order Details ---
  formulationId: uuid('formulation_id').references(() => formulations.id),
  quantityTons: real('quantity_tons'),
  quantityM3: real('quantity_m3'),
  biocharTons: real('biochar_tons'),
  packaging: packagingType('packaging'),
  valueTzs: real('value_tzs'), // Value in Tanzanian Shillings

  // --- Application Details ---
  applicationStatus: text('application_status'), // e.g., "In preparation"
  bulkDensityKgL: real('bulk_density_kg_l'),
  cSinkType: text('c_sink_type'), // e.g., "Geo localised C Sink"
  compostPerM3Percent: real('compost_per_m3_percent'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Deliveries - Delivery of biochar products
// Isometric Protocol: Transport emissions tracking
// ============================================

export const deliveries = pgTable('deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(), // e.g., "DL-2025-043"
  facilityId: uuid('facility_id')
    .notNull()
    .references(() => facilities.id),
  deliveryDate: timestamp('delivery_date'),
  status: deliveryStatus('status').default('processing').notNull(),

  // --- Linked Order ---
  orderId: uuid('order_id').references(() => orders.id),

  // --- Product Batch ---
  biocharProductId: uuid('biochar_product_id').references(
    () => biocharProducts.id
  ),
  storageLocationId: uuid('storage_location_id').references(
    () => storageLocations.id
  ),
  quantityTons: real('quantity_tons'),
  quantityM3: real('quantity_m3'),
  biocharTons: real('biochar_tons'),
  fixedCarbonPercent: real('fixed_carbon_percent'),

  // --- Delivery Details (Isometric: Transportation Emissions) ---
  driverId: uuid('driver_id').references(() => drivers.id),
  vehicleType: text('vehicle_type'), // e.g., "Truck"
  fuelType: text('fuel_type'), // e.g., "Diesel"
  fuelConsumedLiters: real('fuel_consumed_liters'),
  distanceKm: real('distance_km'),
  // Isometric: Transport emissions (calculated)
  emissionsTco2e: real('emissions_tco2e'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Relations
// ============================================

export const ordersRelations = relations(orders, ({ one, many }) => ({
  facility: one(facilities, {
    fields: [orders.facilityId],
    references: [facilities.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  formulation: one(formulations, {
    fields: [orders.formulationId],
    references: [formulations.id],
  }),
  deliveries: many(deliveries),
}));

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  facility: one(facilities, {
    fields: [deliveries.facilityId],
    references: [facilities.id],
  }),
  order: one(orders, {
    fields: [deliveries.orderId],
    references: [orders.id],
  }),
  biocharProduct: one(biocharProducts, {
    fields: [deliveries.biocharProductId],
    references: [biocharProducts.id],
  }),
  storageLocation: one(storageLocations, {
    fields: [deliveries.storageLocationId],
    references: [storageLocations.id],
  }),
  driver: one(drivers, {
    fields: [deliveries.driverId],
    references: [drivers.id],
  }),
}));
