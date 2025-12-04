import { pgTable, text, timestamp, uuid, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { applicationStatus, applicationMethod } from './common';
import { facilities } from './facilities';
import { deliveries } from './logistics';

// ============================================
// Applications - Field application of biochar to soil
// Isometric Protocol: Biochar Storage in Soil Environments Module v1.2
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

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Relations
// ============================================

export const applicationsRelations = relations(applications, ({ one }) => ({
  facility: one(facilities, {
    fields: [applications.facilityId],
    references: [facilities.id],
  }),
  delivery: one(deliveries, {
    fields: [applications.deliveryId],
    references: [deliveries.id],
  }),
}));
