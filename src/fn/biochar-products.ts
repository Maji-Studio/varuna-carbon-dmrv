/**
 * SERVER FUNCTIONS: Biochar Products
 *
 * Server-side functions for biochar product operations.
 * Handles validation, business logic, and DB access.
 */

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { type ActionResult } from "@/types/actions";
import { toUuidOrNull } from "@/utils";
import * as biocharProductData from "@/data-access/biochar-products";

// ============================================
// SCHEMAS
// ============================================

const biocharProductFormSchema = z.object({
  facilityId: z.string().min(1, "Please select a facility"),
  productionDate: z.date().optional().nullable(),
  formulationId: z.string().optional().nullable(),
  totalWeightKg: z.number().min(0).optional().nullable(),
  totalVolumeLiters: z.number().min(0).optional().nullable(),
  storageLocationId: z.string().optional().nullable(),
  biocharSourceStorageId: z.string().optional().nullable(),
  biocharAmountKg: z.number().min(0).optional().nullable(),
  biocharPerM3Kg: z.number().min(0).optional().nullable(),
  compostWeightKg: z.number().min(0).optional().nullable(),
  compostPerM3Kg: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type BiocharProductFormInput = z.infer<typeof biocharProductFormSchema>;

// ============================================
// SERVER FUNCTIONS
// ============================================

export async function createBiocharProductFn(input: BiocharProductFormInput): Promise<ActionResult<{ id: string }>> {
  // Validate
  const parsed = biocharProductFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  const facilityId = toUuidOrNull(data.facilityId);
  if (!facilityId) {
    return { success: false, error: "Facility is required" };
  }

  try {
    const code = await biocharProductData.getNextCode();

    const result = await biocharProductData.insert({
      code,
      facilityId,
      productionDate: data.productionDate ?? null,
      formulationId: toUuidOrNull(data.formulationId),
      totalWeightKg: data.totalWeightKg ?? null,
      totalVolumeLiters: data.totalVolumeLiters ?? null,
      storageLocationId: toUuidOrNull(data.storageLocationId),
      biocharSourceStorageId: toUuidOrNull(data.biocharSourceStorageId),
      biocharAmountKg: data.biocharAmountKg ?? null,
      biocharPerM3Kg: data.biocharPerM3Kg ?? null,
      compostWeightKg: data.compostWeightKg ?? null,
      compostPerM3Kg: data.compostPerM3Kg ?? null,
    });

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/biochar-product");

    return { success: true, data: { id: result.id } };
  } catch (error) {
    console.error("Failed to create biochar product:", error);
    return { success: false, error: "Failed to create biochar product. Please try again." };
  }
}

export async function updateBiocharProductFn(
  id: string,
  input: BiocharProductFormInput
): Promise<ActionResult<{ id: string }>> {
  // Validate
  const parsed = biocharProductFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  const facilityId = toUuidOrNull(data.facilityId);
  if (!facilityId) {
    return { success: false, error: "Facility is required" };
  }

  try {
    await biocharProductData.update(id, {
      facilityId,
      productionDate: data.productionDate ?? null,
      formulationId: toUuidOrNull(data.formulationId),
      totalWeightKg: data.totalWeightKg ?? null,
      totalVolumeLiters: data.totalVolumeLiters ?? null,
      storageLocationId: toUuidOrNull(data.storageLocationId),
      biocharSourceStorageId: toUuidOrNull(data.biocharSourceStorageId),
      biocharAmountKg: data.biocharAmountKg ?? null,
      biocharPerM3Kg: data.biocharPerM3Kg ?? null,
      compostWeightKg: data.compostWeightKg ?? null,
      compostPerM3Kg: data.compostPerM3Kg ?? null,
    });

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/biochar-product");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Failed to update biochar product:", error);
    return { success: false, error: "Failed to update biochar product. Please try again." };
  }
}

export async function deleteBiocharProductFn(id: string): Promise<ActionResult<void>> {
  try {
    await biocharProductData.remove(id);

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/biochar-product");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete biochar product:", error);
    return { success: false, error: "Failed to delete biochar product. Please try again." };
  }
}

export async function getBiocharProductFn(id: string) {
  return biocharProductData.findByIdWithRelations(id);
}

export async function getAllBiocharProductsFn() {
  return biocharProductData.findAllWithRelations();
}
