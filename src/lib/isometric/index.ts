/**
 * Isometric API Integration
 *
 * This module provides:
 * 1. API client for Isometric Registry and Certify (MRV) APIs
 * 2. Sync functions to push local DMRV data to Isometric
 * 3. Data transformers for converting local data to Isometric format
 *
 * @example
 * ```typescript
 * import { isometric, syncFacility, syncCreditBatch } from '@/lib/isometric';
 *
 * // Direct API calls
 * const org = await isometric.getOrganisation();
 * const projects = await isometric.listProjects();
 *
 * // Sync local data to Isometric
 * const result = await syncFacility(facilityId);
 * if (result.success) {
 *   console.log('Synced to Isometric:', result.isometricId);
 * }
 * ```
 *
 * @see https://docs.isometric.com/api-reference/authentication
 */

// API Client
export { IsometricClient, IsometricApiError, isometric } from './client';
export * from './types';

// Sync functions
export {
  syncFacility,
  syncFeedstockType,
  syncProductionRun,
  syncApplication,
  syncCreditBatch,
  confirmGHGStatement,
  type SyncResult,
} from './adapter';

// Transformers (for advanced use cases)
export * as transformers from './transformers';
