"use server";

import { db } from "@/db";
import {
  feedstocks,
  feedstockTypes,
  feedstockDeliveries,
  productionRuns,
  biocharProducts,
  samples,
  incidentReports,
  facilities,
  suppliers,
  drivers,
  operators,
  reactors,
  storageLocations,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// ============================================
// Incomplete Entries
// ============================================

export type IncompleteEntry = {
  id: string;
  type: "feedstock" | "production_run" | "feedstock_delivery" | "biochar_product" | "sampling" | "incident";
  name: string;
  date: string;
  description?: string;
  weight?: string;
  missingCount: number;
  updatedAt: Date;
};

export async function getIncompleteEntries(): Promise<IncompleteEntry[]> {
  // Get feedstock deliveries with missing_data status
  const incompleteFeedstockDeliveries =
    await db.query.feedstockDeliveries.findMany({
      where: eq(feedstockDeliveries.status, "missing_data"),
      with: {
        supplier: true,
      },
      orderBy: desc(feedstockDeliveries.createdAt),
      limit: 10,
    });

  // Get feedstocks with missing_data status
  const incompleteFeedstocks = await db.query.feedstocks.findMany({
    where: eq(feedstocks.status, "missing_data"),
    with: {
      feedstockType: true,
    },
    orderBy: desc(feedstocks.createdAt),
    limit: 10,
  });

  // Get production runs with running status (incomplete)
  const incompleteProductionRuns = await db.query.productionRuns.findMany({
    where: eq(productionRuns.status, "running"),
    orderBy: desc(productionRuns.createdAt),
    limit: 10,
  });

  // Get biochar products with testing status (incomplete)
  const incompleteBiocharProducts = await db.query.biocharProducts.findMany({
    where: eq(biocharProducts.status, "testing"),
    with: {
      formulation: true,
    },
    orderBy: desc(biocharProducts.createdAt),
    limit: 10,
  });

  // Get all samples (they don't have status, consider recent ones as potentially incomplete)
  const recentSamples = await db.query.samples.findMany({
    with: {
      productionRun: true,
    },
    orderBy: desc(samples.createdAt),
    limit: 10,
  });

  // Get all incident reports (recent ones)
  const recentIncidents = await db.query.incidentReports.findMany({
    with: {
      productionRun: true,
    },
    orderBy: desc(incidentReports.createdAt),
    limit: 10,
  });

  // Transform feedstock deliveries
  const feedstockDeliveryEntries: IncompleteEntry[] =
    incompleteFeedstockDeliveries.map((fd) => {
      // Count missing required fields
      let missingCount = 0;
      if (!fd.supplierId) missingCount++;
      if (!fd.deliveryDate) missingCount++;

      return {
        id: fd.id,
        type: "feedstock_delivery" as const,
        name: fd.supplier?.name || "Feedstock Delivery",
        date: formatDate(fd.deliveryDate),
        description: fd.code,
        missingCount: Math.max(missingCount, 1),
        updatedAt: fd.updatedAt,
      };
    });

  // Transform feedstocks
  const feedstockEntries: IncompleteEntry[] = incompleteFeedstocks.map((f) => {
    // Count missing required fields
    let missingCount = 0;
    if (!f.feedstockTypeId) missingCount++;
    if (!f.weightKg) missingCount++;
    if (!f.moisturePercent) missingCount++;
    if (!f.storageLocationId) missingCount++;

    return {
      id: f.id,
      type: "feedstock" as const,
      name: f.feedstockType?.name || "Unknown Feedstock",
      date: formatDate(f.date),
      description: f.feedstockType?.name,
      weight: f.weightKg ? `${f.weightKg.toLocaleString()} kg` : undefined,
      missingCount: Math.max(missingCount, 1),
      updatedAt: f.updatedAt,
    };
  });

  // Transform production runs
  const productionRunEntries: IncompleteEntry[] = incompleteProductionRuns.map(
    (pr) => {
      // Count missing required fields
      let missingCount = 0;
      if (!pr.biocharAmountKg) missingCount++;
      if (!pr.feedstockAmountKg) missingCount++;
      if (!pr.endTime) missingCount++;

      return {
        id: pr.id,
        type: "production_run" as const,
        name: pr.feedstockMix || "Production Run",
        date: formatDate(pr.date),
        description: pr.feedstockMix ?? undefined,
        weight: pr.feedstockAmountKg
          ? `${pr.feedstockAmountKg.toLocaleString()} kg`
          : undefined,
        missingCount: Math.max(missingCount, 1),
        updatedAt: pr.updatedAt,
      };
    }
  );

  // Transform biochar products
  const biocharProductEntries: IncompleteEntry[] = incompleteBiocharProducts.map(
    (bp) => {
      // Count missing required fields
      let missingCount = 0;
      if (!bp.formulationId) missingCount++;
      if (!bp.totalWeightKg) missingCount++;
      if (!bp.biocharAmountKg) missingCount++;

      return {
        id: bp.id,
        type: "biochar_product" as const,
        name: bp.formulation?.name || bp.code,
        date: formatDate(bp.productionDate),
        description: bp.code,
        weight: bp.totalWeightKg
          ? `${bp.totalWeightKg.toLocaleString()} kg`
          : undefined,
        missingCount: Math.max(missingCount, 1),
        updatedAt: bp.updatedAt,
      };
    }
  );

  // Transform samples
  const sampleEntries: IncompleteEntry[] = recentSamples.map((s) => {
    // Count missing optional but important fields
    let missingCount = 0;
    if (!s.weightG) missingCount++;
    if (!s.temperatureC) missingCount++;
    if (!s.moisturePercent) missingCount++;

    return {
      id: s.id,
      type: "sampling" as const,
      name: "Sample",
      date: formatDate(s.samplingTime),
      description: s.productionRun?.feedstockMix ?? undefined,
      missingCount: Math.max(missingCount, 1),
      updatedAt: s.updatedAt,
    };
  });

  // Transform incidents
  const incidentEntries: IncompleteEntry[] = recentIncidents.map((i) => {
    // Count missing fields
    let missingCount = 0;
    if (!i.notes) missingCount++;

    return {
      id: i.id,
      type: "incident" as const,
      name: "Incident Report",
      date: formatDate(i.incidentTime),
      description: i.productionRun?.feedstockMix ?? undefined,
      missingCount: Math.max(missingCount, 1),
      updatedAt: i.updatedAt,
    };
  });

  // Combine and sort by updatedAt (most recent first)
  return [
    ...feedstockDeliveryEntries,
    ...feedstockEntries,
    ...productionRunEntries,
    ...biocharProductEntries,
    ...sampleEntries,
    ...incidentEntries,
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

// ============================================
// Completed Entries
// ============================================

export async function getCompletedEntries(): Promise<IncompleteEntry[]> {
  // Get feedstock deliveries with complete status
  const completeFeedstockDeliveries =
    await db.query.feedstockDeliveries.findMany({
      where: eq(feedstockDeliveries.status, "complete"),
      with: {
        supplier: true,
      },
      orderBy: desc(feedstockDeliveries.updatedAt),
      limit: 10,
    });

  // Get feedstocks with complete status
  const completeFeedstocks = await db.query.feedstocks.findMany({
    where: eq(feedstocks.status, "complete"),
    with: {
      feedstockType: true,
    },
    orderBy: desc(feedstocks.updatedAt),
    limit: 10,
  });

  // Get production runs with complete status
  const completeProductionRuns = await db.query.productionRuns.findMany({
    where: eq(productionRuns.status, "complete"),
    orderBy: desc(productionRuns.updatedAt),
    limit: 10,
  });

  // Get biochar products with ready status (complete)
  const completeBiocharProducts = await db.query.biocharProducts.findMany({
    where: eq(biocharProducts.status, "ready"),
    with: {
      formulation: true,
    },
    orderBy: desc(biocharProducts.updatedAt),
    limit: 10,
  });

  // Transform feedstock deliveries
  const feedstockDeliveryEntries: IncompleteEntry[] =
    completeFeedstockDeliveries.map((fd) => ({
      id: fd.id,
      type: "feedstock_delivery" as const,
      name: fd.supplier?.name || "Feedstock Delivery",
      date: formatDate(fd.deliveryDate),
      description: fd.code,
      missingCount: 0,
      updatedAt: fd.updatedAt,
    }));

  // Transform feedstocks
  const feedstockEntries: IncompleteEntry[] = completeFeedstocks.map((f) => ({
    id: f.id,
    type: "feedstock" as const,
    name: f.feedstockType?.name || "Unknown Feedstock",
    date: formatDate(f.date),
    description: f.feedstockType?.name,
    weight: f.weightKg ? `${f.weightKg.toLocaleString()} kg` : undefined,
    missingCount: 0,
    updatedAt: f.updatedAt,
  }));

  // Transform production runs
  const productionRunEntries: IncompleteEntry[] = completeProductionRuns.map(
    (pr) => ({
      id: pr.id,
      type: "production_run" as const,
      name: pr.feedstockMix || "Production Run",
      date: formatDate(pr.date),
      description: pr.feedstockMix ?? undefined,
      weight: pr.feedstockAmountKg
        ? `${pr.feedstockAmountKg.toLocaleString()} kg`
        : undefined,
      missingCount: 0,
      updatedAt: pr.updatedAt,
    })
  );

  // Transform biochar products
  const biocharProductEntries: IncompleteEntry[] = completeBiocharProducts.map(
    (bp) => ({
      id: bp.id,
      type: "biochar_product" as const,
      name: bp.formulation?.name || bp.code,
      date: formatDate(bp.productionDate),
      description: bp.code,
      weight: bp.totalWeightKg
        ? `${bp.totalWeightKg.toLocaleString()} kg`
        : undefined,
      missingCount: 0,
      updatedAt: bp.updatedAt,
    })
  );

  // Combine and sort by updatedAt (most recent first)
  return [
    ...feedstockDeliveryEntries,
    ...feedstockEntries,
    ...productionRunEntries,
    ...biocharProductEntries,
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

// ============================================
// Form Options (for dropdowns)
// ============================================

export type SelectOption = {
  id: string;
  name: string;
  location?: string;
};

export async function getFormOptions() {
  const [
    facilitiesData,
    suppliersData,
    driversData,
    operatorsData,
    reactorsData,
    storageLocationsData,
    feedstockTypesData,
  ] = await Promise.all([
    db.select().from(facilities),
    db.select().from(suppliers),
    db.select().from(drivers),
    db.select().from(operators),
    db.select().from(reactors),
    db.select().from(storageLocations),
    db.select().from(feedstockTypes),
  ]);

  return {
    facilities: facilitiesData.map((f) => ({
      id: f.id,
      name: f.name,
      location: f.location ?? undefined,
    })),
    suppliers: suppliersData.map((s) => ({
      id: s.id,
      name: s.name,
      location: s.location ?? undefined,
    })),
    drivers: driversData.map((d) => ({
      id: d.id,
      name: d.name,
    })),
    operators: operatorsData.map((o) => ({
      id: o.id,
      name: o.name,
    })),
    reactors: reactorsData.map((r) => ({
      id: r.id,
      name: r.code,
    })),
    storageLocations: storageLocationsData.map((sl) => ({
      id: sl.id,
      name: sl.name,
    })),
    feedstockTypes: feedstockTypesData.map((ft) => ({
      id: ft.id,
      name: ft.name,
    })),
  };
}

// ============================================
// Helpers
// ============================================

function formatDate(date: string | Date | null): string {
  if (!date) return "Unknown";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
