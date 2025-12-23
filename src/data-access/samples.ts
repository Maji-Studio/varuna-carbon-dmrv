/**
 * DATA-ACCESS: Samples
 *
 * Pure database operations for samples.
 * No business logic - just CRUD operations.
 */

import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { samples } from "@/db/schema";

// ============================================
// TYPES
// ============================================

export type Sample = typeof samples.$inferSelect;
export type NewSample = typeof samples.$inferInsert;

// ============================================
// QUERIES
// ============================================

export async function findById(id: string): Promise<Sample | null> {
  const [result] = await db
    .select()
    .from(samples)
    .where(eq(samples.id, id))
    .limit(1);

  return result || null;
}

export async function findByIdWithRelations(id: string) {
  const result = await db.query.samples.findFirst({
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

  return result || null;
}

// Infer the type from the function return
export type SampleWithRelations = NonNullable<
  Awaited<ReturnType<typeof findByIdWithRelations>>
>;

export async function findAll(): Promise<Sample[]> {
  return db.select().from(samples).orderBy(desc(samples.createdAt));
}

export async function findAllWithRelations() {
  return db.query.samples.findMany({
    with: {
      productionRun: {
        with: {
          facility: true,
        },
      },
      reactor: true,
      operator: true,
    },
    orderBy: desc(samples.createdAt),
  });
}

export async function findByProductionRun(productionRunId: string): Promise<Sample[]> {
  return db
    .select()
    .from(samples)
    .where(eq(samples.productionRunId, productionRunId))
    .orderBy(desc(samples.createdAt));
}

// ============================================
// MUTATIONS
// ============================================

export async function insert(data: NewSample): Promise<Sample> {
  const [result] = await db
    .insert(samples)
    .values({ ...data, updatedAt: new Date() })
    .returning();

  return result;
}

export async function update(
  id: string,
  data: Partial<Omit<Sample, "id" | "createdAt">>
): Promise<Sample> {
  const [result] = await db
    .update(samples)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(samples.id, id))
    .returning();

  return result;
}

export async function remove(id: string): Promise<void> {
  await db.delete(samples).where(eq(samples.id, id));
}
