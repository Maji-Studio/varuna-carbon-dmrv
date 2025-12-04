/**
 * HOOKS: Projects
 *
 * React hooks for project data fetching and mutations.
 * Uses React Query for caching and state management.
 *
 * These hooks:
 * - Wrap queries/ with useQuery
 * - Handle mutations with useMutation
 * - Manage cache invalidation
 * - Provide loading/error states to components
 */

'use client';

// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { getProjectsQuery, projectKeys } from '@/queries/projects';
// import { createProjectFn } from '@/fn/projects';

// export function useProjects() {
//   return useQuery(getProjectsQuery());
// }

// export function useCreateProject() {
//   const queryClient = useQueryClient();
//
//   return useMutation({
//     mutationFn: createProjectFn,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: projectKeys.all });
//     },
//   });
// }

// Combined hook for convenience
// export function useProjectManagement() {
//   const projects = useProjects();
//   const createProject = useCreateProject();
//
//   return {
//     projects: projects.data ?? [],
//     isLoading: projects.isLoading,
//     error: projects.error,
//     createProject: createProject.mutate,
//     isCreating: createProject.isPending,
//   };
// }
