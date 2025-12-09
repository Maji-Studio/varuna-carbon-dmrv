/**
 * Isometric Sync Orchestration
 *
 * Handles batch syncing of entities to Isometric and retry logic for failed syncs.
 * Uses registry_identities table for tracking sync state.
 *
 * This module is designed to be called by:
 * - Cron jobs / scheduled tasks for batch processing
 * - Manual trigger for retry operations
 * - Event handlers for real-time sync
 */

import { eq, and, or } from 'drizzle-orm';
import { db } from '@/db';
import {
  facilities,
  feedstockTypes,
  productionRuns,
  applications,
  creditBatches,
  registryIdentities,
} from '@/db/schema';
import { isometricAdapter } from './adapter';
import { getExternalId } from '../registry-identity-service';

/**
 * Sync statistics returned by batch operations
 */
export interface SyncStats {
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: Array<{ id: string; error: string }>;
}

/**
 * Options for sync operations
 */
export interface SyncOptions {
  /** Maximum number of entities to process in one batch */
  limit?: number;
  /** Whether to continue on errors or stop at first failure */
  continueOnError?: boolean;
  /** Retry entities that previously failed */
  includeErrors?: boolean;
}

const DEFAULT_OPTIONS: SyncOptions = {
  limit: 100,
  continueOnError: true,
  includeErrors: false,
};

/**
 * Find entities that need syncing by checking registry_identities table
 */
async function findEntitiesNeedingSync(
  entityType: string,
  externalEntityType: string,
  entityIds: string[],
  options: SyncOptions
): Promise<string[]> {
  const needsSync: string[] = [];

  for (const entityId of entityIds) {
    // Check if this entity has a registry identity for Isometric
    const identity = await db.query.registryIdentities.findFirst({
      where: and(
        eq(registryIdentities.entityType, entityType),
        eq(registryIdentities.entityId, entityId),
        eq(registryIdentities.registryName, 'isometric'),
        eq(registryIdentities.externalEntityType, externalEntityType)
      ),
    });

    if (!identity) {
      // No identity exists - needs sync
      needsSync.push(entityId);
    } else if (identity.syncStatus === 'pending') {
      needsSync.push(entityId);
    } else if (options.includeErrors && identity.syncStatus === 'error') {
      needsSync.push(entityId);
    }
    // If synced, skip it
  }

  return needsSync.slice(0, options.limit);
}

/**
 * Sync all pending facilities to Isometric
 */
export async function syncPendingFacilities(
  options: SyncOptions = {}
): Promise<SyncStats> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const stats: SyncStats = { total: 0, succeeded: 0, failed: 0, skipped: 0, errors: [] };

  // Get all facilities
  const allFacilities = await db.query.facilities.findMany({
    limit: opts.limit! * 2, // Get more than needed for filtering
  });

  // Find which ones need syncing
  const needsSync = await findEntitiesNeedingSync(
    'facility',
    'facility',
    allFacilities.map((f) => f.id),
    opts
  );

  stats.total = needsSync.length;

  for (const facilityId of needsSync) {
    try {
      const result = await isometricAdapter.syncFacility(facilityId);
      if (result.success) {
        stats.succeeded++;
      } else {
        stats.failed++;
        stats.errors.push({ id: facilityId, error: result.error || 'Unknown error' });
        if (!opts.continueOnError) break;
      }
    } catch (error) {
      stats.failed++;
      stats.errors.push({
        id: facilityId,
        error: error instanceof Error ? error.message : String(error),
      });
      if (!opts.continueOnError) break;
    }
  }

  return stats;
}

/**
 * Sync all pending feedstock types to Isometric
 */
export async function syncPendingFeedstockTypes(
  options: SyncOptions = {}
): Promise<SyncStats> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const stats: SyncStats = { total: 0, succeeded: 0, failed: 0, skipped: 0, errors: [] };

  const allTypes = await db.query.feedstockTypes.findMany({
    limit: opts.limit! * 2,
  });

  const needsSync = await findEntitiesNeedingSync(
    'feedstock_type',
    'feedstock_type',
    allTypes.map((t) => t.id),
    opts
  );

  stats.total = needsSync.length;

  for (const typeId of needsSync) {
    try {
      const result = await isometricAdapter.syncFeedstockType(typeId);
      if (result.success) {
        stats.succeeded++;
      } else {
        stats.failed++;
        stats.errors.push({ id: typeId, error: result.error || 'Unknown error' });
        if (!opts.continueOnError) break;
      }
    } catch (error) {
      stats.failed++;
      stats.errors.push({
        id: typeId,
        error: error instanceof Error ? error.message : String(error),
      });
      if (!opts.continueOnError) break;
    }
  }

  return stats;
}

/**
 * Sync all pending production runs to Isometric
 * Note: Only syncs production runs with status 'complete'
 */
export async function syncPendingProductionRuns(
  options: SyncOptions = {}
): Promise<SyncStats> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const stats: SyncStats = { total: 0, succeeded: 0, failed: 0, skipped: 0, errors: [] };

  // Only get complete runs
  const completeRuns = await db.query.productionRuns.findMany({
    where: eq(productionRuns.status, 'complete'),
    limit: opts.limit! * 2,
  });

  const needsSync = await findEntitiesNeedingSync(
    'production_run',
    'production_batch',
    completeRuns.map((r) => r.id),
    opts
  );

  stats.total = needsSync.length;

  for (const runId of needsSync) {
    try {
      const result = await isometricAdapter.syncProductionBatch(runId);
      if (result.success) {
        stats.succeeded++;
      } else {
        stats.failed++;
        stats.errors.push({ id: runId, error: result.error || 'Unknown error' });
        if (!opts.continueOnError) break;
      }
    } catch (error) {
      stats.failed++;
      stats.errors.push({
        id: runId,
        error: error instanceof Error ? error.message : String(error),
      });
      if (!opts.continueOnError) break;
    }
  }

  return stats;
}

/**
 * Sync all pending applications to Isometric
 * Note: Only syncs applications with status 'applied'
 */
export async function syncPendingApplications(
  options: SyncOptions = {}
): Promise<SyncStats> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const stats: SyncStats = { total: 0, succeeded: 0, failed: 0, skipped: 0, errors: [] };

  // Only get applied applications
  const appliedApps = await db.query.applications.findMany({
    where: eq(applications.status, 'applied'),
    limit: opts.limit! * 2,
  });

  // For applications, check the biochar_application step (final step)
  const needsSync = await findEntitiesNeedingSync(
    'application',
    'biochar_application',
    appliedApps.map((a) => a.id),
    opts
  );

  stats.total = needsSync.length;

  for (const appId of needsSync) {
    try {
      const result = await isometricAdapter.syncApplication(appId);
      if (result.success) {
        stats.succeeded++;
      } else {
        stats.failed++;
        stats.errors.push({ id: appId, error: result.error || 'Unknown error' });
        if (!opts.continueOnError) break;
      }
    } catch (error) {
      stats.failed++;
      stats.errors.push({
        id: appId,
        error: error instanceof Error ? error.message : String(error),
      });
      if (!opts.continueOnError) break;
    }
  }

  return stats;
}

/**
 * Sync all pending credit batches to Isometric as GHG Statements
 * Note: Only syncs credit batches with status 'pending'
 */
export async function syncPendingCreditBatches(
  options: SyncOptions = {}
): Promise<SyncStats> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const stats: SyncStats = { total: 0, succeeded: 0, failed: 0, skipped: 0, errors: [] };

  // Only get pending batches
  const pendingBatches = await db.query.creditBatches.findMany({
    where: eq(creditBatches.status, 'pending'),
    limit: opts.limit! * 2,
  });

  // For credit batches, check the ghg_statement step (final step)
  const needsSync = await findEntitiesNeedingSync(
    'credit_batch',
    'ghg_statement',
    pendingBatches.map((b) => b.id),
    opts
  );

  stats.total = needsSync.length;

  for (const batchId of needsSync) {
    try {
      const result = await isometricAdapter.syncGHGStatement(batchId);
      if (result.success) {
        stats.succeeded++;
      } else {
        stats.failed++;
        stats.errors.push({ id: batchId, error: result.error || 'Unknown error' });
        if (!opts.continueOnError) break;
      }
    } catch (error) {
      stats.failed++;
      stats.errors.push({
        id: batchId,
        error: error instanceof Error ? error.message : String(error),
      });
      if (!opts.continueOnError) break;
    }
  }

  return stats;
}

/**
 * Sync all pending entities in dependency order
 *
 * Order: Facilities → Feedstock Types → Production Runs → Applications → Credit Batches
 */
export async function syncAllPending(options: SyncOptions = {}): Promise<{
  facilities: SyncStats;
  feedstockTypes: SyncStats;
  productionRuns: SyncStats;
  applications: SyncStats;
  creditBatches: SyncStats;
}> {
  return {
    facilities: await syncPendingFacilities(options),
    feedstockTypes: await syncPendingFeedstockTypes(options),
    productionRuns: await syncPendingProductionRuns(options),
    applications: await syncPendingApplications(options),
    creditBatches: await syncPendingCreditBatches(options),
  };
}

/**
 * Retry all failed syncs across all entity types
 */
export async function retryAllFailed(options: SyncOptions = {}): Promise<{
  facilities: SyncStats;
  feedstockTypes: SyncStats;
  productionRuns: SyncStats;
  applications: SyncStats;
  creditBatches: SyncStats;
}> {
  const retryOptions = { ...options, includeErrors: true };
  return syncAllPending(retryOptions);
}

/**
 * Confirm status of synced GHG Statements from Isometric
 * Pulls back verification status and updates local records
 */
export async function confirmGHGStatements(
  options: SyncOptions = {}
): Promise<SyncStats> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const stats: SyncStats = { total: 0, succeeded: 0, failed: 0, skipped: 0, errors: [] };

  // Find credit batches that have been synced but not yet issued
  const syncedBatches = await db.query.creditBatches.findMany({
    where: or(
      eq(creditBatches.status, 'pending'),
      eq(creditBatches.status, 'verified')
    ),
    limit: opts.limit,
  });

  // Filter to only those that have a GHG statement ID
  for (const batch of syncedBatches) {
    const ghgStatementId = await getExternalId(
      'credit_batch',
      batch.id,
      'isometric',
      'ghg_statement'
    );

    if (!ghgStatementId) {
      stats.skipped++;
      continue;
    }

    stats.total++;

    try {
      const result = await isometricAdapter.confirmGHGStatement(ghgStatementId);
      if (result.success) {
        stats.succeeded++;
      } else {
        stats.failed++;
        stats.errors.push({ id: batch.id, error: result.error || 'Unknown error' });
        if (!opts.continueOnError) break;
      }
    } catch (error) {
      stats.failed++;
      stats.errors.push({
        id: batch.id,
        error: error instanceof Error ? error.message : String(error),
      });
      if (!opts.continueOnError) break;
    }
  }

  return stats;
}

/**
 * Get summary of sync status across all entity types
 * Uses registry_identities table for accurate counts
 */
export async function getSyncSummary(): Promise<{
  facilities: { pending: number; syncing: number; synced: number; error: number };
  feedstockTypes: { pending: number; syncing: number; synced: number; error: number };
  productionRuns: { pending: number; syncing: number; synced: number; error: number };
  applications: { pending: number; syncing: number; synced: number; error: number };
  creditBatches: { pending: number; syncing: number; synced: number; error: number };
}> {
  const allIdentities = await db.query.registryIdentities.findMany({
    where: eq(registryIdentities.registryName, 'isometric'),
  });

  const countByStatus = (entityType: string) => {
    const filtered = allIdentities.filter((i) => i.entityType === entityType);
    return {
      pending: filtered.filter((i) => i.syncStatus === 'pending').length,
      syncing: filtered.filter((i) => i.syncStatus === 'syncing').length,
      synced: filtered.filter((i) => i.syncStatus === 'synced').length,
      error: filtered.filter((i) => i.syncStatus === 'error').length,
    };
  };

  return {
    facilities: countByStatus('facility'),
    feedstockTypes: countByStatus('feedstock_type'),
    productionRuns: countByStatus('production_run'),
    applications: countByStatus('application'),
    creditBatches: countByStatus('credit_batch'),
  };
}
