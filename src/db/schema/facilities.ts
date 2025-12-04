import { pgTable, text, timestamp, uuid, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { storageLocationType } from './common';

// ============================================
// Facilities - Production sites
// ============================================

export const facilities = pgTable('facilities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  location: text('location'),
  gpsLat: real('gps_lat'),
  gpsLng: real('gps_lng'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Reactors - Pyrolysis equipment
// ============================================

export const reactors = pgTable('reactors', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(), // e.g., "R-001"
  facilityId: uuid('facility_id')
    .notNull()
    .references(() => facilities.id),
  // Isometric Protocol: Reactor design requirements (Section 9.2)
  reactorType: text('reactor_type'), // fixed-bed, auger, rotary-kiln
  designSpecs: text('design_specs'), // JSON or description of design
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Storage Locations - Bins/piles for materials
// ============================================

export const storageLocations = pgTable('storage_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(), // e.g., "Bin 7", "Feedstock Pile 002"
  type: storageLocationType('type').notNull(),
  facilityId: uuid('facility_id')
    .notNull()
    .references(() => facilities.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Relations
// ============================================

export const facilitiesRelations = relations(facilities, ({ many }) => ({
  reactors: many(reactors),
  storageLocations: many(storageLocations),
}));

export const reactorsRelations = relations(reactors, ({ one }) => ({
  facility: one(facilities, {
    fields: [reactors.facilityId],
    references: [facilities.id],
  }),
}));

export const storageLocationsRelations = relations(
  storageLocations,
  ({ one }) => ({
    facility: one(facilities, {
      fields: [storageLocations.facilityId],
      references: [facilities.id],
    }),
  })
);
