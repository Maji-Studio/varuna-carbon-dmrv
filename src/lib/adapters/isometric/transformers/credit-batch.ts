/**
 * Credit Batch Transformer
 *
 * Transforms local credit batch data to Isometric Removal and GHG Statement formats.
 *
 * In Isometric's model:
 * - Removal = A carbon removal event with all associated data (our applications)
 * - GHG Statement = A submission of removals for verification (our credit batch)
 *
 * Credit batch → GHG Statement (contains multiple Removals)
 */

import type { creditBatches } from '@/db/schema';
import type { CreateRemovalRequest, CreateGHGStatementRequest } from '@/lib/isometric/types';

/** Local credit batch type inferred from schema */
type LocalCreditBatch = typeof creditBatches.$inferSelect;

/**
 * Transform a local credit batch to Isometric CreateRemovalRequest format
 *
 * Note: In our system, each application within a credit batch could become
 * a separate Removal, or we could aggregate them. This depends on how
 * we structure the data for verification.
 *
 * @param creditBatch - Local credit batch record
 * @param projectId - Isometric project ID
 * @param removalTemplateId - Isometric removal template ID from the project
 */
export function transformCreditBatchToRemoval(
  creditBatch: LocalCreditBatch,
  projectId: string,
  removalTemplateId: string
): CreateRemovalRequest {
  if (!creditBatch.startDate || !creditBatch.endDate) {
    throw new Error(
      `Credit batch ${creditBatch.id} is missing start/end dates required for Isometric sync`
    );
  }

  return {
    project_id: projectId,
    removal_template_id: removalTemplateId,
    supplier_reference_id: creditBatch.code, // Use our code as reference
    started_on: creditBatch.startDate.toISOString().split('T')[0],
    completed_on: creditBatch.endDate.toISOString().split('T')[0],
    // removal_template_components would be populated with actual measurement data
    // This is where the LCA component inputs go
  };
}

/**
 * Transform a local credit batch to Isometric CreateGHGStatementRequest format
 *
 * A GHG Statement bundles removals for a reporting period and submits them
 * for third-party verification.
 *
 * @param creditBatch - Local credit batch record
 * @param projectId - Isometric project ID
 */
export function transformCreditBatchToGHGStatement(
  creditBatch: LocalCreditBatch,
  projectId: string
): CreateGHGStatementRequest {
  if (!creditBatch.endDate) {
    throw new Error(
      `Credit batch ${creditBatch.id} is missing end date required for GHG Statement`
    );
  }

  return {
    project_id: projectId,
    end_on: creditBatch.endDate.toISOString().split('T')[0],
  };
}

/**
 * Validate that a credit batch has all required fields for Isometric sync
 */
export function validateCreditBatchForSync(
  creditBatch: LocalCreditBatch
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!creditBatch.startDate) {
    errors.push('Start date is required');
  }
  if (!creditBatch.endDate) {
    errors.push('End date is required');
  }
  if (creditBatch.status === 'issued') {
    errors.push('Credit batch is already issued and cannot be synced');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * GHG Statement status mapping
 *
 * Maps Isometric GHG Statement status to our credit batch status
 */
export function mapGHGStatementStatusToLocal(
  isometricStatus: 'DRAFT' | 'SUBMITTED' | 'VERIFIED'
): 'pending' | 'verified' | 'issued' {
  switch (isometricStatus) {
    case 'DRAFT':
    case 'SUBMITTED':
      return 'pending';
    case 'VERIFIED':
      return 'verified';
    default:
      return 'pending';
  }
}
