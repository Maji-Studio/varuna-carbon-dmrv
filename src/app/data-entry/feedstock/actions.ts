"use server";

import { db } from "@/db";
import { feedstocks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { type FeedstockFormValues } from "@/lib/validations/data-entry";

// Convert empty string to null for optional UUID fields
function toUuidOrNull(value: string | undefined | null): string | null {
  if (!value || value.trim() === "") return null;
  return value;
}

// Generate a unique code like "FS-2025-001"
async function generateFeedstockCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FS-${year}-`;

  // Get the count of feedstocks this year to determine the next number
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(feedstocks)
    .where(sql`code LIKE ${prefix + '%'}`);

  const count = result[0]?.count ?? 0;
  const nextNumber = String(count + 1).padStart(3, '0');
  return `${prefix}${nextNumber}`;
}

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createFeedstock(values: Omit<FeedstockFormValues, "photos">): Promise<ActionResult<{ id: string }>> {
  // Validate required facilityId
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
    date: values.collectionDate?.toISOString().split("T")[0] ?? new Date().toISOString().split("T")[0],
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
      date: values.collectionDate?.toISOString().split("T")[0] ?? new Date().toISOString().split("T")[0],
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
