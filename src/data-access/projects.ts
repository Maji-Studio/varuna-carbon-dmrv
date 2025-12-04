/**
 * DATA-ACCESS LAYER: Projects
 *
 * Pure database operations using Drizzle ORM.
 * No business logic here - just CRUD operations.
 *
 * These functions are called by:
 * - use-cases/ (for complex business logic)
 * - fn/ (for simple server functions)
 */

import { db } from '@/db';
// import { projects } from '@/db/schema';
// import { eq } from 'drizzle-orm';

// Example:
// export async function createProject(data: NewProject) {
//   const [project] = await db.insert(projects).values(data).returning();
//   return project;
// }

// export async function getProjectById(id: string) {
//   return db.query.projects.findFirst({
//     where: eq(projects.id, id),
//   });
// }

// export async function getAllProjects() {
//   return db.query.projects.findMany();
// }
