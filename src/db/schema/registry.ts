import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { syncStatus } from './common';

// ============================================
// Registry Identities - Polymorphic external ID tracking
// Maps local entities to external registry entities
// Supports multiple registries (Isometric, Puro, Verra, etc.)
// ============================================

/**
 * Entity types that can be synced to registries.
 * Uses singular naming to match documentationEntityType pattern.
 */
export type RegistryEntityType =
  | 'facility'
  | 'feedstock_type'
  | 'production_run'
  | 'application'
  | 'credit_batch';

/**
 * Registry names - extensible for future registries
 */
export type RegistryName = 'isometric' | 'puro' | 'verra';

/**
 * External entity types by registry.
 * Isometric entities:
 * - facility: Maps to Isometric Facility
 * - feedstock_type: Maps to Isometric FeedstockType
 * - production_batch: Maps to Isometric ProductionBatch
 * - storage_location: Maps to Isometric StorageLocation (field for biochar application)
 * - biochar_application: Maps to Isometric BiocharApplication (spreading event)
 * - removal: Maps to Isometric Removal (CO2e claim)
 * - ghg_statement: Maps to Isometric GHGStatement (verification submission)
 */
export type IsometricExternalEntityType =
  | 'facility'
  | 'feedstock_type'
  | 'production_batch'
  | 'storage_location'
  | 'biochar_application'
  | 'removal'
  | 'ghg_statement';

/**
 * Metadata type for registry-specific extras
 */
export type RegistryIdentityMetadata = {
  projectId?: string;
  removalTemplateId?: string;
  [key: string]: unknown;
};

/**
 * Registry identities table - tracks sync state for all entity-registry combinations.
 *
 * Design decisions:
 * - Uses text for entityType instead of pgEnum for flexibility with new entity types
 * - Uses text for registryName to allow adding new registries without migrations
 * - Uses text for externalEntityType as it varies by registry
 * - Unique constraint on (entityType, entityId, registryName, externalEntityType)
 *   allows one local entity to have multiple external IDs (e.g., application -> storage_location + biochar_application)
 *
 * Example rows for an application entity:
 * | entityType  | entityId | registryName | externalEntityType   | externalId  |
 * |-------------|----------|--------------|---------------------|-------------|
 * | application | uuid-123 | isometric    | storage_location    | stl_abc123  |
 * | application | uuid-123 | isometric    | biochar_application | bap_xyz789  |
 */
export const registryIdentities = pgTable(
  'registry_identities',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // --- Local Entity Reference (polymorphic) ---
    // The entity type in our system (singular naming)
    entityType: text('entity_type').notNull(),
    // The UUID of the entity in our local database
    entityId: uuid('entity_id').notNull(),

    // --- Registry Information ---
    // Which registry this identity belongs to
    registryName: text('registry_name').notNull(),
    // The type of entity in the external registry
    // This varies by registry - e.g., Isometric has 'storage_location' + 'biochar_application' for our 'application'
    externalEntityType: text('external_entity_type').notNull(),
    // The ID assigned by the external registry (null until successfully synced)
    externalId: text('external_id'),

    // --- Sync Tracking ---
    // Current sync status: pending, syncing, synced, error
    syncStatus: syncStatus('sync_status').default('pending').notNull(),
    // When the entity was last successfully synced
    lastSyncedAt: timestamp('last_synced_at'),
    // Error message if sync failed
    lastSyncError: text('last_sync_error'),

    // --- Metadata ---
    // Registry-specific data (e.g., projectId, removalTemplateId)
    metadata: jsonb('metadata').$type<RegistryIdentityMetadata>(),

    // --- Timestamps ---
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    // Ensure unique combination: one external entity type per entity per registry
    // This allows an application to have both storage_location and biochar_application entries
    uniqueIndex('registry_identities_unique_idx').on(
      table.entityType,
      table.entityId,
      table.registryName,
      table.externalEntityType
    ),
  ]
);

// Type exports for use in application code
export type RegistryIdentity = typeof registryIdentities.$inferSelect;
export type NewRegistryIdentity = typeof registryIdentities.$inferInsert;
