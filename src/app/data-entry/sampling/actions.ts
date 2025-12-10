"use server";

import { db } from "@/db";
import { samples } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { toUuidOrNull } from "@/lib/form-utils";
import { getProductionRunsForDropdown } from "@/lib/actions/utils";
import { type ActionResult } from "@/lib/types/actions";

export type { ActionResult };

interface CreateSampleValues {
  productionRunId: string;
  samplingTime: Date;
  reactorId?: string;
  operatorId?: string;
  weightG?: number;
  volumeMl?: number;
  temperatureC?: number;
  moisturePercent?: number;
  ashPercent?: number;
  volatileMatterPercent?: number;
  notes?: string;
}

export async function createSample(values: CreateSampleValues): Promise<ActionResult<{ id: string }>> {
  const productionRunId = toUuidOrNull(values.productionRunId);
  if (!productionRunId) {
    return { success: false, error: "Production Run is required" };
  }

  try {
    const result = await db.insert(samples).values({
      productionRunId,
      samplingTime: values.samplingTime,
      reactorId: toUuidOrNull(values.reactorId),
      operatorId: toUuidOrNull(values.operatorId),
      weightG: values.weightG ?? null,
      volumeMl: values.volumeMl ?? null,
      temperatureC: values.temperatureC ?? null,
      moisturePercent: values.moisturePercent ?? null,
      ashPercent: values.ashPercent ?? null,
      volatileMatterPercent: values.volatileMatterPercent ?? null,
      notes: values.notes || null,
    }).returning({ id: samples.id });

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/sampling");

    return { success: true, data: { id: result[0].id } };
  } catch (error) {
    console.error("Failed to create sample:", error);
    return { success: false, error: "Failed to create sample. Please try again." };
  }
}

export async function getSample(id: string) {
  const sample = await db.query.samples.findFirst({
    where: eq(samples.id, id),
    with: {
      productionRun: {
        with: {
          facility: true,
        },
      },
      reactor: true,
      operator: true,
    },
  });

  return sample;
}

export async function deleteSample(id: string): Promise<ActionResult<void>> {
  try {
    await db.delete(samples).where(eq(samples.id, id));

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/sampling");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete sample:", error);
    return { success: false, error: "Failed to delete sample. Please try again." };
  }
}

// Re-export shared function for convenience
export { getProductionRunsForDropdown as getProductionRunsForSampling } from "@/lib/actions/utils";
