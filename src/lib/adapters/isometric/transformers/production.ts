/**
 * Production Run Transformer
 *
 * Transforms local production run data to Isometric ProductionBatch format.
 * Isometric ProductionBatches represent pyrolysis production events.
 */

import type { productionRuns } from '@/db/schema';
import type { CreateProductionBatchRequest, ScalarQuantity } from '@/lib/isometric/types';

/** Local production run type inferred from schema */
type LocalProductionRun = typeof productionRuns.$inferSelect;

/**
 * Transform a local production run to Isometric CreateProductionBatchRequest format
 *
 * @param productionRun - Local production run record
 * @param facilityId - Isometric facility ID (must be synced first)
 * @param feedstockTypeIds - Array of Isometric feedstock type IDs
 */
export function transformProductionRunToIsometric(
  productionRun: LocalProductionRun,
  facilityId: string,
  feedstockTypeIds: string[]
): CreateProductionBatchRequest {
  if (!productionRun.startTime || !productionRun.endTime) {
    throw new Error(
      `Production run ${productionRun.id} is missing start/end times required for Isometric sync`
    );
  }

  if (!productionRun.biocharAmountKg) {
    throw new Error(
      `Production run ${productionRun.id} is missing biochar amount required for Isometric sync`
    );
  }

  const mass: ScalarQuantity = {
    magnitude: productionRun.biocharAmountKg,
    unit: 'kg',
  };

  return {
    facility_id: facilityId,
    feedstock_type_ids: feedstockTypeIds,
    kind: 'BIOCHAR', // We only produce biochar
    started_at: productionRun.startTime.toISOString(),
    ended_at: productionRun.endTime.toISOString(),
    display_name: productionRun.code,
    mass,
    supplier_reference_id: productionRun.id, // Use our UUID as reference
  };
}

/**
 * Validate that a production run has all required fields for Isometric sync
 */
export function validateProductionRunForSync(
  productionRun: LocalProductionRun
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!productionRun.startTime) {
    errors.push('Start time is required');
  }
  if (!productionRun.endTime) {
    errors.push('End time is required');
  }
  if (!productionRun.biocharAmountKg) {
    errors.push('Biochar amount (kg) is required');
  }
  if (productionRun.status !== 'complete') {
    errors.push('Production run must be complete before syncing');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
