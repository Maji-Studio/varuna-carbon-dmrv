/**
 * Completion check functions for form components.
 * These determine if a record has enough data to be considered "complete".
 * Used for UI indicators in data entry forms.
 */

/**
 * Check if feedstock delivery form has all required fields filled
 */
export function isFeedstockDeliveryComplete(values: {
  facilityId?: string;
  supplierId?: string;
  deliveryDate?: Date;
  feedstockTypeId?: string;
  weightKg?: number;
  moisturePercent?: number;
}): boolean {
  return Boolean(
    values.facilityId &&
      values.supplierId &&
      values.deliveryDate &&
      values.feedstockTypeId &&
      values.weightKg !== undefined &&
      values.weightKg > 0 &&
      values.moisturePercent !== undefined
  );
}

/**
 * Check if feedstock form has all required fields filled
 */
export function isFeedstockComplete(values: {
  facilityId?: string;
  feedstockTypeId?: string;
  weightKg?: number;
  moisturePercent?: number;
  storageLocationId?: string;
}): boolean {
  return Boolean(
    values.facilityId &&
      values.feedstockTypeId &&
      values.weightKg !== undefined &&
      values.weightKg > 0 &&
      values.moisturePercent !== undefined &&
      values.storageLocationId
  );
}

/**
 * Check if combined feedstock form (delivery + inventory) has all required fields filled
 */
export function isCombinedFeedstockComplete(values: {
  facilityId?: string;
  supplierId?: string;
  deliveryDate?: Date;
  feedstockTypeId?: string;
  weightKg?: number;
  moisturePercent?: number;
  storageLocationId?: string;
}): boolean {
  return Boolean(
    values.facilityId &&
      values.supplierId &&
      values.deliveryDate &&
      values.feedstockTypeId &&
      values.weightKg !== undefined &&
      values.weightKg > 0 &&
      values.moisturePercent !== undefined &&
      values.storageLocationId
  );
}

/**
 * Check if production run form has all required fields filled
 */
export function isProductionRunComplete(values: {
  facilityId?: string;
  reactorId?: string;
  operatorId?: string;
  feedstockInputs?: Array<{ amountKg?: number }>;
  biocharAmountKg?: number;
  endTime?: Date;
}): boolean {
  const totalFeedstockKg =
    values.feedstockInputs?.reduce(
      (sum, input) => sum + (input.amountKg || 0),
      0
    ) ?? 0;

  return Boolean(
    values.facilityId &&
      values.reactorId &&
      values.operatorId &&
      totalFeedstockKg > 0 &&
      values.biocharAmountKg &&
      values.endTime
  );
}

/**
 * Check if sampling form has all required fields filled
 */
export function isSamplingComplete(values: {
  productionRunId?: string;
}): boolean {
  return Boolean(values.productionRunId);
}

/**
 * Check if incident form has all required fields filled
 */
export function isIncidentComplete(values: {
  productionRunId?: string;
}): boolean {
  return Boolean(values.productionRunId);
}

/**
 * Check if biochar product form has all required fields filled
 */
export function isBiocharProductComplete(values: {
  facilityId?: string;
  formulationId?: string;
  totalWeightKg?: number;
  storageLocationId?: string;
}): boolean {
  return Boolean(
    values.facilityId &&
      values.formulationId &&
      values.totalWeightKg &&
      values.storageLocationId
  );
}
