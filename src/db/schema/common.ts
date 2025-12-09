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

// ============================================
// Isometric Protocol Enums
// ============================================

// Durability crediting options (Biochar Storage in Soil Environments Module v1.2)
// Section 5.1: Option 1 = 200-year, Option 2 = 1000-year
export const durabilityOption = pgEnum('durability_option', [
  '200_year', // Based on H:Corg ratio + soil temperature (Woolf et al., 2021)
  '1000_year', // Based on random reflectance R0 (Sanei et al., 2024)
]);

// Transport entity types for polymorphic transport tracking
export const transportEntityType = pgEnum('transport_entity_type', [
  'feedstock',
  'biochar',
  'sample',
  'delivery',
]);

// Transport methods (Transportation Emissions Accounting Module v1.1)
export const transportMethod = pgEnum('transport_method', [
  'road',
  'rail',
  'ship',
  'pipeline',
  'aircraft',
]);

// Emissions calculation method (Transportation Emissions Accounting Module v1.1)
// Section 3.2: Energy Usage Method (preferred), Section 3.3: Distance-Based Method
export const emissionsCalculationMethod = pgEnum('emissions_calculation_method', [
  'energy_usage', // Uses fuel consumption + emission factors
  'distance_based', // Uses distance + weight + emission factors
]);

