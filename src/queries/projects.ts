/**
 * QUERIES: Projects
 *
 * React Query query option factories.
 * Define cache keys and query functions for TanStack Query.
 *
 * These are used by hooks/ to create useQuery calls.
 */

import { queryOptions } from '@tanstack/react-query';
// import { getProjectsFn } from '@/fn/projects';

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

// export function getProjectsQuery() {
//   return queryOptions({
//     queryKey: projectKeys.lists(),
//     queryFn: () => getProjectsFn(),
//   });
// }

// export function getProjectQuery(id: string) {
//   return queryOptions({
//     queryKey: projectKeys.detail(id),
//     queryFn: () => getProjectByIdFn(id),
//   });
// }
