/**
 * Isometric API Types
 * Based on actual API responses from Isometric Registry and Certify APIs
 */

export type IsometricEnvironment = 'sandbox' | 'production';

export interface IsometricConfig {
  clientSecret: string;
  accessToken: string;
  environment: IsometricEnvironment;
}

export interface IsometricRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

// Cursor-based pagination (used by Isometric)
export interface PageInfo {
  has_previous_page: boolean;
  start_cursor: string;
  has_next_page: boolean;
  end_cursor: string;
}

export interface PaginatedResponse<T> {
  nodes: T[];
  total_count: number;
  page_info: PageInfo;
}

// Location
export interface Location {
  country_code: string;
  country_name: string;
  latitude: number;
  longitude: number;
  description: string | null;
}

// Credit totals
export interface CreditTotals {
  credits: number;
  credit_kgs: number;
}

// ============================================
// Registry API Types
// ============================================

export interface Organisation {
  id: string;
  name: string;
  domain: string | null;
}

export interface Supplier {
  id: string;
  short_description: string;
  long_description: string;
  organisation: Organisation;
  location: Location | null;
}

export interface Project {
  id: string;
  name: string;
  supplier: Supplier;
  status: 'preview' | 'under_validation' | 'validated' | 'verified';
  short_code: string;
  url: string;
  process_key: string;
  pathway: string;
  protocol_slug: string;
  country_code: string;
  validator_name: string | null;
  current_verifier_name: string | null;
  crediting_period_start: string | null;
  crediting_period_end: string | null;
  issued_credits_total: CreditTotals;
  retired_credits_total: CreditTotals;
  issued_buffer_pool_credits_total: CreditTotals;
  retired_buffer_pool_credits_total: CreditTotals;
  location: Location | null;
}

export interface CreditBatch {
  id: string;
  project_id: string;
  supplier_id: string;
  issuance_id: string;
  vintage: number;
  quantity: number;
  status: 'ACTIVE' | 'RETIRED' | 'SPLIT' | 'TRANSFERRED';
  durability_option: '200_YEAR' | '1000_YEAR';
}

export interface Issuance {
  id: string;
  supplier_id: string;
  project_id: string;
  issued_at: string;
  quantity: number;
}

export interface Delivery {
  id: string;
  order_id: string;
  supplier_id: string;
  buyer_id: string;
  quantity: number;
  delivered_at: string;
}

export interface Retirement {
  id: string;
  organisation_id: string;
  beneficiary_id?: string;
  quantity: number;
  retired_at: string;
  retirement_reason: string;
}

export interface Transfer {
  id: string;
  from_organisation_id: string;
  to_organisation_id: string;
  quantity: number;
  transferred_at: string;
}

// ============================================
// Certify API Types
// ============================================

export interface CertifyOrganisation {
  id: string;
  name: string;
}

export interface CertifyProject {
  id: string;
  name: string;
  country_code: string;
  process_key: string;
  description: string;
  short_description: string;
  risk_of_reversal: 'very_low' | 'low' | 'medium' | 'high';
}

export interface GHGStatement {
  id: string;
  project_id: string;
  status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED';
  verifier: string | null;
  removal_ids: string[];
  ghg_statement_report_url: string | null;
  submitted_at: string | null;
  credits_issued_at: string | null;
  pending_total_co2e_removed_kg: number | null;
}

export interface CreateGHGStatementRequest {
  project_id: string;
  end_on: string; // Only end_on is required
}

export interface Removal {
  id: string;
  supplier_reference_id: string | null;
  started_on: string;
  completed_on: string;
  co2e_net_removed_kg: number;
  co2e_net_removed_without_discount_kg: number;
  co2e_net_removed_standard_deviation_kg: number | null;
  ghg_statement_id: string | null;
  feedstock_type_id: string | null;
  label_ids: string[];
}

export interface CreateRemovalRequest {
  project_id: string;
  removal_template_id?: string;
  supplier_reference_id: string;
  started_on: string; // date format YYYY-MM-DD
  completed_on: string; // date format YYYY-MM-DD
  feedstock_type_id?: string;
  label_ids?: string[];
  removal_template_components?: RemovalTemplateComponentInputs[];
}

export interface Component {
  id: string;
  project_id: string;
  blueprint_key: string;
  name: string;
}

export interface Datapoint {
  id: string;
  component_id?: string;
  name: string;
  value: string | number;
  unit?: string;
}

export interface Source {
  id: string;
  name: string;
  type: string;
  upload_url?: string;
}

// ============================================
// Certify API - Biochar-specific Types
// ============================================

export type StorageMethod =
  | 'biochar_field'
  | 'biochar_landfill'
  | 'biomass_injection_well'
  | 'biomass_subsurface'
  | 'saline_aquifer';

export interface ScalarQuantity {
  magnitude: number;
  unit: string;
  standard_deviation?: number | null;
}

export interface FeedstockType {
  id: string;
  name: string;
  supplier_reference_id: string | null;
}

export interface CreateFeedstockTypeRequest {
  name: string;
  supplier_reference_id?: string;
}

export interface StorageLocation {
  id: string;
  name: string;
  project_id: string;
  supplier_id: string;
  storage_method: StorageMethod;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  supplier_reference_id?: string | null;
}

export interface CreateStorageLocationRequest {
  project_id: string;
  name: string;
  latitude: number;
  longitude: number;
  storage_method?: StorageMethod;
  description?: string;
  supplier_reference_id?: string;
}

export interface BiocharApplication {
  id: string;
  storage_location_id: string;
  production_batch_id: string;
  removal_id: string | null;
  supplier_reference_id: string | null;
  application_date: string;
  uploaded_at: string;
  truck_mass_on_arrival: ScalarQuantity;
  truck_mass_on_departure: ScalarQuantity;
  average_application_rate: ScalarQuantity;
}

export interface CreateBiocharApplicationRequest {
  project_id: string;
  storage_site_id: string; // Note: API uses storage_site_id, not storage_location_id
  production_batch_id: string;
  application_date: string; // YYYY-MM-DD format
  truck_mass_on_arrival: ScalarQuantity;
  truck_mass_on_departure: ScalarQuantity;
  average_application_rate: ScalarQuantity;
  supplier_reference_id: string;
}

export interface ProductionBatch {
  id: string;
  facility_id: string;
  feedstock_type_ids: string[];
  supplier_reference_id: string | null;
  kind: 'BIOCHAR' | 'BIO_OIL' | 'BIOMASS';
  started_at: string;
  ended_at: string;
  uploaded_at: string;
  display_name: string;
  mass: ScalarQuantity;
}

export interface CreateProductionBatchRequest {
  facility_id: string;
  feedstock_type_ids: string[];
  kind: 'BIOCHAR' | 'BIO_OIL' | 'BIOMASS';
  started_at: string;
  ended_at: string;
  display_name: string;
  mass: ScalarQuantity;
  supplier_reference_id?: string;
}

export interface Facility {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  supplier_reference_id?: string | null;
}

// ============================================
// Removal Template Types
// ============================================

/** Summary returned when listing templates */
export interface RemovalTemplateSummary {
  id: string;
  display_name: string;
  supplier_reference_id: string | null;
  project_id: string;
}

/** Input definition within a template component */
export interface RemovalTemplateInput {
  input_key: string;
  datapoint_id: string | null;
  display_name: string;
  type: 'fixed' | 'monitored';
  quantity_kind: string;
}

/** Component within a template group */
export interface RemovalTemplateComponent {
  id: string;
  display_name: string;
  description: string | null;
  blueprint_key: string;
  removal_template_id: string;
  removal_template_component_group_id: string;
  inputs: RemovalTemplateInput[];
}

/** Group of components within a template */
export interface RemovalTemplateGroup {
  id: string;
  key: string;
  display_name: string;
  description: string;
  components: RemovalTemplateComponent[];
}

/** Full removal template with all groups and components */
export interface RemovalTemplate {
  id: string;
  display_name: string;
  supplier_reference_id: string | null;
  project_id: string;
  groups: RemovalTemplateGroup[];
}

// ============================================
// Removal Template Component Input Types (for creating removals)
// ============================================

/** Scalar input value for a component */
export interface ComponentScalarInput {
  input_key: string;
  value: {
    magnitude: number;
    unit: string;
    standard_deviation?: number | null;
  };
}

/** List input value for a component (multiple values) */
export interface ComponentListInput {
  input_key: string;
  values: Array<{
    magnitude: number;
    unit: string;
    standard_deviation?: number | null;
  }>;
}

export type ComponentInputValue = ComponentScalarInput | ComponentListInput;

/** Input for a single component when creating a removal */
export interface RemovalTemplateComponentInput {
  removal_template_component_id: string;
  inputs: ComponentInputValue[];
}

// Legacy types for backward compatibility
export interface CreateComponentScalarInput {
  __typename?: 'CreateComponentScalarInput';
  input_key: string;
  datapoint_id: string;
}

export interface CreateComponentListInput {
  __typename?: 'CreateComponentListInput';
  input_key: string;
  datapoint_ids: string[];
}

export type ComponentInput = CreateComponentScalarInput | CreateComponentListInput;

export interface RemovalTemplateComponentInputs {
  removal_template_component_id: string;
  inputs: ComponentInput[];
}
