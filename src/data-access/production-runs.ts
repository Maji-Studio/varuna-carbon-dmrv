/**
 * DATA-ACCESS: Production Runs
 *
 * Pure database operations for production runs.
 * No business logic - just CRUD operations.
 */

import { eq, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { productionRuns } from "@/db/schema";

// ============================================
// TYPES
// ============================================

export type ProductionRun = typeof productionRuns.$inferSelect;
export type NewProductionRun = typeof productionRuns.$inferInsert;

// ============================================
// QUERIES
// ============================================

export async function findById(id: string): Promise<ProductionRun | null> {
  const [result] = await db
    .select()
    .from(productionRuns)
    .where(eq(productionRuns.id, id))
    .limit(1);

  return result || null;
}

export async function findByIdWithRelations(id: string) {
  const result = await db.query.productionRuns.findFirst({
    where: eq(productionRuns.id, id),
    with: {
      facility: true,
      reactor: true,
      operator: true,
      biocharStorageLocation: true,
    },
  });

  return result || null;
}

// Infer the type from the function return
export type ProductionRunWithRelations = NonNullable<
  Awaited<ReturnType<typeof findByIdWithRelations>>
>;

export async function findAll(): Promise<ProductionRun[]> {
  return db.select().from(productionRuns).orderBy(desc(productionRuns.createdAt));
}

export async function findAllWithRelations() {
  return db.query.productionRuns.findMany({
    with: {
      facility: true,
      reactor: true,
      operator: true,
      biocharStorageLocation: true,
    },
    orderBy: desc(productionRuns.createdAt),
  });
}

export async function findByFacility(facilityId: string): Promise<ProductionRun[]> {
  return db
    .select()
    .from(productionRuns)
    .where(eq(productionRuns.facilityId, facilityId))
    .orderBy(desc(productionRuns.createdAt));
}

export async function findByStatus(
  status: "running" | "complete"
): Promise<ProductionRun[]> {
  return db
    .select()
    .from(productionRuns)
    .where(eq(productionRuns.status, status))
    .orderBy(desc(productionRuns.createdAt));
}

// ============================================
// MUTATIONS
// ============================================

export async function insert(data: NewProductionRun): Promise<ProductionRun> {
  const [result] = await db
    .insert(productionRuns)
    .values({ ...data, updatedAt: new Date() })
    .returning();

  return result;
}

export async function update(
  id: string,
  data: Partial<Omit<ProductionRun, "id" | "createdAt">>
): Promise<ProductionRun> {
  const [result] = await db
    .update(productionRuns)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(productionRuns.id, id))
    .returning();

  return result;
}

export async function remove(id: string): Promise<void> {
  await db.delete(productionRuns).where(eq(productionRuns.id, id));
}

// ============================================
// UTILITIES
// ============================================

export async function getNextCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PR-${year}-`;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(productionRuns)
    .where(sql`code LIKE ${prefix + "%"}`);

  return `${prefix}${String((result[0]?.count ?? 0) + 1).padStart(3, "0")}`;
}
