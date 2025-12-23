/**
 * DATA-ACCESS: Feedstocks
 *
 * Pure database operations for feedstocks.
 * No business logic - just CRUD operations.
 */

import { eq, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { feedstocks } from "@/db/schema";

// ============================================
// TYPES
// ============================================

export type Feedstock = typeof feedstocks.$inferSelect;
export type NewFeedstock = typeof feedstocks.$inferInsert;

// ============================================
// QUERIES
// ============================================

export async function findById(id: string): Promise<Feedstock | null> {
  const [result] = await db
    .select()
    .from(feedstocks)
    .where(eq(feedstocks.id, id))
    .limit(1);

  return result || null;
}

export async function findByIdWithRelations(id: string) {
  const result = await db.query.feedstocks.findFirst({
    where: eq(feedstocks.id, id),
    with: {
      feedstockType: true,
      supplier: true,
      driver: true,
      storageLocation: true,
      facility: true,
    },
  });

  return result || null;
}

// Infer the type from the function return
export type FeedstockWithRelations = NonNullable<
  Awaited<ReturnType<typeof findByIdWithRelations>>
>;

export async function findAll(): Promise<Feedstock[]> {
  return db.select().from(feedstocks).orderBy(desc(feedstocks.createdAt));
}

export async function findAllWithRelations() {
  return db.query.feedstocks.findMany({
    with: {
      facility: true,
      feedstockType: true,
      supplier: true,
      driver: true,
      storageLocation: true,
    },
    orderBy: desc(feedstocks.createdAt),
  });
}

export async function findByFacility(facilityId: string): Promise<Feedstock[]> {
  return db
    .select()
    .from(feedstocks)
    .where(eq(feedstocks.facilityId, facilityId))
    .orderBy(desc(feedstocks.createdAt));
}

export async function findByStatus(
  status: "missing_data" | "complete"
): Promise<Feedstock[]> {
  return db
    .select()
    .from(feedstocks)
    .where(eq(feedstocks.status, status))
    .orderBy(desc(feedstocks.createdAt));
}

// ============================================
// MUTATIONS
// ============================================

export async function insert(data: NewFeedstock): Promise<Feedstock> {
  const [result] = await db
    .insert(feedstocks)
    .values({ ...data, updatedAt: new Date() })
    .returning();

  return result;
}

export async function update(
  id: string,
  data: Partial<Omit<Feedstock, "id" | "createdAt">>
): Promise<Feedstock> {
  const [result] = await db
    .update(feedstocks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(feedstocks.id, id))
    .returning();

  return result;
}

export async function remove(id: string): Promise<void> {
  await db.delete(feedstocks).where(eq(feedstocks.id, id));
}

// ============================================
// UTILITIES
// ============================================

export async function getNextCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FS-${year}-`;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedstocks)
    .where(sql`code LIKE ${prefix + "%"}`);

  return `${prefix}${String((result[0]?.count ?? 0) + 1).padStart(3, "0")}`;
}
