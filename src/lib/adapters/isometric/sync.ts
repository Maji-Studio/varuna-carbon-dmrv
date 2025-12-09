/**
 * Isometric Sync Orchestration
 *
 * Handles batch syncing of entities to Isometric and retry logic for failed syncs.
 * This module is designed to be called by:
 * - Cron jobs / scheduled tasks for batch processing
 * - Manual trigger for retry operations
 * - Event handlers for real-time sync
 */

import { eq, and, or, lt, isNull } from 'drizzle-orm';
import { db } from '@/db';
import {
  facilities,
  feedstockTypes,
  productionRuns,
  applications,
  creditBatches,
} from '@/db/schema';
import { isometricAdapter } from './adapter';
import type { SyncResult } from '../types';

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
 * Sync all pending facilities to Isometric
 */
export async function syncPendingFacilities(
  options: SyncOptions = {}
): Promise<SyncStats> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const stats: SyncStats = { total: 0, succeeded: 0, failed: 0, skipped: 0, errors: [] };

  const statusFilter = opts.includeErrors
    ? or(eq(facilities.syncStatus, 'pending'), eq(facilities.syncStatus, 'error'))
    : eq(facilities.syncStatus, 'pending');

  const pendingFacilities = await db.query.facilities.findMany({
    where: statusFilter,
    limit: opts.limit,
  });

  stats.total = pendingFacilities.length;

  for (const facility of pendingFacilities) {
    try {
      const result = await isometricAdapter.syncFacility(facility.id);
      if (result.success) {
        stats.succeeded++;
      } else {
        stats.failed++;
        stats.errors.push({ id: facility.id, error: result.error || 'Unknown error' });
        if (!opts.continueOnError) break;
      }
    } catch (error) {
      stats.failed++;
      stats.errors.push({
        id: facility.id,
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

  const statusFilter = opts.includeErrors
    ? or(eq(feedstockTypes.syncStatus, 'pending'), eq(feedstockTypes.syncStatus, 'error'))
    : eq(feedstockTypes.syncStatus, 'pending');

  const pendingTypes = await db.query.feedstockTypes.findMany({
    where: statusFilter,
    limit: opts.limit,
  });

  stats.total = pendingTypes.length;

  for (const feedstockType of pendingTypes) {
    try {
      const result = await isometricAdapter.syncFeedstockType(feedstockType.id);
      if (result.success) {
        stats.succeeded++;
      } else {
        stats.failed++;
        stats.errors.push({ id: feedstockType.id, error: result.error || 'Unknown error' });
        if (!opts.continueOnError) break;
      }
    } catch (error) {
      stats.failed++;
      stats.errors.push({
        id: feedstockType.id,
        error: error instanceof Error ? error.message : String(error),
      });
      if (!opts.continueOnError) break;
    }
  }

  return stats;
}

/**
 * Sync all pending production runs to Isometric
 *
 * Note: Only syncs production runs with status 'complete'
 */
export async function syncPendingProductionRuns(
  options: SyncOptions = {}
): Promise<SyncStats> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const stats: SyncStats = { total: 0, succeeded: 0, failed: 0, skipped: 0, errors: [] };

  const statusFilter = opts.includeErrors
    ? or(eq(productionRuns.syncStatus, 'pending'), eq(productionRuns.syncStatus, 'error'))
    : eq(productionRuns.syncStatus, 'pending');

  const pendingRuns = await db.query.productionRuns.findMany({
    where: and(statusFilter, eq(productionRuns.status, 'complete')),
    limit: opts.limit,
  });

  stats.total = pendingRuns.length;

  for (const run of pendingRuns) {
    try {
      const result = await isometricAdapter.syncProductionBatch(run.id);
      if (result.success) {
        stats.succeeded++;
      } else {
        stats.failed++;
        stats.errors.push({ id: run.id, error: result.error || 'Unknown error' });
        if (!opts.continueOnError) break;
      }
    } catch (error) {
      stats.failed++;
      stats.errors.push({
        id: run.id,
        error: error instanceof Error ? error.message : String(error),
      });
      if (!opts.continueOnError) break;
    }
  }

  return stats;
}

/**
 * Sync all pending applications to Isometric
 *
 * Note: Only syncs applications with status 'applied'
 */
export async function syncPendingApplications(
  options: SyncOptions = {}
): Promise<SyncStats> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const stats: SyncStats = { total: 0, succeeded: 0, failed: 0, skipped: 0, errors: [] };

  const statusFilter = opts.includeErrors
    ? or(eq(applications.syncStatus, 'pending'), eq(applications.syncStatus, 'error'))
    : eq(applications.syncStatus, 'pending');

  const pendingApps = await db.query.applications.findMany({
    where: and(statusFilter, eq(applications.status, 'applied')),
    limit: opts.limit,
  });

  stats.total = pendingApps.length;

  for (const app of pendingApps) {
    try {
      const result = await isometricAdapter.syncApplication(app.id);
      if (result.success) {
        stats.succeeded++;
      } else {
        stats.failed++;
        stats.errors.push({ id: app.id, error: result.error || 'Unknown error' });
        if (!opts.continueOnError) break;
      }
    } catch (error) {
      stats.failed++;
      stats.errors.push({
        id: app.id,
        error: error instanceof Error ? error.message : String(error),
      });
      if (!opts.continueOnError) break;
    }
  }

  return stats;
}

/**
 * Sync all pending credit batches to Isometric as GHG Statements
 *
 * Note: Only syncs credit batches with status 'pending'
 */
export async function syncPendingCreditBatches(
  options: SyncOptions = {}
): Promise<SyncStats> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const stats: SyncStats = { total: 0, succeeded: 0, failed: 0, skipped: 0, errors: [] };

  const statusFilter = opts.includeErrors
    ? or(eq(creditBatches.syncStatus, 'pending'), eq(creditBatches.syncStatus, 'error'))
    : eq(creditBatches.syncStatus, 'pending');

  const pendingBatches = await db.query.creditBatches.findMany({
    where: and(statusFilter, eq(creditBatches.status, 'pending')),
    limit: opts.limit,
  });

  stats.total = pendingBatches.length;

  for (const batch of pendingBatches) {
    try {
      const result = await isometricAdapter.syncGHGStatement(batch.id);
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
 *
 * Pulls back verification status and updates local records
 */
export async function confirmGHGStatements(
  options: SyncOptions = {}
): Promise<SyncStats> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const stats: SyncStats = { total: 0, succeeded: 0, failed: 0, skipped: 0, errors: [] };

  // Find credit batches that have been synced but not yet issued
  const syncedBatches = await db.query.creditBatches.findMany({
    where: and(
      eq(creditBatches.syncStatus, 'synced'),
      or(eq(creditBatches.status, 'pending'), eq(creditBatches.status, 'verified'))
    ),
    limit: opts.limit,
  });

  stats.total = syncedBatches.length;

  for (const batch of syncedBatches) {
    if (!batch.isometricGhgStatementId) {
      stats.skipped++;
      continue;
    }

    try {
      const result = await isometricAdapter.confirmGHGStatement(
        batch.isometricGhgStatementId
      );
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
 */
export async function getSyncSummary(): Promise<{
  facilities: { pending: number; syncing: number; synced: number; error: number };
  feedstockTypes: { pending: number; syncing: number; synced: number; error: number };
  productionRuns: { pending: number; syncing: number; synced: number; error: number };
  applications: { pending: number; syncing: number; synced: number; error: number };
  creditBatches: { pending: number; syncing: number; synced: number; error: number };
}> {
  const countByStatus = async (table: typeof facilities) => {
    const all = await db.query.facilities.findMany();
    return {
      pending: all.filter((r) => r.syncStatus === 'pending').length,
      syncing: all.filter((r) => r.syncStatus === 'syncing').length,
      synced: all.filter((r) => r.syncStatus === 'synced').length,
      error: all.filter((r) => r.syncStatus === 'error').length,
    };
  };

  // Note: This is a simplified implementation. For production, use proper COUNT queries.
  const facilitiesData = await db.query.facilities.findMany();
  const feedstockData = await db.query.feedstockTypes.findMany();
  const productionData = await db.query.productionRuns.findMany();
  const applicationData = await db.query.applications.findMany();
  const creditData = await db.query.creditBatches.findMany();

  const countStatus = (data: Array<{ syncStatus: string | null }>) => ({
    pending: data.filter((r) => r.syncStatus === 'pending').length,
    syncing: data.filter((r) => r.syncStatus === 'syncing').length,
    synced: data.filter((r) => r.syncStatus === 'synced').length,
    error: data.filter((r) => r.syncStatus === 'error').length,
  });

  return {
    facilities: countStatus(facilitiesData),
    feedstockTypes: countStatus(feedstockData),
    productionRuns: countStatus(productionData),
    applications: countStatus(applicationData),
    creditBatches: countStatus(creditData),
  };
}
