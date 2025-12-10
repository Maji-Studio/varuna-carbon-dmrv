"use server";

import { db } from "@/db";
import { samples, productionRuns } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface CreateSampleValues {
  productionRunId: string;
  samplingTime: Date;
  reactorId?: string;
  operatorId?: string;
  weightG?: number;
  volumeMl?: number;
  temperatureC?: number;
  moisturePercent?: number;
  ashPercent?: number;
  volatileMatterPercent?: number;
  notes?: string;
}

export async function createSample(values: CreateSampleValues) {
  const result = await db.insert(samples).values({
    productionRunId: values.productionRunId,
    samplingTime: values.samplingTime,
    reactorId: values.reactorId || null,
    operatorId: values.operatorId || null,
    weightG: values.weightG ?? null,
    volumeMl: values.volumeMl ?? null,
    temperatureC: values.temperatureC ?? null,
    moisturePercent: values.moisturePercent ?? null,
    ashPercent: values.ashPercent ?? null,
    volatileMatterPercent: values.volatileMatterPercent ?? null,
    notes: values.notes || null,
  }).returning({ id: samples.id });

  revalidatePath("/data-entry");
  revalidatePath("/data-entry/sampling");

  return { id: result[0].id };
}

export async function getSample(id: string) {
  const sample = await db.query.samples.findFirst({
    where: eq(samples.id, id),
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

  return sample;
}

// Get production runs for the form dropdown
export async function getProductionRunsForSampling() {
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
