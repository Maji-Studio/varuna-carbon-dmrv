/**
 * Isometric Registry Sync
 *
 * Simple functions to sync local DMRV data to Isometric's Certify API.
 * Each function checks if already synced, transforms data, calls API, stores ID.
 *
 * Usage:
 *   import { syncFacility } from '@/lib/adapters/isometric';
 *   const result = await syncFacility(facilityId);
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
import * as transformers from './transformers';

// ============================================
// Types
// ============================================

export interface SyncResult {
  success: boolean;
  isometricId?: string;
  error?: string;
  alreadySynced?: boolean;
}

// ============================================
// Sync Functions
// ============================================

/**
 * Sync a facility to Isometric
 */
export async function syncFacility(facilityId: string): Promise<SyncResult> {
  try {
    const facility = await db.query.facilities.findFirst({
      where: eq(facilities.id, facilityId),
    });

    if (!facility) {
      return { success: false, error: 'Facility not found' };
    }

    // Already synced?
    if (facility.isometricFacilityId) {
      return { success: true, isometricId: facility.isometricFacilityId, alreadySynced: true };
    }

    // Validate
    const validation = transformers.validateFacilityForSync(facility);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join('; ') };
    }

    // Transform and send
    const payload = transformers.transformFacilityToIsometric(facility);

    // TODO: Use actual API call when available
    // const result = await isometric.createFacility(payload);
    console.log('Would create facility in Isometric:', payload);
    const isometricId = `fac_${Date.now()}`;

    // Store Isometric ID
    await db.update(facilities)
      .set({ isometricFacilityId: isometricId })
      .where(eq(facilities.id, facilityId));

    return { success: true, isometricId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Sync a feedstock type to Isometric
 */
export async function syncFeedstockType(feedstockTypeId: string): Promise<SyncResult> {
  try {
    const feedstockType = await db.query.feedstockTypes.findFirst({
      where: eq(feedstockTypes.id, feedstockTypeId),
    });

    if (!feedstockType) {
      return { success: false, error: 'Feedstock type not found' };
    }

    if (feedstockType.isometricFeedstockTypeId) {
      return { success: true, isometricId: feedstockType.isometricFeedstockTypeId, alreadySynced: true };
    }

    const validation = transformers.validateFeedstockTypeForSync(feedstockType);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join('; ') };
    }

    const payload = transformers.transformFeedstockTypeToIsometric(feedstockType);

    // TODO: Use actual API call when available
    console.log('Would create feedstock type in Isometric:', payload);
    const isometricId = `fst_${Date.now()}`;

    await db.update(feedstockTypes)
      .set({ isometricFeedstockTypeId: isometricId })
      .where(eq(feedstockTypes.id, feedstockTypeId));

    return { success: true, isometricId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Sync a production run to Isometric as a ProductionBatch
 */
export async function syncProductionRun(productionRunId: string): Promise<SyncResult> {
  try {
    const productionRun = await db.query.productionRuns.findFirst({
      where: eq(productionRuns.id, productionRunId),
      with: { facility: true },
    });

    if (!productionRun) {
      return { success: false, error: 'Production run not found' };
    }

    if (productionRun.isometricProductionBatchId) {
      return { success: true, isometricId: productionRun.isometricProductionBatchId, alreadySynced: true };
    }

    const validation = transformers.validateProductionRunForSync(productionRun);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join('; ') };
    }

    // Ensure facility is synced first
    const facility = await db.query.facilities.findFirst({
      where: eq(facilities.id, productionRun.facilityId),
    });

    if (!facility?.isometricFacilityId) {
      const facilitySyncResult = await syncFacility(productionRun.facilityId);
      if (!facilitySyncResult.success) {
        return { success: false, error: `Failed to sync facility: ${facilitySyncResult.error}` };
      }
    }

    // Get updated facility with Isometric ID
    const updatedFacility = await db.query.facilities.findFirst({
      where: eq(facilities.id, productionRun.facilityId),
    });

    const payload = transformers.transformProductionRunToIsometric(
      productionRun,
      updatedFacility!.isometricFacilityId!,
      [] // feedstock type IDs - TODO: implement
    );

    // TODO: Use actual API call when available
    console.log('Would create production batch in Isometric:', payload);
    const isometricId = `pbd_${Date.now()}`;

    await db.update(productionRuns)
      .set({ isometricProductionBatchId: isometricId })
      .where(eq(productionRuns.id, productionRunId));

    return { success: true, isometricId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Sync an application to Isometric
 * Creates both StorageLocation and BiocharApplication in Isometric
 */
export async function syncApplication(applicationId: string): Promise<SyncResult> {
  try {
    const application = await db.query.applications.findFirst({
      where: eq(applications.id, applicationId),
      with: { facility: true, delivery: true },
    });

    if (!application) {
      return { success: false, error: 'Application not found' };
    }

    // If BiocharApplication is synced, we're done (it's the final step)
    if (application.isometricBiocharApplicationId) {
      return { success: true, isometricId: application.isometricBiocharApplicationId, alreadySynced: true };
    }

    const validation = transformers.validateApplicationForSync(application);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join('; ') };
    }

    const projectId = process.env.ISOMETRIC_PROJECT_ID || '';

    // Step 1: Create StorageLocation if needed
    let storageLocationId = application.isometricStorageLocationId;
    if (!storageLocationId) {
      const storagePayload = transformers.transformApplicationToStorageLocation(application, projectId);
      // TODO: Use actual API call when available
      console.log('Would create storage location in Isometric:', storagePayload);
      storageLocationId = `sloc_${Date.now()}`;

      await db.update(applications)
        .set({ isometricStorageLocationId: storageLocationId })
        .where(eq(applications.id, applicationId));
    }

    // Step 2: Create BiocharApplication
    // TODO: Get production batch ID from chain of custody
    const productionBatchId = 'pbd_placeholder';

    const biocharPayload = transformers.transformApplicationToBiocharApplication(
      application,
      projectId,
      storageLocationId,
      productionBatchId
    );

    // TODO: Use actual API call when available
    console.log('Would create biochar application in Isometric:', biocharPayload);
    const biocharApplicationId = `bapp_${Date.now()}`;

    await db.update(applications)
      .set({ isometricBiocharApplicationId: biocharApplicationId })
      .where(eq(applications.id, applicationId));

    return { success: true, isometricId: biocharApplicationId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Sync a credit batch to Isometric as Removal + GHGStatement
 */
export async function syncCreditBatch(creditBatchId: string): Promise<SyncResult> {
  try {
    const creditBatch = await db.query.creditBatches.findFirst({
      where: eq(creditBatches.id, creditBatchId),
    });

    if (!creditBatch) {
      return { success: false, error: 'Credit batch not found' };
    }

    // If GHG Statement is synced, we're done
    if (creditBatch.isometricGhgStatementId) {
      return { success: true, isometricId: creditBatch.isometricGhgStatementId, alreadySynced: true };
    }

    const validation = transformers.validateCreditBatchForSync(creditBatch);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join('; ') };
    }

    const projectId = process.env.ISOMETRIC_PROJECT_ID || '';
    const removalTemplateId = process.env.ISOMETRIC_REMOVAL_TEMPLATE_ID || '';

    // Step 1: Create Removal if needed
    let removalId = creditBatch.isometricRemovalId;
    if (!removalId) {
      const removalPayload = transformers.transformCreditBatchToRemoval(creditBatch, projectId, removalTemplateId);
      // TODO: Use actual API call when available
      console.log('Would create removal in Isometric:', removalPayload);
      removalId = `rem_${Date.now()}`;

      await db.update(creditBatches)
        .set({ isometricRemovalId: removalId })
        .where(eq(creditBatches.id, creditBatchId));
    }

    // Step 2: Create GHG Statement
    const ghgStatement = await isometric.createGHGStatement({
      project_id: projectId,
      removal_ids: [removalId],
      reporting_period_start: creditBatch.startDate?.toISOString().split('T')[0] || '',
      reporting_period_end: creditBatch.endDate?.toISOString().split('T')[0] || '',
    });

    await db.update(creditBatches)
      .set({ isometricGhgStatementId: ghgStatement.id })
      .where(eq(creditBatches.id, creditBatchId));

    return { success: true, isometricId: ghgStatement.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================
// Confirmation Functions (pull status from Isometric)
// ============================================

/**
 * Check status of a GHG Statement and update local credit batch
 */
export async function confirmGHGStatement(creditBatchId: string): Promise<SyncResult> {
  try {
    const creditBatch = await db.query.creditBatches.findFirst({
      where: eq(creditBatches.id, creditBatchId),
    });

    if (!creditBatch?.isometricGhgStatementId) {
      return { success: false, error: 'Credit batch not synced to Isometric' };
    }

    const statement = await isometric.getGHGStatement(creditBatch.isometricGhgStatementId);
    const localStatus = transformers.mapGHGStatementStatusToLocal(statement.status);

    await db.update(creditBatches)
      .set({ status: localStatus })
      .where(eq(creditBatches.id, creditBatchId));

    return {
      success: true,
      isometricId: statement.id,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
