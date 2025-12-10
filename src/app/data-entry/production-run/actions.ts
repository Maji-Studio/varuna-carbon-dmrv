"use server";

import { db } from "@/db";
import { productionRuns } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { type ProductionRunFormValues } from "@/lib/validations/data-entry";

// Convert empty string to null for optional UUID fields
function toUuidOrNull(value: string | undefined | null): string | null {
  if (!value || value.trim() === "") return null;
  return value;
}

// Generate a unique code like "PR-2025-043"
async function generateProductionRunCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PR-${year}-`;

  const result = await db.select({ count: sql<number>`count(*)` })
    .from(productionRuns)
    .where(sql`code LIKE ${prefix + '%'}`);

  const count = result[0]?.count ?? 0;
  const nextNumber = String(count + 1).padStart(3, '0');
  return `${prefix}${nextNumber}`;
}

export async function createProductionRun(values: ProductionRunFormValues) {
  // Validate required facilityId
  const facilityId = toUuidOrNull(values.facilityId);
  if (!facilityId) {
    throw new Error("Facility is required");
  }

  const code = await generateProductionRunCode();

  // Calculate total feedstock amount from inputs
  const totalFeedstockKg = values.feedstockInputs?.reduce(
    (sum, input) => sum + (input.amountKg || 0),
    0
  );

  // Create feedstock mix description (JSON for multi-source support)
  const feedstockMix = values.feedstockInputs?.length
    ? JSON.stringify(
        values.feedstockInputs
          .filter((f) => f.storageLocationId)
          .map((f) => ({ storageLocationId: f.storageLocationId, amountKg: f.amountKg }))
      )
    : null;

  // Get the first feedstock storage location ID if available
  const feedstockStorageLocationId = toUuidOrNull(values.feedstockInputs?.[0]?.storageLocationId);

  const result = await db.insert(productionRuns).values({
    code,
    facilityId,
    date: values.startTime?.toISOString().split("T")[0] ?? new Date().toISOString().split("T")[0],
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

  return { id: result[0].id };
}

export async function updateProductionRun(id: string, values: ProductionRunFormValues & { endTime?: Date }) {
  // Validate required facilityId
  const facilityId = toUuidOrNull(values.facilityId);
  if (!facilityId) {
    throw new Error("Facility is required");
  }

  // Calculate total feedstock amount from inputs
  const totalFeedstockKg = values.feedstockInputs?.reduce(
    (sum, input) => sum + (input.amountKg || 0),
    0
  );

  // Create feedstock mix description (JSON for multi-source support)
  const feedstockMix = values.feedstockInputs?.length
    ? JSON.stringify(
        values.feedstockInputs
          .filter((f) => f.storageLocationId)
          .map((f) => ({ storageLocationId: f.storageLocationId, amountKg: f.amountKg }))
      )
    : null;

  // Get the first feedstock storage location ID if available
  const feedstockStorageLocationId = toUuidOrNull(values.feedstockInputs?.[0]?.storageLocationId);

  // Determine status
  const hasRequiredFields = values.biocharAmountKg && totalFeedstockKg && values.endTime;

  await db.update(productionRuns)
    .set({
      facilityId,
      date: values.startTime?.toISOString().split("T")[0] ?? new Date().toISOString().split("T")[0],
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
      status: hasRequiredFields ? "complete" : "running",
      updatedAt: new Date(),
    })
    .where(eq(productionRuns.id, id));

  revalidatePath("/data-entry");
  revalidatePath("/data-entry/production-run");

  return { id };
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
