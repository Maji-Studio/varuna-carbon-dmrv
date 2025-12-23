/**
 * Standard result type for server actions
 */
export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };
