"use server";

import { db } from "@/db";
import { productionRuns } from "@/db/schema";
import { desc } from "drizzle-orm";

/**
 * Get production runs for dropdown (used by Sampling and Incident forms)
 */
export async function getProductionRunsForDropdown() {
  const runs = await db.query.productionRuns.findMany({
    orderBy: desc(productionRuns.createdAt),
    limit: 50,
    with: { facility: true },
  });

  return runs.map((r) => ({
    id: r.id,
    name: `${r.code} - ${r.facility?.name ?? "Unknown Facility"}`,
    facilityId: r.facilityId,
  }));
}
