import { pgTable, text, timestamp, uuid, real } from 'drizzle-orm/pg-core';

// ============================================
// Suppliers - Biomass/feedstock suppliers
// ============================================

export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  location: text('location'),
  gpsLat: real('gps_lat'),
  gpsLng: real('gps_lng'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Customers - Biochar product buyers/farmers
// ============================================

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  location: text('location'),
  gpsLat: real('gps_lat'),
  gpsLng: real('gps_lng'),
  distanceKm: real('distance_km'), // Distance from facility
  cropType: text('crop_type'), // e.g., "Coffee"
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Drivers - Transport drivers
// ============================================

export const drivers = pgTable('drivers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  contact: text('contact'), // Phone number
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Operators - Production/reactor operators
// ============================================

export const operators = pgTable('operators', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
