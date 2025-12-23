/**
 * SERVER FUNCTIONS: Production Runs
 *
 * Server-side functions for production run operations.
 * Handles validation, business logic, and DB access.
 */

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { type ActionResult } from "@/types/actions";
import { toUuidOrNull, toDateString } from "@/utils";
import { isProductionRunComplete } from "@/lib/completion-checks";
import * as productionRunData from "@/data-access/production-runs";

// ============================================
// SCHEMAS
// ============================================

const productionRunFormSchema = z.object({
  facilityId: z.string().uuid("Please select a facility"),
  startTime: z.date().optional().nullable(),
  reactorId: z.string().uuid().optional().nullable(),
  operatorId: z.string().uuid().optional().nullable(),
  feedstockInputs: z
    .array(
      z.object({
        storageLocationId: z.string().uuid(),
        amountKg: z.number().min(0),
      })
    )
    .optional()
    .nullable(),
  moistureBeforeDryingPercent: z.number().min(0).max(100).optional().nullable(),
  moistureAfterDryingPercent: z.number().min(0).max(100).optional().nullable(),
  biocharAmountKg: z.number().min(0).optional().nullable(),
  biocharDryWeightKg: z.number().min(0).optional().nullable(),
  biocharWetWeightKg: z.number().min(0).optional().nullable(),
  biocharDryMoisturePercent: z.number().min(0).max(100).optional().nullable(),
  uncarbonizedBiocharKg: z.number().min(0).optional().nullable(),
  biocharStorageLocationId: z.string().uuid().optional().nullable(),
  dieselOperationLiters: z.number().min(0).optional().nullable(),
  dieselGensetLiters: z.number().min(0).optional().nullable(),
  preprocessingFuelLiters: z.number().min(0).optional().nullable(),
  electricityKwh: z.number().min(0).optional().nullable(),
});

export type ProductionRunFormInput = z.infer<typeof productionRunFormSchema>;

// ============================================
// UTILITIES
// ============================================

function processFeedstockInputs(
  feedstockInputs?: Array<{ storageLocationId?: string; amountKg?: number }> | null
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

  const feedstockStorageLocationId = toUuidOrNull(feedstockInputs?.[0]?.storageLocationId);

  return { totalFeedstockKg, feedstockMix, feedstockStorageLocationId };
}

// ============================================
// SERVER FUNCTIONS
// ============================================

export async function createProductionRunFn(
  input: ProductionRunFormInput
): Promise<ActionResult<{ id: string }>> {
  // Validate
  const parsed = productionRunFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  const facilityId = toUuidOrNull(data.facilityId);
  if (!facilityId) {
    return { success: false, error: "Facility is required" };
  }

  try {
    const code = await productionRunData.getNextCode();
    const { totalFeedstockKg, feedstockMix, feedstockStorageLocationId } =
      processFeedstockInputs(data.feedstockInputs);

    const result = await productionRunData.insert({
      code,
      facilityId,
      date: toDateString(data.startTime),
      startTime: data.startTime ?? null,
      reactorId: toUuidOrNull(data.reactorId),
      operatorId: toUuidOrNull(data.operatorId),
      feedstockAmountKg: totalFeedstockKg || null,
      feedstockMix: feedstockMix,
      feedstockStorageLocationId: feedstockStorageLocationId,
      moistureBeforeDryingPercent: data.moistureBeforeDryingPercent ?? null,
      moistureAfterDryingPercent: data.moistureAfterDryingPercent ?? null,
      biocharAmountKg: data.biocharAmountKg ?? null,
      biocharDryWeightKg: data.biocharDryWeightKg ?? null,
      biocharWetWeightKg: data.biocharWetWeightKg ?? null,
      biocharDryMoisturePercent: data.biocharDryMoisturePercent ?? null,
      uncarbonizedBiocharKg: data.uncarbonizedBiocharKg ?? null,
      biocharStorageLocationId: toUuidOrNull(data.biocharStorageLocationId),
      dieselOperationLiters: data.dieselOperationLiters ?? null,
      dieselGensetLiters: data.dieselGensetLiters ?? null,
      preprocessingFuelLiters: data.preprocessingFuelLiters ?? null,
      electricityKwh: data.electricityKwh ?? null,
      status: "running",
    });

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/production-run");

    return { success: true, data: { id: result.id } };
  } catch (error) {
    console.error("Failed to create production run:", error);
    return { success: false, error: "Failed to create production run. Please try again." };
  }
}

export async function updateProductionRunFn(
  id: string,
  input: ProductionRunFormInput & { endTime?: Date | null }
): Promise<ActionResult<{ id: string }>> {
  // Validate
  const parsed = productionRunFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  const facilityId = toUuidOrNull(data.facilityId);
  if (!facilityId) {
    return { success: false, error: "Facility is required" };
  }

  try {
    const { totalFeedstockKg, feedstockMix, feedstockStorageLocationId } =
      processFeedstockInputs(data.feedstockInputs);

    const status = isProductionRunComplete({ ...data, endTime: input.endTime }) ? "complete" : "running";

    await productionRunData.update(id, {
      facilityId,
      date: toDateString(data.startTime),
      startTime: data.startTime ?? null,
      endTime: input.endTime ?? null,
      reactorId: toUuidOrNull(data.reactorId),
      operatorId: toUuidOrNull(data.operatorId),
      feedstockAmountKg: totalFeedstockKg || null,
      feedstockMix: feedstockMix,
      feedstockStorageLocationId: feedstockStorageLocationId,
      moistureBeforeDryingPercent: data.moistureBeforeDryingPercent ?? null,
      moistureAfterDryingPercent: data.moistureAfterDryingPercent ?? null,
      biocharAmountKg: data.biocharAmountKg ?? null,
      biocharDryWeightKg: data.biocharDryWeightKg ?? null,
      biocharWetWeightKg: data.biocharWetWeightKg ?? null,
      biocharDryMoisturePercent: data.biocharDryMoisturePercent ?? null,
      uncarbonizedBiocharKg: data.uncarbonizedBiocharKg ?? null,
      biocharStorageLocationId: toUuidOrNull(data.biocharStorageLocationId),
      dieselOperationLiters: data.dieselOperationLiters ?? null,
      dieselGensetLiters: data.dieselGensetLiters ?? null,
      preprocessingFuelLiters: data.preprocessingFuelLiters ?? null,
      electricityKwh: data.electricityKwh ?? null,
      status,
    });

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/production-run");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Failed to update production run:", error);
    return { success: false, error: "Failed to update production run. Please try again." };
  }
}

export async function deleteProductionRunFn(id: string): Promise<ActionResult<void>> {
  try {
    await productionRunData.remove(id);

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/production-run");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete production run:", error);
    return { success: false, error: "Failed to delete production run. Please try again." };
  }
}

export async function getProductionRunFn(id: string) {
  return productionRunData.findByIdWithRelations(id);
}

export async function getAllProductionRunsFn() {
  return productionRunData.findAllWithRelations();
}
