"use server";

import { db } from "@/db";
import { feedstocks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { type FeedstockFormValues } from "@/lib/validations/data-entry";
import { toUuidOrNull, toDateString } from "@/lib/form-utils";
import { type ActionResult } from "@/lib/types/actions";

export type { ActionResult };

async function generateFeedstockCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FS-${year}-`;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedstocks)
    .where(sql`code LIKE ${prefix + "%"}`);
  const count = result[0]?.count ?? 0;
  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}

export async function createFeedstock(
  values: Omit<FeedstockFormValues, "photos">
): Promise<ActionResult<{ id: string }>> {
  const facilityId = toUuidOrNull(values.facilityId);
  if (!facilityId) {
    return { success: false, error: "Facility is required" };
  }

  const code = await generateFeedstockCode();

  // Determine status based on required fields
  const hasRequiredFields =
    values.feedstockTypeId &&
    values.weightKg &&
    values.moisturePercent &&
    values.supplierId &&
    values.storageLocationId;

  const result = await db.insert(feedstocks).values({
    code,
    facilityId,
    date: toDateString(values.collectionDate),
    collectionDate: values.collectionDate ?? null,
    feedstockTypeId: toUuidOrNull(values.feedstockTypeId),
    supplierId: toUuidOrNull(values.supplierId),
    driverId: toUuidOrNull(values.driverId),
    vehicleType: values.vehicleType || null,
    fuelConsumedLiters: values.fuelConsumedLiters ?? null,
    weightKg: values.weightKg ?? null,
    moisturePercent: values.moisturePercent ?? null,
    storageLocationId: toUuidOrNull(values.storageLocationId),
    notes: values.notes || null,
    status: hasRequiredFields ? "complete" : "missing_data",
  }).returning({ id: feedstocks.id });

  revalidatePath("/data-entry");
  revalidatePath("/data-entry/feedstock");

  return { success: true as const, data: { id: result[0].id } };
}

export async function updateFeedstock(id: string, values: Omit<FeedstockFormValues, "photos">): Promise<ActionResult<{ id: string }>> {
  // Validate required facilityId
  const facilityId = toUuidOrNull(values.facilityId);
  if (!facilityId) {
    return { success: false, error: "Facility is required" };
  }

  // Determine status based on required fields
  const hasRequiredFields =
    values.feedstockTypeId &&
    values.weightKg &&
    values.moisturePercent &&
    values.supplierId &&
    values.storageLocationId;

  await db.update(feedstocks)
    .set({
      facilityId,
      date: toDateString(values.collectionDate),
      collectionDate: values.collectionDate ?? null,
      feedstockTypeId: toUuidOrNull(values.feedstockTypeId),
      supplierId: toUuidOrNull(values.supplierId),
      driverId: toUuidOrNull(values.driverId),
      vehicleType: values.vehicleType || null,
      fuelConsumedLiters: values.fuelConsumedLiters ?? null,
      weightKg: values.weightKg ?? null,
      moisturePercent: values.moisturePercent ?? null,
      storageLocationId: toUuidOrNull(values.storageLocationId),
      notes: values.notes || null,
      status: hasRequiredFields ? "complete" : "missing_data",
      updatedAt: new Date(),
    })
    .where(eq(feedstocks.id, id));

  revalidatePath("/data-entry");
  revalidatePath("/data-entry/feedstock");

  return { success: true as const, data: { id } };
}

export async function getFeedstock(id: string) {
  const feedstock = await db.query.feedstocks.findFirst({
    where: eq(feedstocks.id, id),
    with: {
      feedstockType: true,
      supplier: true,
      driver: true,
      storageLocation: true,
      facility: true,
    },
  });

  return feedstock;
}

export async function deleteFeedstock(id: string): Promise<ActionResult<void>> {
  await db.delete(feedstocks).where(eq(feedstocks.id, id));

  revalidatePath("/data-entry");
  revalidatePath("/data-entry/feedstock");

  return { success: true, data: undefined };
}
