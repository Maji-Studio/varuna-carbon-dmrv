/**
 * Shared TypeScript types
 *
 * For database types, prefer inferring from Drizzle schema:
 * import { projects } from '@/db/schema';
 * export type Project = typeof projects.$inferSelect;
 * export type NewProject = typeof projects.$inferInsert;
 */

// Re-export action types
export * from './actions';

// Common utility types
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
