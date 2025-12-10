import type {
  FeedstockFormValues,
  FeedstockDeliveryFormValues,
  ProductionRunFormValues,
  SamplingFormValues,
  IncidentFormValues,
  BiocharProductFormValues,
} from "./data-entry";

/**
 * Check if feedstock delivery form has all required fields filled
 */
export function isFeedstockDeliveryComplete(
  values: Partial<FeedstockDeliveryFormValues>
): boolean {
  return Boolean(values.facilityId && values.supplierId && values.deliveryDate);
}

/**
 * Check if feedstock form has all required fields filled
 * Note: supplierId is now tracked on the feedstock delivery, not the feedstock
 */
export function isFeedstockComplete(
  values: Partial<FeedstockFormValues>
): boolean {
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
 * Check if production run form has all required fields filled
 */
export function isProductionRunComplete(
  values: Partial<ProductionRunFormValues> & { endTime?: Date }
): boolean {
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
export function isSamplingComplete(
  values: { productionRunId?: string }
): boolean {
  return Boolean(values.productionRunId);
}

/**
 * Check if incident form has all required fields filled
 */
export function isIncidentComplete(
  values: { productionRunId?: string }
): boolean {
  return Boolean(values.productionRunId);
}

/**
 * Check if biochar product form has all required fields filled
 */
export function isBiocharProductComplete(
  values: Partial<BiocharProductFormValues>
): boolean {
  return Boolean(
    values.facilityId &&
      values.formulationId &&
      values.totalWeightKg &&
      values.storageLocationId
  );
}
