/**
 * Isometric Registry Sync
 *
 * Simple sync functions for syncing local DMRV data to Isometric's Certify API.
 *
 * Usage:
 *   import { syncFacility, syncCreditBatch } from '@/lib/adapters';
 *
 *   // Manual sync
 *   const result = await syncFacility(facilityId);
 *   if (result.success) {
 *     console.log('Synced:', result.isometricId);
 *   }
 */

export {
  syncFacility,
  syncFeedstockType,
  syncProductionRun,
  syncApplication,
  syncCreditBatch,
  confirmGHGStatement,
  type SyncResult,
} from './isometric/adapter';
