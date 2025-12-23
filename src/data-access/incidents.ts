/**
 * DATA-ACCESS: Incidents
 *
 * Pure database operations for incident reports.
 * No business logic - just CRUD operations.
 */

import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { incidentReports } from "@/db/schema";

// ============================================
// TYPES
// ============================================

export type Incident = typeof incidentReports.$inferSelect;
export type NewIncident = typeof incidentReports.$inferInsert;

// ============================================
// QUERIES
// ============================================

export async function findById(id: string): Promise<Incident | null> {
  const [result] = await db
    .select()
    .from(incidentReports)
    .where(eq(incidentReports.id, id))
    .limit(1);

  return result || null;
}

export async function findByIdWithRelations(id: string) {
  const result = await db.query.incidentReports.findFirst({
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

  return result || null;
}

// Infer the type from the function return
export type IncidentWithRelations = NonNullable<
  Awaited<ReturnType<typeof findByIdWithRelations>>
>;

export async function findAll(): Promise<Incident[]> {
  return db.select().from(incidentReports).orderBy(desc(incidentReports.createdAt));
}

export async function findAllWithRelations() {
  return db.query.incidentReports.findMany({
    with: {
      productionRun: {
        with: {
          facility: true,
        },
      },
      reactor: true,
      operator: true,
    },
    orderBy: desc(incidentReports.createdAt),
  });
}

export async function findByProductionRun(productionRunId: string): Promise<Incident[]> {
  return db
    .select()
    .from(incidentReports)
    .where(eq(incidentReports.productionRunId, productionRunId))
    .orderBy(desc(incidentReports.createdAt));
}

// ============================================
// MUTATIONS
// ============================================

export async function insert(data: NewIncident): Promise<Incident> {
  const [result] = await db
    .insert(incidentReports)
    .values({ ...data, updatedAt: new Date() })
    .returning();

  return result;
}

export async function update(
  id: string,
  data: Partial<Omit<Incident, "id" | "createdAt">>
): Promise<Incident> {
  const [result] = await db
    .update(incidentReports)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(incidentReports.id, id))
    .returning();

  return result;
}

export async function remove(id: string): Promise<void> {
  await db.delete(incidentReports).where(eq(incidentReports.id, id));
}
