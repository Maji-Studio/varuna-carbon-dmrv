/**
 * Convert empty string to null for optional UUID fields
 */
export function toUuidOrNull(value: string | undefined | null): string | null {
  if (!value || value.trim() === "") return null;
  return value;
}

/**
 * Convert Date to ISO date string (YYYY-MM-DD)
 */
export function toDateString(date?: Date | null): string {
  return (date ?? new Date()).toISOString().split("T")[0];
}

/**
 * Process feedstock inputs for production run
 */
export function processFeedstockInputs(
  feedstockInputs?: Array<{ storageLocationId?: string; amountKg?: number }>
) {
  const totalFeedstockKg =
    feedstockInputs?.reduce((sum, input) => sum + (input.amountKg || 0), 0) ?? 0;

  const feedstockMix = feedstockInputs?.length
    ? JSON.stringify(
        feedstockInputs
          .filter((f) => f.storageLocationId)
          .map((f) => ({
            storageLocationId: f.storageLocationId,
            amountKg: f.amountKg,
          }))
      )
    : null;

  const feedstockStorageLocationId = toUuidOrNull(
    feedstockInputs?.[0]?.storageLocationId
  );

  return { totalFeedstockKg, feedstockMix, feedstockStorageLocationId };
}
