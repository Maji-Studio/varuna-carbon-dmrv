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
  status: string;
  reporting_period_start: string;
  reporting_period_end: string;
  net_removal_tonnes_co2e: number;
}

export interface Removal {
  id: string;
  project_id: string;
  ghg_statement_id?: string;
  status: string;
  net_removal_tonnes_co2e: number;
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
