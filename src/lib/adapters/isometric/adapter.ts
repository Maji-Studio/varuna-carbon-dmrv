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

import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  facilities,
  feedstockTypes,
  productionRuns,
  samples,
  applications,
  creditBatches,
  creditBatchApplications,
} from "@/db/schema";
import { isometric } from "@/lib/isometric";
import * as transformers from "./transformers";
import { serverEnv } from "@/config/env.server";

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
      return { success: false, error: "Facility not found" };
    }

    // Already synced?
    if (facility.isometricFacilityId) {
      return { success: true, isometricId: facility.isometricFacilityId, alreadySynced: true };
    }

    // Validate
    const validation = transformers.validateFacilityForSync(facility);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join("; ") };
    }

    // Transform and send
    const payload = transformers.transformFacilityToIsometric(facility);

    // TODO: Use actual API call when available
    // const result = await isometric.createFacility(payload);
    console.log("Would create facility in Isometric:", payload);
    const isometricId = `fac_${Date.now()}`;

    // Store Isometric ID
    await db.update(facilities).set({ isometricFacilityId: isometricId }).where(eq(facilities.id, facilityId));

    return { success: true, isometricId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Pull feedstock types from Isometric and match them with local feedstock types.
 *
 * Note: Feedstock types can ONLY be created via Certify UI, not via API.
 * This function pulls the list and matches by name to store Isometric IDs locally.
 *
 * @returns Summary of matched/unmatched feedstock types
 */
export async function pullFeedstockTypes(): Promise<{
  success: boolean;
  matched: number;
  unmatched: string[];
  error?: string;
}> {
  try {
    // Get all feedstock types from Isometric
    const response = await isometric.listFeedstockTypes({ first: 50 });
    const isometricTypes = response.nodes;

    if (isometricTypes.length === 0) {
      return {
        success: true,
        matched: 0,
        unmatched: [],
      };
    }

    // Get all local feedstock types
    const localTypes = await db.query.feedstockTypes.findMany();

    let matched = 0;
    const unmatched: string[] = [];

    // Match by name (case-insensitive)
    for (const localType of localTypes) {
      const match = isometricTypes.find((iso) => iso.name.toLowerCase() === localType.name.toLowerCase());

      if (match) {
        await db
          .update(feedstockTypes)
          .set({ isometricFeedstockTypeId: match.id })
          .where(eq(feedstockTypes.id, localType.id));
        matched++;
      } else {
        unmatched.push(localType.name);
      }
    }

    return {
      success: true,
      matched,
      unmatched,
    };
  } catch (error) {
    return {
      success: false,
      matched: 0,
      unmatched: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * @deprecated Use pullFeedstockTypes() instead - feedstock types cannot be created via API
 */
export async function syncFeedstockType(feedstockTypeId: string): Promise<SyncResult> {
  return {
    success: false,
    error:
      "Feedstock types cannot be created via API. Use pullFeedstockTypes() to match existing types from Isometric.",
  };
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
      return { success: false, error: "Production run not found" };
    }

    if (productionRun.isometricProductionBatchId) {
      return { success: true, isometricId: productionRun.isometricProductionBatchId, alreadySynced: true };
    }

    const validation = transformers.validateProductionRunForSync(productionRun);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join("; ") };
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
    console.log("Would create production batch in Isometric:", payload);
    const isometricId = `pbd_${Date.now()}`;

    await db
      .update(productionRuns)
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
      return { success: false, error: "Application not found" };
    }

    // If BiocharApplication is synced, we're done (it's the final step)
    if (application.isometricBiocharApplicationId) {
      return { success: true, isometricId: application.isometricBiocharApplicationId, alreadySynced: true };
    }

    const validation = transformers.validateApplicationForSync(application);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join("; ") };
    }

    const projectId = process.env.ISOMETRIC_PROJECT_ID || "";

    // Step 1: Create StorageLocation if needed
    let storageLocationId = application.isometricStorageLocationId;
    if (!storageLocationId) {
      const storagePayload = transformers.transformApplicationToStorageLocation(application, projectId);
      // TODO: Use actual API call when available
      console.log("Would create storage location in Isometric:", storagePayload);
      storageLocationId = `sloc_${Date.now()}`;

      await db
        .update(applications)
        .set({ isometricStorageLocationId: storageLocationId })
        .where(eq(applications.id, applicationId));
    }

    // Step 2: Create BiocharApplication
    // TODO: Get production batch ID from chain of custody
    const productionBatchId = "pbd_placeholder";

    const biocharPayload = transformers.transformApplicationToBiocharApplication(
      application,
      projectId,
      storageLocationId,
      productionBatchId
    );

    // TODO: Use actual API call when available
    console.log("Would create biochar application in Isometric:", biocharPayload);
    const biocharApplicationId = `bapp_${Date.now()}`;

    await db
      .update(applications)
      .set({ isometricBiocharApplicationId: biocharApplicationId })
      .where(eq(applications.id, applicationId));

    return { success: true, isometricId: biocharApplicationId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Sync a credit batch to Isometric as Removal + GHGStatement
 *
 * This function:
 * 1. Loads the credit batch with all related data (applications, production runs, samples)
 * 2. Fetches the removal template from Isometric
 * 3. Maps local data to template component inputs
 * 4. Creates a Removal with actual component data
 * 5. Creates a GHG Statement for verification
 */
export async function syncCreditBatch(creditBatchId: string): Promise<SyncResult> {
  try {
    // Step 1: Load credit batch with related data
    const creditBatch = await db.query.creditBatches.findFirst({
      where: eq(creditBatches.id, creditBatchId),
      with: {
        facility: true,
      },
    });

    if (!creditBatch) {
      return { success: false, error: "Credit batch not found" };
    }

    // If GHG Statement is synced, we're done
    if (creditBatch.isometricGhgStatementId) {
      return { success: true, isometricId: creditBatch.isometricGhgStatementId, alreadySynced: true };
    }

    const validation = transformers.validateCreditBatchForSync(creditBatch);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join("; ") };
    }

    const projectId = serverEnv.ISOMETRIC_PROJECT_ID;
    const removalTemplateId = serverEnv.ISOMETRIC_REMOVAL_TEMPLATE_ID;

    if (!projectId || !removalTemplateId) {
      return { success: false, error: "ISOMETRIC_PROJECT_ID and ISOMETRIC_REMOVAL_TEMPLATE_ID must be set" };
    }

    // Step 2: Load related data via FK chain traversal
    // Chain: CreditBatch → Application → Delivery → BiocharProduct → ProductionRun → Samples
    const batchApplications = await db.query.creditBatchApplications.findMany({
      where: eq(creditBatchApplications.creditBatchId, creditBatchId),
      with: {
        application: {
          with: {
            delivery: {
              with: {
                biocharProduct: {
                  with: {
                    linkedProductionRun: {
                      with: {
                        samples: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (batchApplications.length === 0) {
      return { success: false, error: "Credit batch has no linked applications" };
    }

    // Validate complete FK chain for each application
    const validApplications = [];
    for (const ba of batchApplications) {
      const app = ba.application;
      if (!app.delivery) {
        return { success: false, error: `Application ${app.code} is missing a delivery` };
      }
      if (!app.delivery.biocharProduct) {
        return { success: false, error: `Delivery ${app.delivery.code} is missing a biochar product` };
      }
      if (!app.delivery.biocharProduct.linkedProductionRun) {
        return { success: false, error: `Biochar product ${app.delivery.biocharProduct.code} is missing a linked production run` };
      }
      validApplications.push(ba);
    }

    const application = validApplications[0].application;

    // Extract unique production runs from FK chain
    // Type: non-null production run with samples (validated above)
    type ProductionRunWithSamples = NonNullable<
      NonNullable<
        NonNullable<typeof validApplications[0]["application"]["delivery"]>["biocharProduct"]
      >["linkedProductionRun"]
    >;
    const productionRunsMap = new Map<string, ProductionRunWithSamples>();
    for (const ba of validApplications) {
      const pr = ba.application.delivery!.biocharProduct!.linkedProductionRun!;
      productionRunsMap.set(pr.id, pr);
    }

    if (productionRunsMap.size === 0) {
      return { success: false, error: "Credit batch has no linked production runs" };
    }

    // For now, use first production run (can aggregate data from multiple runs later)
    const productionRun = [...productionRunsMap.values()][0];

    if (!productionRun.samples || productionRun.samples.length === 0) {
      return { success: false, error: "Production run has no samples" };
    }

    const sample = productionRun.samples[0];

    // Validate local data for removal
    const localData: transformers.RemovalLocalData = {
      productionRun,
      sample,
      application,
    };

    const dataValidation = transformers.validateLocalDataForRemoval(localData);
    if (!dataValidation.valid) {
      return { success: false, error: `Data validation failed: ${dataValidation.errors.join("; ")}` };
    }

    // Log warnings but continue
    if (dataValidation.warnings.length > 0) {
      console.warn("Data warnings:", dataValidation.warnings);
    }

    // Step 3: Fetch removal template to understand component structure
    const template = await isometric.getRemovalTemplate(projectId, removalTemplateId);

    // Step 4: Map local data to template component inputs
    const removalTemplateComponents = transformers.mapRemovalTemplateComponents(template, localData);

    console.log("Removal data summary:", transformers.getRemovalDataSummary(localData));
    console.log("Mapped components:", JSON.stringify(removalTemplateComponents, null, 2));

    // Step 5: Create Removal with actual data
    let removalId = creditBatch.isometricRemovalId;
    if (!removalId) {
      const removal = await isometric.createRemoval({
        project_id: projectId,
        removal_template_id: removalTemplateId,
        supplier_reference_id: creditBatch.code,
        started_on: creditBatch.startDate?.toISOString().split("T")[0] || "",
        completed_on: creditBatch.endDate?.toISOString().split("T")[0] || "",
        removal_template_components: removalTemplateComponents,
      });

      removalId = removal.id;

      await db.update(creditBatches).set({ isometricRemovalId: removalId }).where(eq(creditBatches.id, creditBatchId));

      console.log(`Created Isometric Removal: ${removalId}`);
    }

    // Step 6: Create GHG Statement (note: API only needs end_on, not start)
    const ghgStatement = await isometric.createGHGStatement({
      project_id: projectId,
      removal_ids: [removalId],
      reporting_period_start: creditBatch.startDate?.toISOString().split("T")[0] || "",
      reporting_period_end: creditBatch.endDate?.toISOString().split("T")[0] || "",
    });

    await db
      .update(creditBatches)
      .set({ isometricGhgStatementId: ghgStatement.id })
      .where(eq(creditBatches.id, creditBatchId));

    console.log(`Created Isometric GHG Statement: ${ghgStatement.id}`);

    return { success: true, isometricId: ghgStatement.id };
  } catch (error) {
    console.error("syncCreditBatch error:", error);
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
      return { success: false, error: "Credit batch not synced to Isometric" };
    }

    const statement = await isometric.getGHGStatement(creditBatch.isometricGhgStatementId);
    const localStatus = transformers.mapGHGStatementStatusToLocal(statement.status);

    await db.update(creditBatches).set({ status: localStatus }).where(eq(creditBatches.id, creditBatchId));

    return {
      success: true,
      isometricId: statement.id,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
