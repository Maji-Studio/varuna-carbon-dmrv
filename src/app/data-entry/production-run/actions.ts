"use server";

import { db } from "@/db";
import { productionRuns } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath, refresh } from "next/cache";
import { type ProductionRunFormValues } from "@/lib/validations/data-entry";
import { isProductionRunComplete } from "@/lib/validations/completion";
import { toUuidOrNull, toDateString, processFeedstockInputs } from "@/lib/form-utils";
import { type ActionResult } from "@/lib/types/actions";

export type { ActionResult };

async function generateProductionRunCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PR-${year}-`;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(productionRuns)
    .where(sql`code LIKE ${prefix + "%"}`);
  const count = result[0]?.count ?? 0;
  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}

export async function createProductionRun(values: ProductionRunFormValues): Promise<ActionResult<{ id: string }>> {
  const facilityId = toUuidOrNull(values.facilityId);
  if (!facilityId) {
    return { success: false, error: "Facility is required" };
  }

  const code = await generateProductionRunCode();
  const { totalFeedstockKg, feedstockMix, feedstockStorageLocationId } =
    processFeedstockInputs(values.feedstockInputs);

  try {
    const result = await db.insert(productionRuns).values({
      code,
      facilityId,
      date: toDateString(values.startTime),
      startTime: values.startTime ?? null,
      reactorId: toUuidOrNull(values.reactorId),
      processType: values.processType || null,
      operatorId: toUuidOrNull(values.operatorId),
      feedstockAmountKg: totalFeedstockKg || null,
      feedstockMix: feedstockMix,
      feedstockStorageLocationId: feedstockStorageLocationId,
      moistureBeforeDryingPercent: values.moistureBeforeDryingPercent ?? null,
      moistureAfterDryingPercent: values.moistureAfterDryingPercent ?? null,
      biocharAmountKg: values.biocharAmountKg ?? null,
      biocharStorageLocationId: toUuidOrNull(values.biocharStorageLocationId),
      dieselOperationLiters: values.dieselOperationLiters ?? null,
      dieselGensetLiters: values.dieselGensetLiters ?? null,
      preprocessingFuelLiters: values.preprocessingFuelLiters ?? null,
      electricityKwh: values.electricityKwh ?? null,
      status: "running",
    }).returning({ id: productionRuns.id });

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/production-run");
    refresh();

    return { success: true as const, data: { id: result[0].id } };
  } catch (error) {
    console.error("Failed to create production run:", error);
    return { success: false, error: "Failed to create production run. Please try again." };
  }
}

export async function updateProductionRun(
  id: string,
  values: ProductionRunFormValues & { endTime?: Date }
): Promise<ActionResult<{ id: string }>> {
  const facilityId = toUuidOrNull(values.facilityId);
  if (!facilityId) {
    return { success: false, error: "Facility is required" };
  }

  const { totalFeedstockKg, feedstockMix, feedstockStorageLocationId } =
    processFeedstockInputs(values.feedstockInputs);

  const status = isProductionRunComplete(values) ? "complete" : "running";

  try {
    await db.update(productionRuns)
      .set({
        facilityId,
        date: toDateString(values.startTime),
        startTime: values.startTime ?? null,
        endTime: values.endTime ?? null,
        reactorId: toUuidOrNull(values.reactorId),
        processType: values.processType || null,
        operatorId: toUuidOrNull(values.operatorId),
        feedstockAmountKg: totalFeedstockKg || null,
        feedstockMix: feedstockMix,
        feedstockStorageLocationId: feedstockStorageLocationId,
        moistureBeforeDryingPercent: values.moistureBeforeDryingPercent ?? null,
        moistureAfterDryingPercent: values.moistureAfterDryingPercent ?? null,
        biocharAmountKg: values.biocharAmountKg ?? null,
        biocharStorageLocationId: toUuidOrNull(values.biocharStorageLocationId),
        dieselOperationLiters: values.dieselOperationLiters ?? null,
        dieselGensetLiters: values.dieselGensetLiters ?? null,
        preprocessingFuelLiters: values.preprocessingFuelLiters ?? null,
        electricityKwh: values.electricityKwh ?? null,
        status,
        updatedAt: new Date(),
      })
      .where(eq(productionRuns.id, id));

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/production-run");
    refresh();

    return { success: true as const, data: { id } };
  } catch (error) {
    console.error("Failed to update production run:", error);
    return { success: false, error: "Failed to update production run. Please try again." };
  }
}

export async function getProductionRun(id: string) {
  const productionRun = await db.query.productionRuns.findFirst({
    where: eq(productionRuns.id, id),
    with: {
      facility: true,
      reactor: true,
      operator: true,
      biocharStorageLocation: true,
    },
  });

  return productionRun;
}

export async function deleteProductionRun(
  id: string
): Promise<ActionResult<void>> {
  try {
    await db.delete(productionRuns).where(eq(productionRuns.id, id));

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/production-run");
    refresh();

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete production run:", error);
    return { success: false, error: "Failed to delete production run. Please try again." };
  }
}
