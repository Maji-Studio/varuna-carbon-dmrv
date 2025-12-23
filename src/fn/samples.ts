/**
 * SERVER FUNCTIONS: Samples
 *
 * Server-side functions for sample operations.
 * Handles validation, business logic, and DB access.
 */

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { type ActionResult } from "@/types/actions";
import { toUuidOrNull } from "@/utils";
import * as sampleData from "@/data-access/samples";

// ============================================
// SCHEMAS
// ============================================

const sampleFormSchema = z.object({
  productionRunId: z.string().uuid("Please select a production run"),
  samplingTime: z.date(),
  reactorId: z.string().uuid().optional().nullable(),
  operatorId: z.string().uuid().optional().nullable(),
  weightG: z.number().min(0).optional().nullable(),
  volumeMl: z.number().min(0).optional().nullable(),
  temperatureC: z.number().optional().nullable(),
  moisturePercent: z.number().min(0).max(100).optional().nullable(),
  ashPercent: z.number().min(0).max(100).optional().nullable(),
  volatileMatterPercent: z.number().min(0).max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type SampleFormInput = z.infer<typeof sampleFormSchema>;

// ============================================
// SERVER FUNCTIONS
// ============================================

export async function createSampleFn(
  input: SampleFormInput
): Promise<ActionResult<{ id: string }>> {
  // Validate
  const parsed = sampleFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  const productionRunId = toUuidOrNull(data.productionRunId);
  if (!productionRunId) {
    return { success: false, error: "Production Run is required" };
  }

  try {
    const result = await sampleData.insert({
      productionRunId,
      samplingTime: data.samplingTime,
      reactorId: toUuidOrNull(data.reactorId),
      operatorId: toUuidOrNull(data.operatorId),
      weightG: data.weightG ?? null,
      volumeMl: data.volumeMl ?? null,
      temperatureC: data.temperatureC ?? null,
      moisturePercent: data.moisturePercent ?? null,
      ashPercent: data.ashPercent ?? null,
      volatileMatterPercent: data.volatileMatterPercent ?? null,
      notes: data.notes || null,
    });

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/sampling");

    return { success: true, data: { id: result.id } };
  } catch (error) {
    console.error("Failed to create sample:", error);
    return { success: false, error: "Failed to create sample. Please try again." };
  }
}

export async function updateSampleFn(
  id: string,
  input: SampleFormInput
): Promise<ActionResult<{ id: string }>> {
  // Validate
  const parsed = sampleFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  const productionRunId = toUuidOrNull(data.productionRunId);
  if (!productionRunId) {
    return { success: false, error: "Production Run is required" };
  }

  try {
    await sampleData.update(id, {
      productionRunId,
      samplingTime: data.samplingTime,
      reactorId: toUuidOrNull(data.reactorId),
      operatorId: toUuidOrNull(data.operatorId),
      weightG: data.weightG ?? null,
      volumeMl: data.volumeMl ?? null,
      temperatureC: data.temperatureC ?? null,
      moisturePercent: data.moisturePercent ?? null,
      ashPercent: data.ashPercent ?? null,
      volatileMatterPercent: data.volatileMatterPercent ?? null,
      notes: data.notes || null,
    });

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/sampling");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Failed to update sample:", error);
    return { success: false, error: "Failed to update sample. Please try again." };
  }
}

export async function deleteSampleFn(id: string): Promise<ActionResult<void>> {
  try {
    await sampleData.remove(id);

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/sampling");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete sample:", error);
    return { success: false, error: "Failed to delete sample. Please try again." };
  }
}

export async function getSampleFn(id: string) {
  return sampleData.findByIdWithRelations(id);
}

export async function getAllSamplesFn() {
  return sampleData.findAllWithRelations();
}
