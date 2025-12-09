/**
 * Registry Adapter Types
 *
 * Registry-agnostic interfaces for syncing local DMRV data to external
 * carbon credit registries (Isometric, Puro.earth, Verra, etc.)
 *
 * The adapter pattern allows the same local data model to be synced to
 * multiple registries with different data structures and API formats.
 */

/**
 * Result of a sync operation
 */
export interface SyncResult<T = unknown> {
  /** Whether the sync was successful */
  success: boolean;
  /** The registry-assigned ID for the synced entity */
  registryId?: string;
  /** Additional data returned from the registry */
  data?: T;
  /** Error message if sync failed */
  error?: string;
  /** Error code if available */
  errorCode?: string;
}

/**
 * Sync status values (matches database enum)
 */
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

/**
 * Base interface for all registry adapters
 *
 * Each registry implementation should implement this interface to ensure
 * consistent sync behavior across different carbon credit registries.
 */
export interface RegistryAdapter {
  /** Registry name (e.g., 'isometric', 'puro', 'verra') */
  readonly name: string;

  // ============================================
  // Entity Sync Methods
  // ============================================

  /**
   * Sync a facility to the registry
   * Creates the facility if it doesn't exist, or updates if changed
   */
  syncFacility(facilityId: string): Promise<SyncResult>;

  /**
   * Sync a feedstock type to the registry
   */
  syncFeedstockType(feedstockTypeId: string): Promise<SyncResult>;

  /**
   * Sync a production batch/run to the registry
   * Should only sync when production run status is 'complete'
   */
  syncProductionBatch(productionRunId: string): Promise<SyncResult>;

  /**
   * Sync an application (field application) to the registry
   * In Isometric: Creates StorageLocation + BiocharApplication
   * Should only sync when application status is 'applied'
   */
  syncApplication(applicationId: string): Promise<SyncResult>;

  /**
   * Sync a credit batch as a GHG statement / removal claim to the registry
   * Should only sync when credit batch status is 'pending' or later
   */
  syncGHGStatement(creditBatchId: string): Promise<SyncResult>;

  // ============================================
  // Confirmation / Pull Methods
  // ============================================

  /**
   * Confirm a removal was accepted and get its status
   * Used to pull back confirmation data from the registry
   */
  confirmRemoval(registryRemovalId: string): Promise<SyncResult>;

  /**
   * Confirm a GHG statement status and get issued credit info
   * Used to pull back verification status and credit issuance data
   */
  confirmGHGStatement(registryStatementId: string): Promise<SyncResult>;
}

/**
 * Configuration for registry adapters
 */
export interface AdapterConfig {
  /** Project ID in the registry (e.g., Isometric project ID) */
  projectId: string;
  /** Whether to auto-retry failed syncs */
  autoRetry?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Delay between retries in milliseconds */
  retryDelayMs?: number;
}

/**
 * Sync event for logging/monitoring
 */
export interface SyncEvent {
  timestamp: Date;
  adapter: string;
  entityType: string;
  entityId: string;
  operation: 'sync' | 'confirm';
  result: SyncResult;
}
