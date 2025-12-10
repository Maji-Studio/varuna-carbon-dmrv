"use server";

import { db } from "@/db";
import { incidentReports, productionRuns } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Convert empty string to null for optional UUID fields
function toUuidOrNull(value: string | undefined | null): string | null {
  if (!value || value.trim() === "") return null;
  return value;
}

interface CreateIncidentValues {
  productionRunId: string;
  incidentTime: Date;
  reactorId?: string;
  operatorId?: string;
  notes?: string;
}

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

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

// Get production runs for the form dropdown
export async function getProductionRunsForIncident() {
  const runs = await db.query.productionRuns.findMany({
    orderBy: desc(productionRuns.createdAt),
    limit: 50,
    with: {
      facility: true,
    },
  });

  return runs.map((r) => ({
    id: r.id,
    name: `${r.code} - ${r.facility?.name ?? "Unknown Facility"}`,
    facilityId: r.facilityId,
  }));
}
