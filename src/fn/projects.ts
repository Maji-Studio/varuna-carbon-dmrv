/**
 * SERVER FUNCTIONS: Projects
 *
 * Server-side functions callable from the client.
 * Handles validation, auth, business logic, and DB access.
 */

'use server';

// import { z } from 'zod';
// import { createProject, getAllProjects, getProjectById } from '@/data-access/projects';

// const createProjectSchema = z.object({
//   name: z.string().min(1, 'Name is required'),
//   description: z.string().optional(),
//   protocolVersion: z.string().default('1.1'),
// });

// export async function createProjectFn(input: z.infer<typeof createProjectSchema>) {
//   // Auth check
//   // const session = await auth();
//   // if (!session) throw new Error('Unauthorized');
//
//   // Validate
//   const validated = createProjectSchema.parse(input);
//
//   // Business logic + DB operation
//   const project = await createProject({
//     ...validated,
//     status: 'draft',
//     monitoringPlan: null,
//     riskAssessment: null,
//   });
//
//   return project;
// }

// export async function getProjectsFn() {
//   return getAllProjects();
// }

// export async function getProjectByIdFn(id: string) {
//   return getProjectById(id);
// }
