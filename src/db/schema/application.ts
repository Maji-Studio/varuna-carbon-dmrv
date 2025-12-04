import {
  pgTable,
  text,
  timestamp,
  uuid,
  real,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  applicationStatus,
  applicationMethod,
  durabilityOption,
} from './common';
import { facilities } from './facilities';
import { deliveries } from './logistics';

// ============================================
// Applications - Field application of biochar to soil
// Isometric Protocol: Biochar Storage in Soil Environments Module v1.2
// Section 5: Durability of Biochar in Soils
// ============================================

export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(), // e.g., "AP-2025-043"
  facilityId: uuid('facility_id')
    .notNull()
    .references(() => facilities.id),
  applicationDate: timestamp('application_date'),
  status: applicationStatus('status').default('delivered').notNull(),

  // --- Linked Records ---
  deliveryId: uuid('delivery_id').references(() => deliveries.id),

  // --- Application Details (Isometric: Soil Storage Module) ---
  biocharAppliedTons: real('biochar_applied_tons'),
  biocharDryMatterTons: real('biochar_dry_matter_tons'),
  totalAppliedTons: real('total_applied_tons'), // Calculated

  // GPS coordinates (Isometric requirement for soil storage)
  gpsLat: real('gps_lat'),
  gpsLng: real('gps_lng'),

  // Field details
  fieldSizeHa: real('field_size_ha'),
  applicationMethodType: applicationMethod('application_method'), // manual/mechanical
  fieldIdentifier: text('field_identifier'), // Field name/parcel ID
  gisBoundaryReference: text('gis_boundary_reference'), // Link to GIS layer data

  // --- Durability Calculation (Isometric: Section 5.1) ---
  // Choose 200-year or 1000-year durability option
  durabilityOptionType: durabilityOption('durability_option'),

  // Soil temperature - required for F_durable calculation (200-year option)
  // Formula: F_durable,200 = min(0.95, 1 - [c + (a + b·ln(T_soil))·H/C_org])
  // Where: a=-0.383, b=0.350, c=-0.048
  soilTemperatureC: real('soil_temperature_c'), // Annual average
  soilTemperatureSource: text('soil_temperature_source'), // 'baseline' | 'global_database'

  // Calculated durability fraction
  fDurableCalculated: real('f_durable_calculated'),

  // CO2e stored calculation result
  co2eStoredTonnes: real('co2e_stored_tonnes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Soil Temperature Measurements - Baseline data for 200-year durability
// Isometric: SubRequirement G-QMBJ-0
// Requires at least 10 measurements per site-month for baseline
// ============================================

export const soilTemperatureMeasurements = pgTable(
  'soil_temperature_measurements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id),

    measurementDate: date('measurement_date').notNull(),
    temperatureC: real('temperature_c').notNull(),

    // Measurement method (ISO 4974 or equivalent)
    measurementMethod: text('measurement_method'),
    measurementDepthCm: real('measurement_depth_cm'),

    // Location within field
    measurementLat: real('measurement_lat'),
    measurementLng: real('measurement_lng'),

    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  }
);

// ============================================
// Relations
// ============================================

export const applicationsRelations = relations(
  applications,
  ({ one, many }) => ({
    facility: one(facilities, {
      fields: [applications.facilityId],
      references: [facilities.id],
    }),
    delivery: one(deliveries, {
      fields: [applications.deliveryId],
      references: [deliveries.id],
    }),
    soilTemperatureMeasurements: many(soilTemperatureMeasurements),
  })
);

export const soilTemperatureMeasurementsRelations = relations(
  soilTemperatureMeasurements,
  ({ one }) => ({
    application: one(applications, {
      fields: [soilTemperatureMeasurements.applicationId],
      references: [applications.id],
    }),
  })
);
