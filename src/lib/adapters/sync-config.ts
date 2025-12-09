/**
 * Sync Configuration
 *
 * Simple documentation of entity-to-Isometric mappings.
 * The actual sync logic lives in adapter.ts - this is just for reference.
 */

import type { RegistryEntityType, RegistryName } from '@/db/schema/registry';

/**
 * Entity-to-Isometric mapping reference:
 *
 * | Local Entity     | Isometric Entity Types                    | Notes                          |
 * |------------------|-------------------------------------------|--------------------------------|
 * | facility         | facility                                  | 1:1 mapping                    |
 * | feedstock_type   | feedstock_type                            | 1:1 mapping                    |
 * | production_run   | production_batch                          | Requires facility synced first |
 * | application      | storage_location + biochar_application    | 2 steps, storage first         |
 * | credit_batch     | removal + ghg_statement                   | 2 steps, removal first         |
 */

/**
 * Dependency order for syncing all entity types.
 * Parent entities must be synced before children.
 */
export const SYNC_ORDER: RegistryEntityType[] = [
  'facility',
  'feedstock_type',
  'production_run',
  'application',
  'credit_batch',
];

/**
 * External entity types created for each local entity type
 */
export const EXTERNAL_ENTITY_TYPES: Record<RegistryEntityType, string[]> = {
  facility: ['facility'],
  feedstock_type: ['feedstock_type'],
  production_run: ['production_batch'],
  application: ['storage_location', 'biochar_application'],
  credit_batch: ['removal', 'ghg_statement'],
};

/**
 * Get all external entity types for a local entity type
 */
export function getExternalEntityTypes(
  entityType: RegistryEntityType
): string[] {
  return EXTERNAL_ENTITY_TYPES[entityType] ?? [];
}
