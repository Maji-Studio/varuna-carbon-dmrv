"use server";

import { db } from "@/db";
import { biocharProducts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { type BiocharProductFormValues } from "@/lib/validations/data-entry";

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

export async function createBiocharProduct(values: Omit<BiocharProductFormValues, "photos">) {
  const code = await generateBiocharProductCode();

  const result = await db.insert(biocharProducts).values({
    code,
    facilityId: values.facilityId,
    productionDate: values.productionDate ?? null,
    formulationId: values.formulationId || null,
    totalWeightKg: values.totalWeightKg ?? null,
    totalVolumeLiters: values.totalVolumeLiters ?? null,
    storageLocationId: values.storageLocationId || null,
    biocharSourceStorageId: values.biocharSourceStorageId || null,
    biocharAmountKg: values.biocharAmountKg ?? null,
    biocharPerM3Kg: values.biocharPerM3Kg ?? null,
    compostWeightKg: values.compostWeightKg ?? null,
    compostPerM3Kg: values.compostPerM3Kg ?? null,
  }).returning({ id: biocharProducts.id });

  revalidatePath("/data-entry");
  revalidatePath("/data-entry/biochar-product");

  return { id: result[0].id };
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
