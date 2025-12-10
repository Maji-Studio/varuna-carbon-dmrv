"use server";

import { db } from "@/db";
import { incidentReports, productionRuns } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface CreateIncidentValues {
  productionRunId: string;
  incidentTime: Date;
  reactorId?: string;
  operatorId?: string;
  notes?: string;
}

export async function createIncident(values: CreateIncidentValues) {
  const result = await db.insert(incidentReports).values({
    productionRunId: values.productionRunId,
    incidentTime: values.incidentTime,
    reactorId: values.reactorId || null,
    operatorId: values.operatorId || null,
    notes: values.notes || null,
  }).returning({ id: incidentReports.id });

  revalidatePath("/data-entry");
  revalidatePath("/data-entry/incident");

  return { id: result[0].id };
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
