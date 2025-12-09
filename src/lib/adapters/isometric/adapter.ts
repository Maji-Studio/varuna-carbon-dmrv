/**
 * Isometric Registry Adapter
 *
 * Implements the RegistryAdapter interface for syncing local DMRV data
 * to Isometric's Certify (MRV) and Registry APIs.
 *
 * This adapter handles:
 * - Transforming local data to Isometric format
 * - Creating/updating entities in Isometric
 * - Tracking sync status in local database
 * - Pulling back confirmation data from Isometric
 */

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  facilities,
  feedstockTypes,
  productionRuns,
  applications,
  creditBatches,
} from '@/db/schema';
import { isometric } from '@/lib/isometric';
import type { RegistryAdapter, SyncResult, AdapterConfig } from '../types';
import * as transformers from './transformers';

/**
 * Default configuration for the Isometric adapter
 */
const DEFAULT_CONFIG: AdapterConfig = {
  projectId: '', // Must be set via environment or constructor
  autoRetry: true,
  maxRetries: 3,
  retryDelayMs: 1000,
};

/**
 * Isometric Registry Adapter
 *
 * Syncs local biochar DMRV data to Isometric for carbon credit verification.
 */
export class IsometricAdapter implements RegistryAdapter {
  readonly name = 'isometric';
  private config: AdapterConfig;

  constructor(config?: Partial<AdapterConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      // Get project ID from environment if not provided
      projectId:
        config?.projectId || process.env.ISOMETRIC_PROJECT_ID || '',
    };

    if (!this.config.projectId) {
      console.warn(
        'IsometricAdapter: No project ID configured. Set ISOMETRIC_PROJECT_ID environment variable.'
      );
    }
  }

  // ============================================
  // Facility Sync
  // ============================================

  async syncFacility(facilityId: string): Promise<SyncResult> {
    try {
      // 1. Get local facility
      const facility = await db.query.facilities.findFirst({
        where: eq(facilities.id, facilityId),
      });

      if (!facility) {
        return { success: false, error: 'Facility not found' };
      }

      // 2. Skip if already synced
      if (facility.isometricFacilityId) {
        return {
          success: true,
          registryId: facility.isometricFacilityId,
          data: { alreadySynced: true },
        };
      }

      // 3. Validate
      const validation = transformers.validateFacilityForSync(facility);
      if (!validation.valid) {
        return { success: false, error: validation.errors.join('; ') };
      }

      // 4. Mark as syncing
      await db
        .update(facilities)
        .set({ syncStatus: 'syncing' })
        .where(eq(facilities.id, facilityId));

      // 5. Transform and send to Isometric
      const payload = transformers.transformFacilityToIsometric(facility);

      // Note: The Isometric client may need a createFacility method added
      // For now, we'll use a placeholder that shows the pattern
      // const result = await isometric.createFacility(payload);

      // TODO: Uncomment when createFacility is available in the client
      // For now, return a mock to demonstrate the pattern
      console.log('Would create facility in Isometric:', payload);
      const mockResult = { id: `fac_mock_${Date.now()}` };

      // 6. Update local record with Isometric ID
      await db
        .update(facilities)
        .set({
          isometricFacilityId: mockResult.id,
          syncStatus: 'synced',
          lastSyncedAt: new Date(),
          lastSyncError: null,
        })
        .where(eq(facilities.id, facilityId));

      return {
        success: true,
        registryId: mockResult.id,
        data: mockResult,
      };
    } catch (error) {
      // Record error for retry
      const errorMessage = error instanceof Error ? error.message : String(error);
      await db
        .update(facilities)
        .set({
          syncStatus: 'error',
          lastSyncError: errorMessage,
        })
        .where(eq(facilities.id, facilityId));

      return { success: false, error: errorMessage };
    }
  }

  // ============================================
  // Feedstock Type Sync
  // ============================================

  async syncFeedstockType(feedstockTypeId: string): Promise<SyncResult> {
    try {
      const feedstockType = await db.query.feedstockTypes.findFirst({
        where: eq(feedstockTypes.id, feedstockTypeId),
      });

      if (!feedstockType) {
        return { success: false, error: 'Feedstock type not found' };
      }

      if (feedstockType.isometricFeedstockTypeId) {
        return {
          success: true,
          registryId: feedstockType.isometricFeedstockTypeId,
          data: { alreadySynced: true },
        };
      }

      const validation = transformers.validateFeedstockTypeForSync(feedstockType);
      if (!validation.valid) {
        return { success: false, error: validation.errors.join('; ') };
      }

      await db
        .update(feedstockTypes)
        .set({ syncStatus: 'syncing' })
        .where(eq(feedstockTypes.id, feedstockTypeId));

      const payload = transformers.transformFeedstockTypeToIsometric(feedstockType);

      // TODO: Use actual API call when available
      console.log('Would create feedstock type in Isometric:', payload);
      const mockResult = { id: `fst_mock_${Date.now()}` };

      await db
        .update(feedstockTypes)
        .set({
          isometricFeedstockTypeId: mockResult.id,
          syncStatus: 'synced',
          lastSyncedAt: new Date(),
          lastSyncError: null,
        })
        .where(eq(feedstockTypes.id, feedstockTypeId));

      return {
        success: true,
        registryId: mockResult.id,
        data: mockResult,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await db
        .update(feedstockTypes)
        .set({
          syncStatus: 'error',
          lastSyncError: errorMessage,
        })
        .where(eq(feedstockTypes.id, feedstockTypeId));

      return { success: false, error: errorMessage };
    }
  }

  // ============================================
  // Production Batch Sync
  // ============================================

  async syncProductionBatch(productionRunId: string): Promise<SyncResult> {
    try {
      const productionRun = await db.query.productionRuns.findFirst({
        where: eq(productionRuns.id, productionRunId),
        with: {
          facility: true,
        },
      });

      if (!productionRun) {
        return { success: false, error: 'Production run not found' };
      }

      if (productionRun.isometricProductionBatchId) {
        return {
          success: true,
          registryId: productionRun.isometricProductionBatchId,
          data: { alreadySynced: true },
        };
      }

      const validation = transformers.validateProductionRunForSync(productionRun);
      if (!validation.valid) {
        return { success: false, error: validation.errors.join('; ') };
      }

      // Ensure facility is synced first
      if (!productionRun.facility?.isometricFacilityId) {
        const facilitySync = await this.syncFacility(productionRun.facilityId);
        if (!facilitySync.success) {
          return {
            success: false,
            error: `Failed to sync facility: ${facilitySync.error}`,
          };
        }
      }

      // Get the facility's Isometric ID (may have just been created)
      const updatedFacility = await db.query.facilities.findFirst({
        where: eq(facilities.id, productionRun.facilityId),
      });

      if (!updatedFacility?.isometricFacilityId) {
        return { success: false, error: 'Facility Isometric ID not found after sync' };
      }

      await db
        .update(productionRuns)
        .set({ syncStatus: 'syncing' })
        .where(eq(productionRuns.id, productionRunId));

      // TODO: Get feedstock type IDs (need to sync feedstock types first)
      const feedstockTypeIds: string[] = [];

      const payload = transformers.transformProductionRunToIsometric(
        productionRun,
        updatedFacility.isometricFacilityId,
        feedstockTypeIds
      );

      // TODO: Use actual API call when available
      console.log('Would create production batch in Isometric:', payload);
      const mockResult = { id: `pbd_mock_${Date.now()}` };

      await db
        .update(productionRuns)
        .set({
          isometricProductionBatchId: mockResult.id,
          syncStatus: 'synced',
          lastSyncedAt: new Date(),
          lastSyncError: null,
        })
        .where(eq(productionRuns.id, productionRunId));

      return {
        success: true,
        registryId: mockResult.id,
        data: mockResult,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await db
        .update(productionRuns)
        .set({
          syncStatus: 'error',
          lastSyncError: errorMessage,
        })
        .where(eq(productionRuns.id, productionRunId));

      return { success: false, error: errorMessage };
    }
  }

  // ============================================
  // Application Sync (StorageLocation + BiocharApplication)
  // ============================================

  async syncApplication(applicationId: string): Promise<SyncResult> {
    try {
      const application = await db.query.applications.findFirst({
        where: eq(applications.id, applicationId),
        with: {
          facility: true,
          delivery: true,
        },
      });

      if (!application) {
        return { success: false, error: 'Application not found' };
      }

      if (application.isometricBiocharApplicationId) {
        return {
          success: true,
          registryId: application.isometricBiocharApplicationId,
          data: { alreadySynced: true },
        };
      }

      const validation = transformers.validateApplicationForSync(application);
      if (!validation.valid) {
        return { success: false, error: validation.errors.join('; ') };
      }

      await db
        .update(applications)
        .set({ syncStatus: 'syncing' })
        .where(eq(applications.id, applicationId));

      // Step 1: Create StorageLocation if needed
      let storageLocationId = application.isometricStorageLocationId;
      if (!storageLocationId) {
        const storageLocationPayload = transformers.transformApplicationToStorageLocation(
          application,
          this.config.projectId
        );

        // TODO: Use actual API call
        console.log('Would create storage location in Isometric:', storageLocationPayload);
        storageLocationId = `sloc_mock_${Date.now()}`;

        // Update the storage location ID
        await db
          .update(applications)
          .set({ isometricStorageLocationId: storageLocationId })
          .where(eq(applications.id, applicationId));
      }

      // Step 2: Get production batch ID (need to trace back through delivery → order → product → production run)
      // For now, we'll use a placeholder - this needs the full chain of custody to be implemented
      const productionBatchId = 'pbd_placeholder';

      // Step 3: Create BiocharApplication
      const biocharApplicationPayload = transformers.transformApplicationToBiocharApplication(
        application,
        this.config.projectId,
        storageLocationId,
        productionBatchId
      );

      // TODO: Use actual API call
      console.log('Would create biochar application in Isometric:', biocharApplicationPayload);
      const mockResult = { id: `bapp_mock_${Date.now()}` };

      await db
        .update(applications)
        .set({
          isometricBiocharApplicationId: mockResult.id,
          syncStatus: 'synced',
          lastSyncedAt: new Date(),
          lastSyncError: null,
        })
        .where(eq(applications.id, applicationId));

      return {
        success: true,
        registryId: mockResult.id,
        data: {
          storageLocationId,
          biocharApplicationId: mockResult.id,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await db
        .update(applications)
        .set({
          syncStatus: 'error',
          lastSyncError: errorMessage,
        })
        .where(eq(applications.id, applicationId));

      return { success: false, error: errorMessage };
    }
  }

  // ============================================
  // GHG Statement Sync (Credit Batch → Removal + GHG Statement)
  // ============================================

  async syncGHGStatement(creditBatchId: string): Promise<SyncResult> {
    try {
      const creditBatch = await db.query.creditBatches.findFirst({
        where: eq(creditBatches.id, creditBatchId),
      });

      if (!creditBatch) {
        return { success: false, error: 'Credit batch not found' };
      }

      if (creditBatch.isometricGhgStatementId) {
        return {
          success: true,
          registryId: creditBatch.isometricGhgStatementId,
          data: { alreadySynced: true },
        };
      }

      const validation = transformers.validateCreditBatchForSync(creditBatch);
      if (!validation.valid) {
        return { success: false, error: validation.errors.join('; ') };
      }

      await db
        .update(creditBatches)
        .set({ syncStatus: 'syncing' })
        .where(eq(creditBatches.id, creditBatchId));

      // Step 1: Create GHG Statement
      const ghgStatementPayload = transformers.transformCreditBatchToGHGStatement(
        creditBatch,
        this.config.projectId
      );

      const ghgStatement = await isometric.createGHGStatement({
        project_id: this.config.projectId,
        removal_ids: [], // Will be populated after removals are created
        reporting_period_start: creditBatch.startDate?.toISOString().split('T')[0] || '',
        reporting_period_end: creditBatch.endDate?.toISOString().split('T')[0] || '',
      });

      await db
        .update(creditBatches)
        .set({
          isometricGhgStatementId: ghgStatement.id,
          syncStatus: 'synced',
          lastSyncedAt: new Date(),
          lastSyncError: null,
        })
        .where(eq(creditBatches.id, creditBatchId));

      return {
        success: true,
        registryId: ghgStatement.id,
        data: ghgStatement,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await db
        .update(creditBatches)
        .set({
          syncStatus: 'error',
          lastSyncError: errorMessage,
        })
        .where(eq(creditBatches.id, creditBatchId));

      return { success: false, error: errorMessage };
    }
  }

  // ============================================
  // Confirmation Methods
  // ============================================

  async confirmRemoval(registryRemovalId: string): Promise<SyncResult> {
    try {
      const removal = await isometric.getRemoval(registryRemovalId);
      return {
        success: true,
        registryId: removal.id,
        data: {
          co2eNetRemovedKg: removal.co2e_net_removed_kg,
          ghgStatementId: removal.ghg_statement_id,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async confirmGHGStatement(registryStatementId: string): Promise<SyncResult> {
    try {
      const statement = await isometric.getGHGStatement(registryStatementId);

      // Update local credit batch status based on Isometric status
      const localStatus = transformers.mapGHGStatementStatusToLocal(statement.status);

      // Find and update the local credit batch
      const localBatch = await db.query.creditBatches.findFirst({
        where: eq(creditBatches.isometricGhgStatementId, registryStatementId),
      });

      if (localBatch) {
        await db
          .update(creditBatches)
          .set({
            status: localStatus,
            lastSyncedAt: new Date(),
          })
          .where(eq(creditBatches.id, localBatch.id));
      }

      return {
        success: true,
        registryId: statement.id,
        data: {
          status: statement.status,
          localStatus,
          creditsIssuedAt: statement.credits_issued_at,
          totalCo2eRemovedKg: statement.pending_total_co2e_removed_kg,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }
}

/**
 * Singleton instance with default configuration
 */
export const isometricAdapter = new IsometricAdapter();
