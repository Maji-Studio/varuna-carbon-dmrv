/**
 * Isometric Registry Adapter
 *
 * Public exports for the Isometric adapter module.
 *
 * Usage:
 * ```typescript
 * import { isometricAdapter, syncAllPending, retryAllFailed } from '@/lib/adapters/isometric';
 *
 * // Sync a single entity
 * const result = await isometricAdapter.syncFacility(facilityId);
 *
 * // Batch sync all pending entities
 * const stats = await syncAllPending();
 *
 * // Retry failed syncs
 * const retryStats = await retryAllFailed();
 * ```
 */

// Main adapter
export { IsometricAdapter, isometricAdapter } from './adapter';

// Sync orchestration
export {
  syncPendingFacilities,
  syncPendingFeedstockTypes,
  syncPendingProductionRuns,
  syncPendingApplications,
  syncPendingCreditBatches,
  syncAllPending,
  retryAllFailed,
  confirmGHGStatements,
  getSyncSummary,
  type SyncStats,
  type SyncOptions,
} from './sync';

// Transformers (for advanced use cases)
export * as transformers from './transformers';
