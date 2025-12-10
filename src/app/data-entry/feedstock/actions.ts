"use server";

import { db } from "@/db";
import { feedstocks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath, refresh } from "next/cache";
import { type FeedstockFormValues } from "@/lib/validations/data-entry";
import { isFeedstockComplete } from "@/lib/validations/completion";
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
  const status = isFeedstockComplete(values) ? "complete" : "missing_data";

  try {
    const result = await db.insert(feedstocks).values({
      code,
      facilityId,
      date: toDateString(values.collectionDate),
      collectionDate: values.collectionDate ?? null,
      feedstockTypeId: toUuidOrNull(values.feedstockTypeId),
      weightKg: values.weightKg ?? null,
      moisturePercent: values.moisturePercent ?? null,
      storageLocationId: toUuidOrNull(values.storageLocationId),
      notes: values.notes || null,
      status,
    }).returning({ id: feedstocks.id });

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/feedstock");
    refresh();

    return { success: true as const, data: { id: result[0].id } };
  } catch (error) {
    console.error("Failed to create feedstock:", error);
    return { success: false, error: "Failed to create feedstock. Please try again." };
  }
}

export async function updateFeedstock(id: string, values: Omit<FeedstockFormValues, "photos">): Promise<ActionResult<{ id: string }>> {
  const facilityId = toUuidOrNull(values.facilityId);
  if (!facilityId) {
    return { success: false, error: "Facility is required" };
  }

  const status = isFeedstockComplete(values) ? "complete" : "missing_data";

  try {
    await db.update(feedstocks)
      .set({
        facilityId,
        date: toDateString(values.collectionDate),
        collectionDate: values.collectionDate ?? null,
        feedstockTypeId: toUuidOrNull(values.feedstockTypeId),
        weightKg: values.weightKg ?? null,
        moisturePercent: values.moisturePercent ?? null,
        storageLocationId: toUuidOrNull(values.storageLocationId),
        notes: values.notes || null,
        status,
        updatedAt: new Date(),
      })
      .where(eq(feedstocks.id, id));

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/feedstock");
    refresh();

    return { success: true as const, data: { id } };
  } catch (error) {
    console.error("Failed to update feedstock:", error);
    return { success: false, error: "Failed to update feedstock. Please try again." };
  }
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
  try {
    await db.delete(feedstocks).where(eq(feedstocks.id, id));

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/feedstock");
    refresh();

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete feedstock:", error);
    return { success: false, error: "Failed to delete feedstock. Please try again." };
  }
}
