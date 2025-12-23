/**
 * Completion check functions for form components.
 * These determine if a record has enough data to be considered "complete".
 * Used for both UI indicators and server-side status determination.
 *
 * Note: This file intentionally does NOT have "use server" directive
 * because these are pure synchronous functions used by both client and server.
 */

// ============================================
// FEEDSTOCK
// ============================================

export function isFeedstockComplete(values: {
  facilityId?: string | null;
  supplierId?: string | null;
  deliveryDate?: Date | null;
  feedstockTypeId?: string | null;
  weightKg?: number | null;
  moisturePercent?: number | null;
  storageLocationId?: string | null;
}): boolean {
  return Boolean(
    values.facilityId &&
      values.supplierId &&
      values.deliveryDate &&
      values.feedstockTypeId &&
      values.weightKg != null &&
      values.weightKg > 0 &&
      values.moisturePercent != null &&
      values.storageLocationId
  );
}

// ============================================
// FEEDSTOCK DELIVERY
// ============================================

export function isFeedstockDeliveryComplete(values: {
  facilityId?: string | null;
  supplierId?: string | null;
  deliveryDate?: Date | null;
  feedstockTypeId?: string | null;
  weightKg?: number | null;
  moisturePercent?: number | null;
}): boolean {
  return Boolean(
    values.facilityId &&
      values.supplierId &&
      values.deliveryDate &&
      values.feedstockTypeId &&
      values.weightKg != null &&
      values.weightKg > 0 &&
      values.moisturePercent != null
  );
}

// ============================================
// PRODUCTION RUN
// ============================================

export function isProductionRunComplete(values: {
  facilityId?: string | null;
  reactorId?: string | null;
  operatorId?: string | null;
  feedstockInputs?: Array<{ amountKg?: number | null }> | null;
  biocharAmountKg?: number | null;
  endTime?: Date | null;
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

// ============================================
// SAMPLING
// ============================================

export function isSampleComplete(values: {
  productionRunId?: string | null;
}): boolean {
  return Boolean(values.productionRunId);
}

// ============================================
// INCIDENT
// ============================================

export function isIncidentComplete(values: {
  productionRunId?: string | null;
}): boolean {
  return Boolean(values.productionRunId);
}

// ============================================
// BIOCHAR PRODUCT
// ============================================

export function isBiocharProductComplete(values: {
  facilityId?: string | null;
  formulationId?: string | null;
  totalWeightKg?: number | null;
  storageLocationId?: string | null;
}): boolean {
  return Boolean(
    values.facilityId &&
      values.formulationId &&
      values.totalWeightKg &&
      values.storageLocationId
  );
}
