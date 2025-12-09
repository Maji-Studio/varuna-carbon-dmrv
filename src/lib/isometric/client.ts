/**
 * Isometric API Client
 *
 * Handles authenticated requests to both Isometric Registry and Certify APIs.
 * Authentication requires both a client secret and access token.
 *
 * @see https://docs.isometric.com/api-reference/authentication
 */

import { serverEnv } from '@/config/env.server';
import type {
  IsometricConfig,
  IsometricEnvironment,
  IsometricRequestOptions,
  PaginatedResponse,
  Organisation,
  Supplier,
  Project,
  CreditBatch,
  Issuance,
  Delivery,
  Retirement,
  CertifyOrganisation,
  CertifyProject,
  GHGStatement,
  Removal,
  Component,
  Datapoint,
  Source,
  FeedstockType,
  RemovalTemplate,
  RemovalTemplateSummary,
  RemovalTemplateComponentInput,
} from './types';

/** Cursor-based pagination params */
export interface PaginationParams {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
  [key: string]: string | number | boolean | undefined;
}

const API_BASE_URLS = {
  registry: {
    sandbox: 'https://api.sandbox.isometric.com/registry/v0',
    production: 'https://api.isometric.com/registry/v0',
  },
  certify: {
    sandbox: 'https://api.sandbox.isometric.com/mrv/v0',
    production: 'https://api.isometric.com/mrv/v0',
  },
} as const;

export class IsometricApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'IsometricApiError';
  }
}

/**
 * Isometric API Client
 *
 * Provides methods to interact with both Registry and Certify APIs.
 * Handles authentication headers automatically.
 */
export class IsometricClient {
  private clientSecret: string;
  private accessToken: string;
  private environment: IsometricEnvironment;

  constructor(config?: Partial<IsometricConfig>) {
    this.clientSecret = config?.clientSecret ?? serverEnv.ISOMETRIC_CLIENT_SECRET;
    this.accessToken = config?.accessToken ?? serverEnv.ISOMETRIC_ACCESS_TOKEN;
    this.environment = config?.environment ?? serverEnv.ISOMETRIC_ENVIRONMENT;
  }

  /**
   * Get the base URL for an API
   */
  private getBaseUrl(api: 'registry' | 'certify'): string {
    return API_BASE_URLS[api][this.environment];
  }

  /**
   * Build headers with authentication
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-Client-Secret': this.clientSecret,
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  /**
   * Make an authenticated request to the Isometric API
   */
  private async request<T>(
    api: 'registry' | 'certify',
    path: string,
    options: IsometricRequestOptions = {}
  ): Promise<T> {
    const { method = 'GET', body, params } = options;
    const baseUrl = this.getBaseUrl(api);

    // Build URL with query params
    const url = new URL(`${baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method,
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new IsometricApiError(
        response.status,
        errorBody.message || `Request failed with status ${response.status}`,
        errorBody
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // ============================================
  // REGISTRY API - Organization & Supplier
  // ============================================

  /**
   * Get the currently authenticated organisation
   */
  async getOrganisation(): Promise<Organisation> {
    return this.request<Organisation>('registry', '/organisation');
  }

  /**
   * Get a specific organisation by ID
   */
  async getOrganisationById(id: string): Promise<Organisation> {
    return this.request<Organisation>('registry', `/organisations/${id}`);
  }

  /**
   * Get the currently authenticated supplier
   */
  async getSupplier(): Promise<Supplier> {
    return this.request<Supplier>('registry', '/supplier');
  }

  /**
   * Get a specific supplier by ID
   */
  async getSupplierById(id: string): Promise<Supplier> {
    return this.request<Supplier>('registry', `/suppliers/${id}`);
  }

  // ============================================
  // REGISTRY API - Projects
  // ============================================

  /**
   * List all projects on the registry (cursor-based pagination)
   */
  async listProjects(params?: PaginationParams): Promise<PaginatedResponse<Project>> {
    return this.request<PaginatedResponse<Project>>('registry', '/projects', { params });
  }

  /**
   * Get a specific project by ID
   */
  async getProject(id: string): Promise<Project> {
    return this.request<Project>('registry', `/projects/${id}`);
  }

  // ============================================
  // REGISTRY API - Credit Batches & Issuances
  // ============================================

  /**
   * Get a specific credit batch by ID
   */
  async getCreditBatch(id: string): Promise<CreditBatch> {
    return this.request<CreditBatch>('registry', `/credit_batches/${id}`);
  }

  /**
   * List issuances (cursor-based pagination)
   */
  async listIssuances(params?: PaginationParams): Promise<PaginatedResponse<Issuance>> {
    return this.request<PaginatedResponse<Issuance>>('registry', '/issuances', { params });
  }

  /**
   * Get a specific issuance by ID
   */
  async getIssuance(id: string): Promise<Issuance> {
    return this.request<Issuance>('registry', `/issuances/${id}`);
  }

  /**
   * Get credit batches for an issuance
   */
  async getIssuanceCreditBatches(issuanceId: string): Promise<CreditBatch[]> {
    return this.request<CreditBatch[]>('registry', `/issuances/${issuanceId}/credit_batches`);
  }

  // ============================================
  // REGISTRY API - Deliveries
  // ============================================

  /**
   * List all deliveries (cursor-based pagination)
   */
  async listDeliveries(params?: PaginationParams): Promise<PaginatedResponse<Delivery>> {
    return this.request<PaginatedResponse<Delivery>>('registry', '/deliveries', { params });
  }

  /**
   * Create a delivery against an order
   */
  async createDelivery(data: {
    order_id: string;
    credit_batch_ids: string[];
  }): Promise<Delivery> {
    return this.request<Delivery>('registry', '/deliveries', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Get a specific delivery by ID
   */
  async getDelivery(id: string): Promise<Delivery> {
    return this.request<Delivery>('registry', `/deliveries/${id}`);
  }

  // ============================================
  // REGISTRY API - Retirements
  // ============================================

  /**
   * List all retirements (cursor-based pagination)
   */
  async listRetirements(params?: PaginationParams): Promise<PaginatedResponse<Retirement>> {
    return this.request<PaginatedResponse<Retirement>>('registry', '/retirements', { params });
  }

  /**
   * Retire credits from specific batches
   */
  async createRetirement(data: {
    credit_batch_ids: string[];
    retirement_reason: string;
    beneficiary_id?: string;
  }): Promise<Retirement> {
    return this.request<Retirement>('registry', '/retirements', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Retire oldest available credits from a supplier
   */
  async retireOldestCredits(data: {
    supplier_id: string;
    quantity: number;
    retirement_reason: string;
    vintage?: number;
    beneficiary_id?: string;
  }): Promise<Retirement> {
    return this.request<Retirement>('registry', '/retirements/from_oldest_credits', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Get a specific retirement by ID
   */
  async getRetirement(id: string): Promise<Retirement> {
    return this.request<Retirement>('registry', `/retirements/${id}`);
  }

  // ============================================
  // CERTIFY API - Organisation & Projects
  // ============================================

  /**
   * Get the currently authenticated organisation (Certify)
   */
  async getCertifyOrganisation(): Promise<CertifyOrganisation> {
    return this.request<CertifyOrganisation>('certify', '/organisation');
  }

  /**
   * List projects in Certify (cursor-based pagination)
   */
  async listCertifyProjects(params?: PaginationParams): Promise<PaginatedResponse<CertifyProject>> {
    return this.request<PaginatedResponse<CertifyProject>>('certify', '/projects', { params });
  }

  // ============================================
  // CERTIFY API - Feedstock Types
  // ============================================

  /**
   * List feedstock types (can only be created via Certify UI)
   */
  async listFeedstockTypes(
    params?: PaginationParams & { supplier_reference_id?: string }
  ): Promise<PaginatedResponse<FeedstockType>> {
    return this.request<PaginatedResponse<FeedstockType>>('certify', '/feedstock_types', { params });
  }

  /**
   * Get a specific feedstock type by ID
   */
  async getFeedstockType(id: string): Promise<FeedstockType> {
    return this.request<FeedstockType>('certify', `/feedstock_types/${id}`);
  }

  // ============================================
  // CERTIFY API - Removal Templates
  // ============================================

  /**
   * List removal templates for a project
   */
  async listRemovalTemplates(
    projectId: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<RemovalTemplateSummary>> {
    return this.request<PaginatedResponse<RemovalTemplateSummary>>(
      'certify',
      `/projects/${projectId}/removal_templates`,
      { params }
    );
  }

  /**
   * Get a specific removal template with full component/input details
   */
  async getRemovalTemplate(projectId: string, templateId: string): Promise<RemovalTemplate> {
    return this.request<RemovalTemplate>(
      'certify',
      `/projects/${projectId}/removal_templates/${templateId}`
    );
  }

  // ============================================
  // CERTIFY API - GHG Statements
  // ============================================

  /**
   * List GHG statements (cursor-based pagination)
   */
  async listGHGStatements(
    params?: PaginationParams & { project_id?: string }
  ): Promise<PaginatedResponse<GHGStatement>> {
    return this.request<PaginatedResponse<GHGStatement>>('certify', '/ghg_statements', { params });
  }

  /**
   * Create a GHG statement (submit removals for verification)
   */
  async createGHGStatement(data: {
    project_id: string;
    removal_ids: string[];
    reporting_period_start: string;
    reporting_period_end: string;
  }): Promise<GHGStatement> {
    return this.request<GHGStatement>('certify', '/ghg_statements', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Get a specific GHG statement
   */
  async getGHGStatement(id: string): Promise<GHGStatement> {
    return this.request<GHGStatement>('certify', `/ghg_statements/${id}`);
  }

  // ============================================
  // CERTIFY API - Removals
  // ============================================

  /**
   * List removals (cursor-based pagination)
   */
  async listRemovals(
    params?: PaginationParams & { project_id?: string }
  ): Promise<PaginatedResponse<Removal>> {
    return this.request<PaginatedResponse<Removal>>('certify', '/removals', { params });
  }

  /**
   * Create a removal with optional component data
   */
  async createRemoval(data: {
    project_id: string;
    removal_template_id: string;
    supplier_reference_id: string;
    started_on: string;
    completed_on: string;
    feedstock_type_id?: string;
    removal_template_components?: RemovalTemplateComponentInput[];
  }): Promise<Removal> {
    return this.request<Removal>('certify', '/removals', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Get a specific removal
   */
  async getRemoval(id: string): Promise<Removal> {
    return this.request<Removal>('certify', `/removals/${id}`);
  }

  /**
   * Update a removal
   */
  async updateRemoval(
    id: string,
    data: Partial<{
      reporting_period_start: string;
      reporting_period_end: string;
    }>
  ): Promise<Removal> {
    return this.request<Removal>('certify', `/removals/${id}`, {
      method: 'PATCH',
      body: data,
    });
  }

  /**
   * Delete a removal (must be in DRAFT status)
   */
  async deleteRemoval(id: string): Promise<void> {
    return this.request<void>('certify', `/removals/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // CERTIFY API - Components
  // ============================================

  /**
   * List components (cursor-based pagination)
   */
  async listComponents(
    params?: PaginationParams & { project_id?: string }
  ): Promise<PaginatedResponse<Component>> {
    return this.request<PaginatedResponse<Component>>('certify', '/components', { params });
  }

  /**
   * Create a component
   */
  async createComponent(data: {
    project_id: string;
    blueprint_key: string;
    name: string;
  }): Promise<Component> {
    return this.request<Component>('certify', '/components', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Get a specific component
   */
  async getComponent(id: string): Promise<Component> {
    return this.request<Component>('certify', `/components/${id}`);
  }

  // ============================================
  // CERTIFY API - Datapoints
  // ============================================

  /**
   * List datapoints (cursor-based pagination)
   */
  async listDatapoints(
    params?: PaginationParams & { component_id?: string }
  ): Promise<PaginatedResponse<Datapoint>> {
    return this.request<PaginatedResponse<Datapoint>>('certify', '/datapoints', { params });
  }

  /**
   * Create a datapoint
   */
  async createDatapoint(data: {
    component_id?: string;
    name: string;
    value: string | number;
    unit?: string;
    source_id?: string;
  }): Promise<Datapoint> {
    return this.request<Datapoint>('certify', '/datapoints', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Get a specific datapoint
   */
  async getDatapoint(id: string): Promise<Datapoint> {
    return this.request<Datapoint>('certify', `/datapoints/${id}`);
  }

  /**
   * Update a datapoint
   */
  async updateDatapoint(
    id: string,
    data: Partial<{
      value: string | number;
      unit: string;
      source_id: string;
    }>
  ): Promise<Datapoint> {
    return this.request<Datapoint>('certify', `/datapoints/${id}`, {
      method: 'PATCH',
      body: data,
    });
  }

  // ============================================
  // CERTIFY API - Sources (Document uploads)
  // ============================================

  /**
   * List sources (cursor-based pagination)
   */
  async listSources(params?: PaginationParams): Promise<PaginatedResponse<Source>> {
    return this.request<PaginatedResponse<Source>>('certify', '/sources', { params });
  }

  /**
   * Create a source (returns presigned upload URL)
   */
  async createSource(data: {
    name: string;
    type: string;
  }): Promise<Source & { upload_url: string }> {
    return this.request<Source & { upload_url: string }>('certify', '/sources', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Get a specific source
   */
  async getSource(id: string): Promise<Source> {
    return this.request<Source>('certify', `/sources/${id}`);
  }

  /**
   * Get private download URL for a source
   */
  async getSourcePrivateUrl(id: string): Promise<{ url: string }> {
    return this.request<{ url: string }>('certify', `/sources/${id}/private_url`);
  }
}

/**
 * Create a singleton instance using environment variables
 */
export const isometric = new IsometricClient();
