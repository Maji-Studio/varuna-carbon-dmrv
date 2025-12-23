/**
 * SERVER FUNCTIONS: Incidents
 *
 * Server-side functions for incident report operations.
 * Handles validation, business logic, and DB access.
 */

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { type ActionResult } from "@/types/actions";
import * as incidentData from "@/data-access/incidents";

// ============================================
// SCHEMAS
// ============================================

const incidentFormSchema = z.object({
  productionRunId: z.string().uuid("Please select a production run"),
  incidentTime: z.date(),
  reactorId: z.string().uuid().optional().nullable(),
  operatorId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type IncidentFormInput = z.infer<typeof incidentFormSchema>;

// ============================================
// UTILITIES
// ============================================

function toUuidOrNull(value: string | undefined | null): string | null {
  if (!value || value.trim() === "") return null;
  return value;
}

// ============================================
// SERVER FUNCTIONS
// ============================================

export async function createIncidentFn(
  input: IncidentFormInput
): Promise<ActionResult<{ id: string }>> {
  // Validate
  const parsed = incidentFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  const productionRunId = toUuidOrNull(data.productionRunId);
  if (!productionRunId) {
    return { success: false, error: "Production Run is required" };
  }

  try {
    const result = await incidentData.insert({
      productionRunId,
      incidentTime: data.incidentTime,
      reactorId: toUuidOrNull(data.reactorId),
      operatorId: toUuidOrNull(data.operatorId),
      notes: data.notes || null,
    });

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/incident");

    return { success: true, data: { id: result.id } };
  } catch (error) {
    console.error("Failed to create incident:", error);
    return { success: false, error: "Failed to create incident. Please try again." };
  }
}

export async function updateIncidentFn(
  id: string,
  input: IncidentFormInput
): Promise<ActionResult<{ id: string }>> {
  // Validate
  const parsed = incidentFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  const productionRunId = toUuidOrNull(data.productionRunId);
  if (!productionRunId) {
    return { success: false, error: "Production Run is required" };
  }

  try {
    await incidentData.update(id, {
      productionRunId,
      incidentTime: data.incidentTime,
      reactorId: toUuidOrNull(data.reactorId),
      operatorId: toUuidOrNull(data.operatorId),
      notes: data.notes || null,
    });

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/incident");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Failed to update incident:", error);
    return { success: false, error: "Failed to update incident. Please try again." };
  }
}

export async function deleteIncidentFn(id: string): Promise<ActionResult<void>> {
  try {
    await incidentData.remove(id);

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/incident");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete incident:", error);
    return { success: false, error: "Failed to delete incident. Please try again." };
  }
}

export async function getIncidentFn(id: string) {
  return incidentData.findByIdWithRelations(id);
}

export async function getAllIncidentsFn() {
  return incidentData.findAllWithRelations();
}
