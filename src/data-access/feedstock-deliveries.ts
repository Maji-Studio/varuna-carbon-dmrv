/**
 * DATA-ACCESS: Feedstock Deliveries
 *
 * Pure database operations for feedstock deliveries.
 * No business logic - just CRUD operations.
 */

import { eq, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { feedstockDeliveries } from "@/db/schema";

// ============================================
// TYPES
// ============================================

export type FeedstockDelivery = typeof feedstockDeliveries.$inferSelect;
export type NewFeedstockDelivery = typeof feedstockDeliveries.$inferInsert;

// ============================================
// QUERIES
// ============================================

export async function findById(id: string): Promise<FeedstockDelivery | null> {
  const [result] = await db
    .select()
    .from(feedstockDeliveries)
    .where(eq(feedstockDeliveries.id, id))
    .limit(1);

  return result || null;
}

export async function findByIdWithRelations(id: string) {
  const result = await db.query.feedstockDeliveries.findFirst({
    where: eq(feedstockDeliveries.id, id),
    with: {
      feedstockType: true,
      supplier: true,
      driver: true,
      vehicle: true,
      facility: true,
    },
  });

  return result || null;
}

// Infer the type from the function return
export type FeedstockDeliveryWithRelations = NonNullable<
  Awaited<ReturnType<typeof findByIdWithRelations>>
>;

export async function findAll(): Promise<FeedstockDelivery[]> {
  return db.select().from(feedstockDeliveries).orderBy(desc(feedstockDeliveries.createdAt));
}

export async function findAllWithRelations() {
  return db.query.feedstockDeliveries.findMany({
    with: {
      facility: true,
      feedstockType: true,
      supplier: true,
      driver: true,
      vehicle: true,
    },
    orderBy: desc(feedstockDeliveries.createdAt),
  });
}

export async function findByFacility(facilityId: string): Promise<FeedstockDelivery[]> {
  return db
    .select()
    .from(feedstockDeliveries)
    .where(eq(feedstockDeliveries.facilityId, facilityId))
    .orderBy(desc(feedstockDeliveries.createdAt));
}

export async function findByStatus(
  status: "missing_data" | "complete"
): Promise<FeedstockDelivery[]> {
  return db
    .select()
    .from(feedstockDeliveries)
    .where(eq(feedstockDeliveries.status, status))
    .orderBy(desc(feedstockDeliveries.createdAt));
}

// ============================================
// MUTATIONS
// ============================================

export async function insert(data: NewFeedstockDelivery): Promise<FeedstockDelivery> {
  const [result] = await db
    .insert(feedstockDeliveries)
    .values({ ...data, updatedAt: new Date() })
    .returning();

  return result;
}

export async function update(
  id: string,
  data: Partial<Omit<FeedstockDelivery, "id" | "createdAt">>
): Promise<FeedstockDelivery> {
  const [result] = await db
    .update(feedstockDeliveries)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(feedstockDeliveries.id, id))
    .returning();

  return result;
}

export async function remove(id: string): Promise<void> {
  await db.delete(feedstockDeliveries).where(eq(feedstockDeliveries.id, id));
}

// ============================================
// UTILITIES
// ============================================

export async function getNextCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FD-${year}-`;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedstockDeliveries)
    .where(sql`code LIKE ${prefix + "%"}`);

  return `${prefix}${String((result[0]?.count ?? 0) + 1).padStart(3, "0")}`;
}
