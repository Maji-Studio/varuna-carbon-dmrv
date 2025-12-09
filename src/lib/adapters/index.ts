/**
 * Registry Adapters
 *
 * Registry-agnostic adapter pattern for syncing local DMRV data
 * to external carbon credit registries.
 *
 * Currently supported registries:
 * - Isometric (https://isometric.com)
 *
 * Future registries can be added by implementing the RegistryAdapter interface.
 */

// Common types
export type {
  SyncResult,
  RegistryAdapter,
  AdapterConfig,
  SyncTrigger,
} from './types';

// Isometric adapter
export {
  isometricAdapter,
  IsometricAdapter,
  syncAllPending,
  retryAllFailed,
  confirmGHGStatements,
  getSyncSummary,
  type SyncStats,
  type SyncOptions,
} from './isometric';
