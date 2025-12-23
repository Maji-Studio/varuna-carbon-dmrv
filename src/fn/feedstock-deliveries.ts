/**
 * SERVER FUNCTIONS: Feedstock Deliveries
 *
 * Server-side functions for feedstock delivery operations.
 * Handles validation, business logic, and DB access.
 */

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { type ActionResult } from "@/types/actions";
import * as feedstockDeliveryData from "@/data-access/feedstock-deliveries";

// ============================================
// SCHEMAS
// ============================================

const feedstockDeliveryFormSchema = z.object({
  facilityId: z.string().uuid("Please select a facility"),
  deliveryDate: z.date().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  driverId: z.string().uuid().optional().nullable(),
  vehicleId: z.string().uuid().optional().nullable(),
  vehicleType: z.string().optional().nullable(),
  fuelType: z.string().optional().nullable(),
  distanceKm: z.number().min(0).optional().nullable(),
  fuelConsumedLiters: z.number().min(0).optional().nullable(),
  feedstockTypeId: z.string().uuid().optional().nullable(),
  weightKg: z.number().min(0).optional().nullable(),
  moisturePercent: z.number().min(0).max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type FeedstockDeliveryFormInput = z.infer<typeof feedstockDeliveryFormSchema>;

// ============================================
// COMPLETION CHECK
// ============================================

function isComplete(values: Partial<FeedstockDeliveryFormInput>): boolean {
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
// UTILITIES
// ============================================

function toUuidOrNull(value: string | undefined | null): string | null {
  if (!value || value.trim() === "") return null;
  return value;
}

// ============================================
// SERVER FUNCTIONS
// ============================================

export async function createFeedstockDeliveryFn(
  input: FeedstockDeliveryFormInput
): Promise<ActionResult<{ id: string }>> {
  // Validate
  const parsed = feedstockDeliveryFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  const facilityId = toUuidOrNull(data.facilityId);
  if (!facilityId) {
    return { success: false, error: "Facility is required" };
  }

  try {
    const code = await feedstockDeliveryData.getNextCode();
    const status = isComplete(data) ? "complete" : "missing_data";

    const result = await feedstockDeliveryData.insert({
      code,
      facilityId,
      deliveryDate: data.deliveryDate ?? null,
      supplierId: toUuidOrNull(data.supplierId),
      driverId: toUuidOrNull(data.driverId),
      vehicleId: toUuidOrNull(data.vehicleId),
      vehicleType: data.vehicleType || null,
      fuelType: data.fuelType || null,
      distanceKm: data.distanceKm ?? null,
      fuelConsumedLiters: data.fuelConsumedLiters ?? null,
      feedstockTypeId: toUuidOrNull(data.feedstockTypeId),
      weightKg: data.weightKg ?? null,
      moisturePercent: data.moisturePercent ?? null,
      notes: data.notes || null,
      status,
    });

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/feedstock-delivery");

    return { success: true, data: { id: result.id } };
  } catch (error) {
    console.error("Failed to create feedstock delivery:", error);
    return { success: false, error: "Failed to create feedstock delivery. Please try again." };
  }
}

export async function updateFeedstockDeliveryFn(
  id: string,
  input: FeedstockDeliveryFormInput
): Promise<ActionResult<{ id: string }>> {
  // Validate
  const parsed = feedstockDeliveryFormSchema.safeParse(input);
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

    await feedstockDeliveryData.update(id, {
      facilityId,
      deliveryDate: data.deliveryDate ?? null,
      supplierId: toUuidOrNull(data.supplierId),
      driverId: toUuidOrNull(data.driverId),
      vehicleId: toUuidOrNull(data.vehicleId),
      vehicleType: data.vehicleType || null,
      fuelType: data.fuelType || null,
      distanceKm: data.distanceKm ?? null,
      fuelConsumedLiters: data.fuelConsumedLiters ?? null,
      feedstockTypeId: toUuidOrNull(data.feedstockTypeId),
      weightKg: data.weightKg ?? null,
      moisturePercent: data.moisturePercent ?? null,
      notes: data.notes || null,
      status,
    });

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/feedstock-delivery");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Failed to update feedstock delivery:", error);
    return { success: false, error: "Failed to update feedstock delivery. Please try again." };
  }
}

export async function deleteFeedstockDeliveryFn(
  id: string
): Promise<ActionResult<void>> {
  try {
    await feedstockDeliveryData.remove(id);

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/feedstock-delivery");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete feedstock delivery:", error);
    return { success: false, error: "Failed to delete feedstock delivery. Please try again." };
  }
}

export async function getFeedstockDeliveryFn(id: string) {
  return feedstockDeliveryData.findByIdWithRelations(id);
}

export async function getAllFeedstockDeliveriesFn() {
  return feedstockDeliveryData.findAllWithRelations();
}
