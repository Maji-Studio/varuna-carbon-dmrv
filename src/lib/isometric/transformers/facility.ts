/**
 * Facility Transformer
 *
 * Transforms local facility data to Isometric Facility format.
 * Isometric Facilities represent production sites/locations.
 */

import type { facilities } from '@/db/schema';
import type { Facility } from '@/lib/isometric/types';

/** Local facility type inferred from schema */
type LocalFacility = typeof facilities.$inferSelect;

/**
 * Isometric CreateFacilityRequest
 * Note: This type may need to be added to lib/isometric/types.ts
 */
export interface CreateFacilityRequest {
  name: string;
  latitude: number;
  longitude: number;
  supplier_reference_id?: string;
}

/**
 * Transform a local facility to Isometric CreateFacilityRequest format
 */
export function transformFacilityToIsometric(
  facility: LocalFacility
): CreateFacilityRequest {
  if (!facility.gpsLat || !facility.gpsLng) {
    throw new Error(
      `Facility ${facility.id} is missing GPS coordinates required for Isometric sync`
    );
  }

  return {
    name: facility.name,
    latitude: facility.gpsLat,
    longitude: facility.gpsLng,
    supplier_reference_id: facility.id, // Use our UUID as reference
  };
}

/**
 * Validate that a facility has all required fields for Isometric sync
 */
export function validateFacilityForSync(
  facility: LocalFacility
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!facility.name) {
    errors.push('Facility name is required');
  }
  if (!facility.gpsLat) {
    errors.push('GPS latitude is required');
  }
  if (!facility.gpsLng) {
    errors.push('GPS longitude is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
