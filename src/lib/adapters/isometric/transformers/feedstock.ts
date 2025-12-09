/**
 * Feedstock Type Transformer
 *
 * Transforms local feedstock type data to Isometric FeedstockType format.
 * Isometric FeedstockTypes categorize biomass inputs for carbon accounting.
 */

import type { feedstockTypes } from '@/db/schema';
import type { CreateFeedstockTypeRequest } from '@/lib/isometric/types';

/** Local feedstock type inferred from schema */
type LocalFeedstockType = typeof feedstockTypes.$inferSelect;

/**
 * Transform a local feedstock type to Isometric CreateFeedstockTypeRequest format
 */
export function transformFeedstockTypeToIsometric(
  feedstockType: LocalFeedstockType
): CreateFeedstockTypeRequest {
  return {
    name: feedstockType.name,
    supplier_reference_id: feedstockType.id, // Use our UUID as reference
  };
}

/**
 * Validate that a feedstock type has all required fields for Isometric sync
 */
export function validateFeedstockTypeForSync(
  feedstockType: LocalFeedstockType
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!feedstockType.name) {
    errors.push('Feedstock type name is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
