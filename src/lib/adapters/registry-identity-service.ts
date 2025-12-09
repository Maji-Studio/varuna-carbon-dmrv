/**
 * Registry Identity Service
 *
 * Manages the registry_identities table for tracking sync state
 * across multiple registries. Provides CRUD operations and
 * sync status management.
 */

import { eq, and, or, gt, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { registryIdentities } from '@/db/schema';
import type {
  RegistryIdentity,
  RegistryEntityType,
  RegistryName,
  RegistryIdentityMetadata,
} from '@/db/schema/registry';
import type { SyncStatus } from './types';

// ============================================
// Core CRUD Operations
// ============================================

/**
 * Get or create a registry identity record for an entity.
 * If the record exists, returns it. Otherwise creates a new pending record.
 */
export async function getOrCreateRegistryIdentity(
  entityType: RegistryEntityType,
  entityId: string,
  registryName: RegistryName,
  externalEntityType: string
): Promise<RegistryIdentity> {
  // Try to find existing
  const existing = await db.query.registryIdentities.findFirst({
    where: and(
      eq(registryIdentities.entityType, entityType),
      eq(registryIdentities.entityId, entityId),
      eq(registryIdentities.registryName, registryName),
      eq(registryIdentities.externalEntityType, externalEntityType)
    ),
  });

  if (existing) {
    return existing;
  }

  // Create new pending record
  const [created] = await db
    .insert(registryIdentities)
    .values({
      entityType,
      entityId,
      registryName,
      externalEntityType,
      syncStatus: 'pending',
    })
    .returning();

  return created;
}

/**
 * Get a specific registry identity by all its keys
 */
export async function getRegistryIdentity(
  entityType: RegistryEntityType,
  entityId: string,
  registryName: RegistryName,
  externalEntityType: string
): Promise<RegistryIdentity | null> {
  const identity = await db.query.registryIdentities.findFirst({
    where: and(
      eq(registryIdentities.entityType, entityType),
      eq(registryIdentities.entityId, entityId),
      eq(registryIdentities.registryName, registryName),
      eq(registryIdentities.externalEntityType, externalEntityType)
    ),
  });

  return identity ?? null;
}

/**
 * Get all registry identities for an entity (across all registries and external types)
 */
export async function getRegistryIdentities(
  entityType: RegistryEntityType,
  entityId: string,
  registryName?: RegistryName
): Promise<RegistryIdentity[]> {
  const conditions = [
    eq(registryIdentities.entityType, entityType),
    eq(registryIdentities.entityId, entityId),
  ];

  if (registryName) {
    conditions.push(eq(registryIdentities.registryName, registryName));
  }

  return db.query.registryIdentities.findMany({
    where: and(...conditions),
  });
}

/**
 * Get the external ID for a specific entity/registry/external-type combo
 */
export async function getExternalId(
  entityType: RegistryEntityType,
  entityId: string,
  registryName: RegistryName,
  externalEntityType: string
): Promise<string | null> {
  const identity = await getRegistryIdentity(
    entityType,
    entityId,
    registryName,
    externalEntityType
  );
  return identity?.externalId ?? null;
}

// ============================================
// Status Update Operations
// ============================================

/**
 * Update a registry identity record
 */
export async function updateRegistryIdentity(
  id: string,
  updates: {
    externalId?: string;
    syncStatus?: SyncStatus;
    lastSyncedAt?: Date;
    lastSyncError?: string | null;
    metadata?: RegistryIdentityMetadata;
  }
): Promise<void> {
  await db
    .update(registryIdentities)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(registryIdentities.id, id));
}

/**
 * Mark a registry identity as syncing (in progress)
 */
export async function markSyncing(id: string): Promise<void> {
  await updateRegistryIdentity(id, { syncStatus: 'syncing' });
}

/**
 * Mark a registry identity as successfully synced
 */
export async function markSynced(
  id: string,
  externalId: string,
  metadata?: RegistryIdentityMetadata
): Promise<void> {
  await updateRegistryIdentity(id, {
    externalId,
    syncStatus: 'synced',
    lastSyncedAt: new Date(),
    lastSyncError: null,
    metadata,
  });
}

/**
 * Mark a registry identity as errored
 */
export async function markError(id: string, error: string): Promise<void> {
  await updateRegistryIdentity(id, {
    syncStatus: 'error',
    lastSyncError: error,
  });
}

/**
 * Reset a registry identity to pending (for retry)
 */
export async function resetToPending(id: string): Promise<void> {
  await updateRegistryIdentity(id, {
    syncStatus: 'pending',
    lastSyncError: null,
  });
}

// ============================================
// Query Operations
// ============================================

/**
 * Find all registry identities that need syncing for a given entity type.
 *
 * An identity needs syncing if:
 * 1. syncStatus is 'pending', OR
 * 2. syncStatus is 'error' (if includeErrors is true)
 */
export async function findIdentitiesNeedingSync(
  entityType: RegistryEntityType,
  registryName: RegistryName,
  externalEntityType: string,
  options: {
    includeErrors?: boolean;
    limit?: number;
  } = {}
): Promise<RegistryIdentity[]> {
  const { includeErrors = false, limit = 100 } = options;

  const statusFilter = includeErrors
    ? or(
        eq(registryIdentities.syncStatus, 'pending'),
        eq(registryIdentities.syncStatus, 'error')
      )
    : eq(registryIdentities.syncStatus, 'pending');

  return db.query.registryIdentities.findMany({
    where: and(
      eq(registryIdentities.entityType, entityType),
      eq(registryIdentities.registryName, registryName),
      eq(registryIdentities.externalEntityType, externalEntityType),
      statusFilter
    ),
    limit,
  });
}

/**
 * Check if a sync step is already complete for an entity
 */
export async function isSyncStepComplete(
  entityType: RegistryEntityType,
  entityId: string,
  registryName: RegistryName,
  externalEntityType: string
): Promise<boolean> {
  const identity = await getRegistryIdentity(
    entityType,
    entityId,
    registryName,
    externalEntityType
  );

  return identity?.syncStatus === 'synced' && identity?.externalId != null;
}

/**
 * Check if all sync steps are complete for an entity
 */
export async function areAllSyncStepsComplete(
  entityType: RegistryEntityType,
  entityId: string,
  registryName: RegistryName,
  externalEntityTypes: string[]
): Promise<boolean> {
  const identities = await getRegistryIdentities(
    entityType,
    entityId,
    registryName
  );

  for (const extType of externalEntityTypes) {
    const identity = identities.find((i) => i.externalEntityType === extType);
    if (!identity || identity.syncStatus !== 'synced' || !identity.externalId) {
      return false;
    }
  }

  return true;
}

/**
 * Get sync status summary for a registry
 */
export async function getSyncStatusSummary(
  registryName: RegistryName
): Promise<{
  byEntityType: Record<
    string,
    {
      pending: number;
      syncing: number;
      synced: number;
      error: number;
    }
  >;
  total: {
    pending: number;
    syncing: number;
    synced: number;
    error: number;
  };
}> {
  const identities = await db.query.registryIdentities.findMany({
    where: eq(registryIdentities.registryName, registryName),
  });

  const byEntityType: Record<
    string,
    { pending: number; syncing: number; synced: number; error: number }
  > = {};
  const total = { pending: 0, syncing: 0, synced: 0, error: 0 };

  for (const identity of identities) {
    if (!byEntityType[identity.entityType]) {
      byEntityType[identity.entityType] = {
        pending: 0,
        syncing: 0,
        synced: 0,
        error: 0,
      };
    }
    byEntityType[identity.entityType][
      identity.syncStatus as keyof typeof total
    ]++;
    total[identity.syncStatus as keyof typeof total]++;
  }

  return { byEntityType, total };
}

/**
 * Find registry identity by external ID (for reverse lookup)
 */
export async function findByExternalId(
  registryName: RegistryName,
  externalId: string
): Promise<RegistryIdentity | null> {
  const identity = await db.query.registryIdentities.findFirst({
    where: and(
      eq(registryIdentities.registryName, registryName),
      eq(registryIdentities.externalId, externalId)
    ),
  });

  return identity ?? null;
}

// ============================================
// Batch Operations
// ============================================

/**
 * Create registry identity records for multiple sync steps at once
 */
export async function ensureRegistryIdentities(
  entityType: RegistryEntityType,
  entityId: string,
  registryName: RegistryName,
  externalEntityTypes: string[]
): Promise<RegistryIdentity[]> {
  const identities: RegistryIdentity[] = [];

  for (const externalEntityType of externalEntityTypes) {
    const identity = await getOrCreateRegistryIdentity(
      entityType,
      entityId,
      registryName,
      externalEntityType
    );
    identities.push(identity);
  }

  return identities;
}

/**
 * Delete all registry identities for an entity (for cleanup/testing)
 */
export async function deleteRegistryIdentities(
  entityType: RegistryEntityType,
  entityId: string,
  registryName?: RegistryName
): Promise<void> {
  const conditions = [
    eq(registryIdentities.entityType, entityType),
    eq(registryIdentities.entityId, entityId),
  ];

  if (registryName) {
    conditions.push(eq(registryIdentities.registryName, registryName));
  }

  await db.delete(registryIdentities).where(and(...conditions));
}
