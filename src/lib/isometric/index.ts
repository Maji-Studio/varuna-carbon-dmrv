/**
 * Isometric API Integration
 *
 * This module provides a client for interacting with both Isometric Registry
 * and Certify (MRV) APIs.
 *
 * @example
 * ```typescript
 * import { isometric } from '@/lib/isometric';
 *
 * // Get current organization
 * const org = await isometric.getOrganisation();
 *
 * // List projects
 * const projects = await isometric.listProjects();
 *
 * // Create a removal
 * const removal = await isometric.createRemoval({
 *   project_id: 'proj_123',
 *   removal_template_id: 'template_456',
 *   reporting_period_start: '2024-01-01',
 *   reporting_period_end: '2024-03-31',
 * });
 * ```
 *
 * @see https://docs.isometric.com/api-reference/authentication
 */

export { IsometricClient, IsometricApiError, isometric } from './client';
export * from './types';
