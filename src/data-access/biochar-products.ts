/**
 * DATA-ACCESS: Biochar Products
 *
 * Pure database operations for biochar products.
 * No business logic - just CRUD operations.
 */

import { eq, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { biocharProducts } from "@/db/schema";

// ============================================
// TYPES
// ============================================

export type BiocharProduct = typeof biocharProducts.$inferSelect;
export type NewBiocharProduct = typeof biocharProducts.$inferInsert;

// ============================================
// QUERIES
// ============================================

export async function findById(id: string): Promise<BiocharProduct | null> {
  const [result] = await db
    .select()
    .from(biocharProducts)
    .where(eq(biocharProducts.id, id))
    .limit(1);

  return result || null;
}

export async function findByIdWithRelations(id: string) {
  const result = await db.query.biocharProducts.findFirst({
    where: eq(biocharProducts.id, id),
    with: {
      facility: true,
      formulation: true,
      storageLocation: true,
      biocharSourceStorage: true,
    },
  });

  return result || null;
}

// Infer the type from the function return
export type BiocharProductWithRelations = NonNullable<
  Awaited<ReturnType<typeof findByIdWithRelations>>
>;

export async function findAll(): Promise<BiocharProduct[]> {
  return db.select().from(biocharProducts).orderBy(desc(biocharProducts.createdAt));
}

export async function findAllWithRelations() {
  return db.query.biocharProducts.findMany({
    with: {
      facility: true,
      formulation: true,
      storageLocation: true,
      biocharSourceStorage: true,
    },
    orderBy: desc(biocharProducts.createdAt),
  });
}

export async function findByFacility(facilityId: string): Promise<BiocharProduct[]> {
  return db
    .select()
    .from(biocharProducts)
    .where(eq(biocharProducts.facilityId, facilityId))
    .orderBy(desc(biocharProducts.createdAt));
}

// ============================================
// MUTATIONS
// ============================================

export async function insert(data: NewBiocharProduct): Promise<BiocharProduct> {
  const [result] = await db
    .insert(biocharProducts)
    .values({ ...data, updatedAt: new Date() })
    .returning();

  return result;
}

export async function update(
  id: string,
  data: Partial<Omit<BiocharProduct, "id" | "createdAt">>
): Promise<BiocharProduct> {
  const [result] = await db
    .update(biocharProducts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(biocharProducts.id, id))
    .returning();

  return result;
}

export async function remove(id: string): Promise<void> {
  await db.delete(biocharProducts).where(eq(biocharProducts.id, id));
}

// ============================================
// UTILITIES
// ============================================

export async function getNextCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `BP-${year}-`;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(biocharProducts)
    .where(sql`code LIKE ${prefix + "%"}`);

  return `${prefix}${String((result[0]?.count ?? 0) + 1).padStart(3, "0")}`;
}
