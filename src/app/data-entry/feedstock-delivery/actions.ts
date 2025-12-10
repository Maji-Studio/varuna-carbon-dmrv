"use server";

import { db } from "@/db";
import { feedstockDeliveries } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath, refresh } from "next/cache";
import { type FeedstockDeliveryFormValues } from "@/lib/validations/data-entry";
import { isFeedstockDeliveryComplete } from "@/lib/validations/completion";
import { toUuidOrNull } from "@/lib/form-utils";
import { type ActionResult } from "@/lib/types/actions";

export type { ActionResult };

async function generateFeedstockDeliveryCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FD-${year}-`;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedstockDeliveries)
    .where(sql`code LIKE ${prefix + "%"}`);
  const count = result[0]?.count ?? 0;
  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}

export async function createFeedstockDelivery(
  values: Omit<FeedstockDeliveryFormValues, "photos">
): Promise<ActionResult<{ id: string }>> {
  const facilityId = toUuidOrNull(values.facilityId);
  if (!facilityId) {
    return { success: false, error: "Facility is required" };
  }

  const code = await generateFeedstockDeliveryCode();
  const status = isFeedstockDeliveryComplete(values) ? "complete" : "missing_data";

  try {
    const result = await db.insert(feedstockDeliveries).values({
      code,
      facilityId,
      deliveryDate: values.deliveryDate ?? null,
      supplierId: toUuidOrNull(values.supplierId),
      driverId: toUuidOrNull(values.driverId),
      vehicleType: values.vehicleType || null,
      fuelType: values.fuelType || null,
      fuelConsumedLiters: values.fuelConsumedLiters ?? null,
      notes: values.notes || null,
      status,
    }).returning({ id: feedstockDeliveries.id });

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/feedstock-delivery");
    refresh();

    return { success: true as const, data: { id: result[0].id } };
  } catch (error) {
    console.error("Failed to create feedstock delivery:", error);
    return { success: false, error: "Failed to create feedstock delivery. Please try again." };
  }
}

export async function updateFeedstockDelivery(
  id: string,
  values: Omit<FeedstockDeliveryFormValues, "photos">
): Promise<ActionResult<{ id: string }>> {
  const facilityId = toUuidOrNull(values.facilityId);
  if (!facilityId) {
    return { success: false, error: "Facility is required" };
  }

  const status = isFeedstockDeliveryComplete(values) ? "complete" : "missing_data";

  try {
    await db
      .update(feedstockDeliveries)
      .set({
        facilityId,
        deliveryDate: values.deliveryDate ?? null,
        supplierId: toUuidOrNull(values.supplierId),
        driverId: toUuidOrNull(values.driverId),
        vehicleType: values.vehicleType || null,
        fuelType: values.fuelType || null,
        fuelConsumedLiters: values.fuelConsumedLiters ?? null,
        notes: values.notes || null,
        status,
        updatedAt: new Date(),
      })
      .where(eq(feedstockDeliveries.id, id));

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/feedstock-delivery");
    refresh();

    return { success: true as const, data: { id } };
  } catch (error) {
    console.error("Failed to update feedstock delivery:", error);
    return { success: false, error: "Failed to update feedstock delivery. Please try again." };
  }
}

export async function getFeedstockDelivery(id: string) {
  const delivery = await db.query.feedstockDeliveries.findFirst({
    where: eq(feedstockDeliveries.id, id),
    with: {
      supplier: true,
      driver: true,
      facility: true,
    },
  });

  return delivery;
}

export async function deleteFeedstockDelivery(
  id: string
): Promise<ActionResult<void>> {
  try {
    await db
      .delete(feedstockDeliveries)
      .where(eq(feedstockDeliveries.id, id));

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/feedstock-delivery");
    refresh();

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete feedstock delivery:", error);
    return { success: false, error: "Failed to delete feedstock delivery. Please try again." };
  }
}
