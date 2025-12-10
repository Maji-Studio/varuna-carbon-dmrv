"use server";

import { db } from "@/db";
import { incidentReports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
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
  // Validate required productionRunId
  const productionRunId = toUuidOrNull(values.productionRunId);
  if (!productionRunId) {
    return { success: false, error: "Production Run is required" };
  }

  const result = await db.insert(incidentReports).values({
    productionRunId,
    incidentTime: values.incidentTime,
    reactorId: toUuidOrNull(values.reactorId),
    operatorId: toUuidOrNull(values.operatorId),
    notes: values.notes || null,
  }).returning({ id: incidentReports.id });

  revalidatePath("/data-entry");
  revalidatePath("/data-entry/incident");

  return { success: true, data: { id: result[0].id } };
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

export async function deleteIncident(id: string): Promise<ActionResult<void>> {
  await db.delete(incidentReports).where(eq(incidentReports.id, id));

  revalidatePath("/data-entry");
  revalidatePath("/data-entry/incident");

  return { success: true, data: undefined };
}

// Re-export shared function for convenience
export { getProductionRunsForDropdown as getProductionRunsForIncident } from "@/lib/actions/utils";
