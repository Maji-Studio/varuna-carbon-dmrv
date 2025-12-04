/**
 * DATA-ACCESS LAYER: Batches
 *
 * Database operations for biochar production batches.
 */

import { db } from '@/db';
// import { batches } from '@/db/schema';
// import { eq } from 'drizzle-orm';

// export async function createBatch(data: NewBatch) {
//   const [batch] = await db.insert(batches).values(data).returning();
//   return batch;
// }

// export async function getBatchById(id: string) {
//   return db.query.batches.findFirst({
//     where: eq(batches.id, id),
//   });
// }

// export async function getBatchesByProject(projectId: string) {
//   return db.query.batches.findMany({
//     where: eq(batches.projectId, projectId),
//   });
// }
