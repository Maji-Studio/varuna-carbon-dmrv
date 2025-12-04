/**
 * Shared TypeScript types
 *
 * For database types, prefer inferring from Drizzle schema:
 * import { projects } from '@/db/schema';
 * export type Project = typeof projects.$inferSelect;
 * export type NewProject = typeof projects.$inferInsert;
 */

// Common utility types
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
