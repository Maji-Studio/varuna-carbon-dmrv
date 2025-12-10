"use server";

import { db } from "@/db";
import { incidentReports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath, refresh } from "next/cache";
import { toUuidOrNull } from "@/lib/form-utils";
import { getProductionRunsForDropdown } from "@/lib/actions/utils";
import { type ActionResult } from "@/lib/types/actions";

export type { ActionResult };

interface CreateIncidentValues {
  productionRunId: string;
  incidentTime: Date;
  reactorId?: string;
  operatorId?: string;
  notes?: string;
}

export async function createIncident(values: CreateIncidentValues): Promise<ActionResult<{ id: string }>> {
  const productionRunId = toUuidOrNull(values.productionRunId);
  if (!productionRunId) {
    return { success: false, error: "Production Run is required" };
  }

  try {
    const result = await db.insert(incidentReports).values({
      productionRunId,
      incidentTime: values.incidentTime,
      reactorId: toUuidOrNull(values.reactorId),
      operatorId: toUuidOrNull(values.operatorId),
      notes: values.notes || null,
    }).returning({ id: incidentReports.id });

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/incident");
    refresh();

    return { success: true, data: { id: result[0].id } };
  } catch (error) {
    console.error("Failed to create incident:", error);
    return { success: false, error: "Failed to create incident. Please try again." };
  }
}

export async function getIncident(id: string) {
  const incident = await db.query.incidentReports.findFirst({
    where: eq(incidentReports.id, id),
    with: {
      productionRun: {
        with: {
          facility: true,
        },
      },
      reactor: true,
      operator: true,
    },
  });

  return incident;
}

export async function updateIncident(
  id: string,
  values: CreateIncidentValues
): Promise<ActionResult<{ id: string }>> {
  const productionRunId = toUuidOrNull(values.productionRunId);
  if (!productionRunId) {
    return { success: false, error: "Production Run is required" };
  }

  try {
    await db
      .update(incidentReports)
      .set({
        productionRunId,
        incidentTime: values.incidentTime,
        reactorId: toUuidOrNull(values.reactorId),
        operatorId: toUuidOrNull(values.operatorId),
        notes: values.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(incidentReports.id, id));

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/incident");
    refresh();

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Failed to update incident:", error);
    return { success: false, error: "Failed to update incident. Please try again." };
  }
}

export async function deleteIncident(id: string): Promise<ActionResult<void>> {
  try {
    await db.delete(incidentReports).where(eq(incidentReports.id, id));

    revalidatePath("/data-entry");
    revalidatePath("/data-entry/incident");
    refresh();

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete incident:", error);
    return { success: false, error: "Failed to delete incident. Please try again." };
  }
}

// Wrapper function for server action compatibility
export async function getProductionRunsForIncident() {
  return getProductionRunsForDropdown();
}
