"use server";

import { db } from "@/db";
import { feedstockDeliveries } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { type FeedstockDeliveryFormValues } from "@/lib/validations/data-entry";
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

  // Determine status based on required fields
  const hasRequiredFields = values.supplierId && values.deliveryDate;

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
    status: hasRequiredFields ? "complete" : "missing_data",
  }).returning({ id: feedstockDeliveries.id });

  revalidatePath("/data-entry");
  revalidatePath("/data-entry/feedstock-delivery");

  return { success: true as const, data: { id: result[0].id } };
}

export async function updateFeedstockDelivery(
  id: string,
  values: Omit<FeedstockDeliveryFormValues, "photos">
): Promise<ActionResult<{ id: string }>> {
  const facilityId = toUuidOrNull(values.facilityId);
  if (!facilityId) {
    return { success: false, error: "Facility is required" };
  }

  // Determine status based on required fields
  const hasRequiredFields = values.supplierId && values.deliveryDate;

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
      status: hasRequiredFields ? "complete" : "missing_data",
      updatedAt: new Date(),
    })
    .where(eq(feedstockDeliveries.id, id));

  revalidatePath("/data-entry");
  revalidatePath("/data-entry/feedstock-delivery");

  return { success: true as const, data: { id } };
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
  await db
    .delete(feedstockDeliveries)
    .where(eq(feedstockDeliveries.id, id));

  revalidatePath("/data-entry");
  revalidatePath("/data-entry/feedstock-delivery");

  return { success: true, data: undefined };
}
