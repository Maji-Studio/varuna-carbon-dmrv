/**
 * SERVER FUNCTIONS: Feedstocks
 *
 * Server-side functions for feedstock operations.
 * Handles validation, business logic, and DB access.
 */

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { type ActionResult } from "@/types/actions";
import * as feedstockData from "@/data-access/feedstocks";

// ============================================
// SCHEMAS
// ============================================

const feedstockFormSchema = z.object({
  // Delivery Information
  facilityId: z.string().uuid("Please select a facility"),
  deliveryDate: z.date().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  driverId: z.string().uuid().optional().nullable(),
  vehicleId: z.string().uuid().optional().nullable(),
  vehicleType: z.string().optional().nullable(),
  fuelType: z.string().optional().nullable(),
  distanceKm: z.number().min(0).optional().nullable(),
  fuelConsumedLiters: z.number().min(0).optional().nullable(),

  // Feedstock Details
  feedstockTypeId: z.string().uuid().optional().nullable(),
  weightKg: z.number().min(0).optional().nullable(),
  moisturePercent: z.number().min(0).max(100).optional().nullable(),
  storageLocationId: z.string().uuid().optional().nullable(),

  // Documentation
  notes: z.string().optional().nullable(),
});

export type FeedstockFormInput = z.infer<typeof feedstockFormSchema>;

// ============================================
// COMPLETION CHECK
// ============================================

function isComplete(values: Partial<FeedstockFormInput>): boolean {
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
// UTILITIES
// ============================================

function toUuidOrNull(value: string | undefined | null): string | null {
  if (!value || value.trim() === "") return null;
  return value;
}

function toDateString(date?: Date | null): string {
  return (date ?? new Date()).toISOString().split("T")[0];
}

// ============================================
// SERVER FUNCTIONS
// ============================================

export async function createFeedstockFn(
  input: FeedstockFormInput
): Promise<ActionResult<{ id: string }>> {
  // Validate
  const parsed = feedstockFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  const facilityId = toUuidOrNull(data.facilityId);
  if (!facilityId) {
    return { success: false, error: "Facility is required" };
  }

  try {
    const code = await feedstockData.getNextCode();
    const status = isComplete(data) ? "complete" : "missing_data";

    const result = await feedstockData.insert({
      code,
      facilityId,
      date: toDateString(data.deliveryDate),
      // Delivery fields
      deliveryDate: data.deliveryDate ?? null,
      supplierId: toUuidOrNull(data.supplierId),
      driverId: toUuidOrNull(data.driverId),
      vehicleType: data.vehicleType || null,
      fuelType: data.fuelType || null,
      fuelConsumedLiters: data.fuelConsumedLiters ?? null,
      distanceKm: data.distanceKm ?? null,
      // Feedstock fields
      feedstockTypeId: toUuidOrNull(data.feedstockTypeId),
      weightKg: data.weightKg ?? null,
      moisturePercent: data.moisturePercent ?? null,
      storageLocationId: toUuidOrNull(data.storageLocationId),
      notes: data.notes || null,
      status,
    });

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/feedstock");

    return { success: true, data: { id: result.id } };
  } catch (error) {
    console.error("Failed to create feedstock:", error);
    return { success: false, error: "Failed to create feedstock. Please try again." };
  }
}

export async function updateFeedstockFn(
  id: string,
  input: FeedstockFormInput
): Promise<ActionResult<{ id: string }>> {
  // Validate
  const parsed = feedstockFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  const facilityId = toUuidOrNull(data.facilityId);
  if (!facilityId) {
    return { success: false, error: "Facility is required" };
  }

  try {
    const status = isComplete(data) ? "complete" : "missing_data";

    await feedstockData.update(id, {
      facilityId,
      date: toDateString(data.deliveryDate),
      // Delivery fields
      deliveryDate: data.deliveryDate ?? null,
      supplierId: toUuidOrNull(data.supplierId),
      driverId: toUuidOrNull(data.driverId),
      vehicleType: data.vehicleType || null,
      fuelType: data.fuelType || null,
      fuelConsumedLiters: data.fuelConsumedLiters ?? null,
      distanceKm: data.distanceKm ?? null,
      // Feedstock fields
      feedstockTypeId: toUuidOrNull(data.feedstockTypeId),
      weightKg: data.weightKg ?? null,
      moisturePercent: data.moisturePercent ?? null,
      storageLocationId: toUuidOrNull(data.storageLocationId),
      notes: data.notes || null,
      status,
    });

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/feedstock");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Failed to update feedstock:", error);
    return { success: false, error: "Failed to update feedstock. Please try again." };
  }
}

export async function deleteFeedstockFn(
  id: string
): Promise<ActionResult<void>> {
  try {
    await feedstockData.remove(id);

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/feedstock");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete feedstock:", error);
    return { success: false, error: "Failed to delete feedstock. Please try again." };
  }
}

export async function getFeedstockFn(id: string) {
  return feedstockData.findByIdWithRelations(id);
}

export async function getAllFeedstocksFn() {
  return feedstockData.findAllWithRelations();
}
