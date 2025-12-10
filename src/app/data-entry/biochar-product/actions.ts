"use server";

import { db } from "@/db";
import { biocharProducts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { type BiocharProductFormValues } from "@/lib/validations/data-entry";

// Convert empty string to null for optional UUID fields
function toUuidOrNull(value: string | undefined | null): string | null {
  if (!value || value.trim() === "") return null;
  return value;
}

// Generate a unique code like "BP-2025-043"
async function generateBiocharProductCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `BP-${year}-`;

  const result = await db.select({ count: sql<number>`count(*)` })
    .from(biocharProducts)
    .where(sql`code LIKE ${prefix + '%'}`);

  const count = result[0]?.count ?? 0;
  const nextNumber = String(count + 1).padStart(3, '0');
  return `${prefix}${nextNumber}`;
}

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createBiocharProduct(values: Omit<BiocharProductFormValues, "photos">): Promise<ActionResult<{ id: string }>> {
  // Validate required facilityId
  const facilityId = toUuidOrNull(values.facilityId);
  if (!facilityId) {
    return { success: false, error: "Facility is required" };
  }

  const code = await generateBiocharProductCode();

  const result = await db.insert(biocharProducts).values({
    code,
    facilityId,
    productionDate: values.productionDate ?? null,
    formulationId: toUuidOrNull(values.formulationId),
    totalWeightKg: values.totalWeightKg ?? null,
    totalVolumeLiters: values.totalVolumeLiters ?? null,
    storageLocationId: toUuidOrNull(values.storageLocationId),
    biocharSourceStorageId: toUuidOrNull(values.biocharSourceStorageId),
    biocharAmountKg: values.biocharAmountKg ?? null,
    biocharPerM3Kg: values.biocharPerM3Kg ?? null,
    compostWeightKg: values.compostWeightKg ?? null,
    compostPerM3Kg: values.compostPerM3Kg ?? null,
  }).returning({ id: biocharProducts.id });

  revalidatePath("/data-entry");
  revalidatePath("/data-entry/biochar-product");

  return { success: true, data: { id: result[0].id } };
}

export async function getBiocharProduct(id: string) {
  const product = await db.query.biocharProducts.findFirst({
    where: eq(biocharProducts.id, id),
    with: {
      facility: true,
      formulation: true,
      storageLocation: true,
      biocharSourceStorage: true,
    },
  });

  return product;
}
