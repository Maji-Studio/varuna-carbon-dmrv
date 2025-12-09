/**
 * Application Transformer
 *
 * Transforms local application data to Isometric StorageLocation and BiocharApplication formats.
 *
 * In Isometric's model:
 * - StorageLocation = The field/site where biochar is applied
 * - BiocharApplication = The actual spreading event at that location
 *
 * Each of our "applications" may create both entities in Isometric.
 */

import type { applications } from '@/db/schema';
import type {
  CreateStorageLocationRequest,
  CreateBiocharApplicationRequest,
  ScalarQuantity,
  StorageMethod,
} from '@/lib/isometric/types';

/** Local application type inferred from schema */
type LocalApplication = typeof applications.$inferSelect;

/**
 * Transform a local application to Isometric CreateStorageLocationRequest format
 *
 * @param application - Local application record
 * @param projectId - Isometric project ID
 */
export function transformApplicationToStorageLocation(
  application: LocalApplication,
  projectId: string
): CreateStorageLocationRequest {
  if (!application.gpsLat || !application.gpsLng) {
    throw new Error(
      `Application ${application.id} is missing GPS coordinates required for Isometric sync`
    );
  }

  return {
    project_id: projectId,
    name: application.fieldIdentifier || `Field ${application.code}`,
    latitude: application.gpsLat,
    longitude: application.gpsLng,
    storage_method: 'biochar_field' as StorageMethod,
    description: application.gisBoundaryReference || undefined,
    supplier_reference_id: application.id,
  };
}

/**
 * Transform a local application to Isometric CreateBiocharApplicationRequest format
 *
 * @param application - Local application record
 * @param projectId - Isometric project ID
 * @param storageLocationId - Isometric storage location ID (must be created first)
 * @param productionBatchId - Isometric production batch ID (must be synced first)
 */
export function transformApplicationToBiocharApplication(
  application: LocalApplication,
  projectId: string,
  storageLocationId: string,
  productionBatchId: string
): CreateBiocharApplicationRequest {
  if (!application.applicationDate) {
    throw new Error(
      `Application ${application.id} is missing application date required for Isometric sync`
    );
  }

  // Calculate average application rate if we have the data
  let averageApplicationRate: ScalarQuantity;
  if (application.biocharAppliedTons && application.fieldSizeHa) {
    averageApplicationRate = {
      magnitude: application.biocharAppliedTons / application.fieldSizeHa,
      unit: 't / ha',
    };
  } else {
    // Default to 0 if we can't calculate
    averageApplicationRate = {
      magnitude: 0,
      unit: 't / ha',
    };
  }

  // Truck mass measurements
  const truckMassOnArrival: ScalarQuantity = {
    magnitude: application.truckMassOnArrivalKg || 0,
    unit: 'kg',
  };

  const truckMassOnDeparture: ScalarQuantity = {
    magnitude: application.truckMassOnDepartureKg || 0,
    unit: 'kg',
  };

  return {
    project_id: projectId,
    storage_site_id: storageLocationId, // Note: API uses storage_site_id
    production_batch_id: productionBatchId,
    application_date: application.applicationDate.toISOString().split('T')[0],
    truck_mass_on_arrival: truckMassOnArrival,
    truck_mass_on_departure: truckMassOnDeparture,
    average_application_rate: averageApplicationRate,
    supplier_reference_id: application.id,
  };
}

/**
 * Validate that an application has all required fields for Isometric sync
 */
export function validateApplicationForSync(
  application: LocalApplication
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!application.gpsLat) {
    errors.push('GPS latitude is required');
  }
  if (!application.gpsLng) {
    errors.push('GPS longitude is required');
  }
  if (!application.applicationDate) {
    errors.push('Application date is required');
  }
  if (application.status !== 'applied') {
    errors.push('Application must be in "applied" status before syncing');
  }

  // Warn about optional but recommended fields
  const warnings: string[] = [];
  if (!application.truckMassOnArrivalKg) {
    warnings.push('Truck mass on arrival is recommended for accurate accounting');
  }
  if (!application.truckMassOnDepartureKg) {
    warnings.push('Truck mass on departure is recommended for accurate accounting');
  }
  if (!application.biocharAppliedTons) {
    warnings.push('Biochar applied amount is recommended');
  }
  if (!application.fieldSizeHa) {
    warnings.push('Field size is recommended for application rate calculation');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
