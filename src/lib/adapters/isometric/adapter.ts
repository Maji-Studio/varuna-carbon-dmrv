/**
 * Isometric Registry Adapter
 *
 * Implements the RegistryAdapter interface for syncing local DMRV data
 * to Isometric's Certify (MRV) and Registry APIs.
 *
 * This adapter handles:
 * - Transforming local data to Isometric format
 * - Creating/updating entities in Isometric
 * - Tracking sync status via registry_identities table
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
import {
  getOrCreateRegistryIdentity,
  getExternalId,
  markSyncing,
  markSynced,
  markError,
} from '../registry-identity-service';

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
 * Uses registry_identities table for tracking sync state.
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

      // 2. Check if already synced via registry_identities
      const existingId = await getExternalId(
        'facility',
        facilityId,
        'isometric',
        'facility'
      );

      if (existingId) {
        return {
          success: true,
          registryId: existingId,
          data: { alreadySynced: true },
        };
      }

      // 3. Validate
      const validation = transformers.validateFacilityForSync(facility);
      if (!validation.valid) {
        return { success: false, error: validation.errors.join('; ') };
      }

      // 4. Get or create registry identity and mark as syncing
      const identity = await getOrCreateRegistryIdentity(
        'facility',
        facilityId,
        'isometric',
        'facility'
      );
      await markSyncing(identity.id);

      // 5. Transform and send to Isometric
      const payload = transformers.transformFacilityToIsometric(facility);

      // Note: The Isometric client may need a createFacility method added
      // For now, we'll use a placeholder that shows the pattern
      // const result = await isometric.createFacility(payload);

      // TODO: Uncomment when createFacility is available in the client
      console.log('Would create facility in Isometric:', payload);
      const mockResult = { id: `fac_mock_${Date.now()}` };

      // 6. Update registry identity with Isometric ID
      await markSynced(identity.id, mockResult.id, {
        projectId: this.config.projectId,
      });

      return {
        success: true,
        registryId: mockResult.id,
        data: mockResult,
      };
    } catch (error) {
      // Record error in registry identity
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const identity = await getOrCreateRegistryIdentity(
        'facility',
        facilityId,
        'isometric',
        'facility'
      );
      await markError(identity.id, errorMessage);

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

      // Check if already synced
      const existingId = await getExternalId(
        'feedstock_type',
        feedstockTypeId,
        'isometric',
        'feedstock_type'
      );

      if (existingId) {
        return {
          success: true,
          registryId: existingId,
          data: { alreadySynced: true },
        };
      }

      const validation =
        transformers.validateFeedstockTypeForSync(feedstockType);
      if (!validation.valid) {
        return { success: false, error: validation.errors.join('; ') };
      }

      const identity = await getOrCreateRegistryIdentity(
        'feedstock_type',
        feedstockTypeId,
        'isometric',
        'feedstock_type'
      );
      await markSyncing(identity.id);

      const payload =
        transformers.transformFeedstockTypeToIsometric(feedstockType);

      // TODO: Use actual API call when available
      console.log('Would create feedstock type in Isometric:', payload);
      const mockResult = { id: `fst_mock_${Date.now()}` };

      await markSynced(identity.id, mockResult.id);

      return {
        success: true,
        registryId: mockResult.id,
        data: mockResult,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const identity = await getOrCreateRegistryIdentity(
        'feedstock_type',
        feedstockTypeId,
        'isometric',
        'feedstock_type'
      );
      await markError(identity.id, errorMessage);

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

      // Check if already synced
      const existingId = await getExternalId(
        'production_run',
        productionRunId,
        'isometric',
        'production_batch'
      );

      if (existingId) {
        return {
          success: true,
          registryId: existingId,
          data: { alreadySynced: true },
        };
      }

      const validation =
        transformers.validateProductionRunForSync(productionRun);
      if (!validation.valid) {
        return { success: false, error: validation.errors.join('; ') };
      }

      // Ensure facility is synced first
      const facilityExternalId = await getExternalId(
        'facility',
        productionRun.facilityId,
        'isometric',
        'facility'
      );

      if (!facilityExternalId) {
        const facilitySync = await this.syncFacility(productionRun.facilityId);
        if (!facilitySync.success) {
          return {
            success: false,
            error: `Failed to sync facility: ${facilitySync.error}`,
          };
        }
      }

      // Get the facility's Isometric ID (may have just been created)
      const updatedFacilityId = await getExternalId(
        'facility',
        productionRun.facilityId,
        'isometric',
        'facility'
      );

      if (!updatedFacilityId) {
        return {
          success: false,
          error: 'Facility Isometric ID not found after sync',
        };
      }

      const identity = await getOrCreateRegistryIdentity(
        'production_run',
        productionRunId,
        'isometric',
        'production_batch'
      );
      await markSyncing(identity.id);

      // TODO: Get feedstock type IDs (need to sync feedstock types first)
      const feedstockTypeIds: string[] = [];

      const payload = transformers.transformProductionRunToIsometric(
        productionRun,
        updatedFacilityId,
        feedstockTypeIds
      );

      // TODO: Use actual API call when available
      console.log('Would create production batch in Isometric:', payload);
      const mockResult = { id: `pbd_mock_${Date.now()}` };

      await markSynced(identity.id, mockResult.id, {
        facilityExternalId: updatedFacilityId,
      });

      return {
        success: true,
        registryId: mockResult.id,
        data: mockResult,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const identity = await getOrCreateRegistryIdentity(
        'production_run',
        productionRunId,
        'isometric',
        'production_batch'
      );
      await markError(identity.id, errorMessage);

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

      // Check if fully synced (biochar_application is the final step)
      const existingBiocharAppId = await getExternalId(
        'application',
        applicationId,
        'isometric',
        'biochar_application'
      );

      if (existingBiocharAppId) {
        return {
          success: true,
          registryId: existingBiocharAppId,
          data: { alreadySynced: true },
        };
      }

      const validation = transformers.validateApplicationForSync(application);
      if (!validation.valid) {
        return { success: false, error: validation.errors.join('; ') };
      }

      // Step 1: Create StorageLocation if needed
      let storageLocationId = await getExternalId(
        'application',
        applicationId,
        'isometric',
        'storage_location'
      );

      if (!storageLocationId) {
        const storageIdentity = await getOrCreateRegistryIdentity(
          'application',
          applicationId,
          'isometric',
          'storage_location'
        );
        await markSyncing(storageIdentity.id);

        const storageLocationPayload =
          transformers.transformApplicationToStorageLocation(
            application,
            this.config.projectId
          );

        // TODO: Use actual API call
        console.log(
          'Would create storage location in Isometric:',
          storageLocationPayload
        );
        storageLocationId = `sloc_mock_${Date.now()}`;

        await markSynced(storageIdentity.id, storageLocationId);
      }

      // Step 2: Get production batch ID (need to trace back through delivery → order → product → production run)
      // For now, we'll use a placeholder - this needs the full chain of custody to be implemented
      const productionBatchId = 'pbd_placeholder';

      // Step 3: Create BiocharApplication
      const biocharIdentity = await getOrCreateRegistryIdentity(
        'application',
        applicationId,
        'isometric',
        'biochar_application'
      );
      await markSyncing(biocharIdentity.id);

      const biocharApplicationPayload =
        transformers.transformApplicationToBiocharApplication(
          application,
          this.config.projectId,
          storageLocationId,
          productionBatchId
        );

      // TODO: Use actual API call
      console.log(
        'Would create biochar application in Isometric:',
        biocharApplicationPayload
      );
      const mockResult = { id: `bapp_mock_${Date.now()}` };

      await markSynced(biocharIdentity.id, mockResult.id, {
        storageLocationId,
        productionBatchId,
      });

      return {
        success: true,
        registryId: mockResult.id,
        data: {
          storageLocationId,
          biocharApplicationId: mockResult.id,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Mark the step that failed (biochar_application is likely the one that failed)
      const biocharIdentity = await getOrCreateRegistryIdentity(
        'application',
        applicationId,
        'isometric',
        'biochar_application'
      );
      await markError(biocharIdentity.id, errorMessage);

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

      // Check if GHG statement already synced
      const existingGhgId = await getExternalId(
        'credit_batch',
        creditBatchId,
        'isometric',
        'ghg_statement'
      );

      if (existingGhgId) {
        return {
          success: true,
          registryId: existingGhgId,
          data: { alreadySynced: true },
        };
      }

      const validation = transformers.validateCreditBatchForSync(creditBatch);
      if (!validation.valid) {
        return { success: false, error: validation.errors.join('; ') };
      }

      // Step 1: Create Removal if needed (TODO: implement removal creation)
      // For now, we skip to GHG statement

      // Step 2: Create GHG Statement
      const ghgIdentity = await getOrCreateRegistryIdentity(
        'credit_batch',
        creditBatchId,
        'isometric',
        'ghg_statement'
      );
      await markSyncing(ghgIdentity.id);

      const ghgStatementPayload = transformers.transformCreditBatchToGHGStatement(
        creditBatch,
        this.config.projectId
      );

      const ghgStatement = await isometric.createGHGStatement({
        project_id: this.config.projectId,
        removal_ids: [], // Will be populated after removals are created
        reporting_period_start:
          creditBatch.startDate?.toISOString().split('T')[0] || '',
        reporting_period_end:
          creditBatch.endDate?.toISOString().split('T')[0] || '',
      });

      await markSynced(ghgIdentity.id, ghgStatement.id, {
        projectId: this.config.projectId,
      });

      return {
        success: true,
        registryId: ghgStatement.id,
        data: ghgStatement,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const ghgIdentity = await getOrCreateRegistryIdentity(
        'credit_batch',
        creditBatchId,
        'isometric',
        'ghg_statement'
      );
      await markError(ghgIdentity.id, errorMessage);

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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async confirmGHGStatement(registryStatementId: string): Promise<SyncResult> {
    try {
      const statement = await isometric.getGHGStatement(registryStatementId);

      // Update local credit batch status based on Isometric status
      const localStatus = transformers.mapGHGStatementStatusToLocal(
        statement.status
      );

      // Find the local credit batch via registry identity
      const { registryIdentities } = await import('@/db/schema');
      const identity = await db.query.registryIdentities.findFirst({
        where: eq(registryIdentities.externalId, registryStatementId),
      });

      if (identity) {
        await db
          .update(creditBatches)
          .set({
            status: localStatus,
          })
          .where(eq(creditBatches.id, identity.entityId));
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }
}

/**
 * Singleton instance with default configuration
 */
export const isometricAdapter = new IsometricAdapter();
