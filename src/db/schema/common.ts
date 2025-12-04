import { pgEnum } from 'drizzle-orm/pg-core';

// ============================================
// Status Enums (Chain of Custody)
// ============================================

export const feedstockStatus = pgEnum('feedstock_status', [
  'missing_data',
  'complete',
]);

export const productionRunStatus = pgEnum('production_run_status', [
  'running',
  'complete',
]);

export const biocharProductStatus = pgEnum('biochar_product_status', [
  'testing',
  'ready',
]);

export const orderStatus = pgEnum('order_status', ['ordered', 'processed']);

export const deliveryStatus = pgEnum('delivery_status', [
  'processing',
  'delivered',
]);

export const applicationStatus = pgEnum('application_status', [
  'delivered',
  'applied',
]);

export const creditBatchStatus = pgEnum('credit_batch_status', [
  'pending',
  'verified',
  'issued',
]);

// ============================================
// Type Enums
// ============================================

export const storageLocationType = pgEnum('storage_location_type', [
  'feedstock_bin',
  'feedstock_pile',
  'biochar_pile',
  'product_pile',
]);

export const packagingType = pgEnum('packaging_type', ['loose', 'bagged']);

export const applicationMethod = pgEnum('application_method', [
  'manual',
  'mechanical',
]);

export const documentationType = pgEnum('documentation_type', [
  'photo',
  'video',
  'pdf',
]);

// Entity types for polymorphic documentation
export const documentationEntityType = pgEnum('documentation_entity_type', [
  'feedstock',
  'production_run',
  'sample',
  'incident_report',
  'biochar_product',
  'order',
  'delivery',
  'application',
  'credit_batch',
]);
