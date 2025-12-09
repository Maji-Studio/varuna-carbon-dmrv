/**
 * Sync Helper Functions
 *
 * Simple utilities for working with registry sync.
 */

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { registryIdentities } from '@/db/schema';
import type { RegistryEntityType, RegistryName } from '@/db/schema/registry';
import { getRegistryIdentities } from './registry-identity-service';
import { EXTERNAL_ENTITY_TYPES } from './sync-config';

/**
 * Check if an entity is fully synced to a registry
 * (all external entity types have been created)
 */
export async function isEntityFullySynced(
  entityType: RegistryEntityType,
  entityId: string,
  registryName: RegistryName = 'isometric'
): Promise<boolean> {
  const expectedTypes = EXTERNAL_ENTITY_TYPES[entityType] ?? [];
  const identities = await getRegistryIdentities(
    entityType,
    entityId,
    registryName
  );

  // Check that all expected external types are synced
  for (const extType of expectedTypes) {
    const identity = identities.find(
      (i) => i.externalEntityType === extType
    );
    if (!identity || identity.syncStatus !== 'synced' || !identity.externalId) {
      return false;
    }
  }

  return true;
}

/**
 * Get sync summary for an entity
 */
export async function getEntitySyncSummary(
  entityType: RegistryEntityType,
  entityId: string,
  registryName: RegistryName = 'isometric'
): Promise<{
  isFullySynced: boolean;
  steps: Array<{
    externalEntityType: string;
    externalId: string | null;
    syncStatus: string;
    lastSyncedAt: Date | null;
    error: string | null;
  }>;
}> {
  const identities = await getRegistryIdentities(
    entityType,
    entityId,
    registryName
  );

  const expectedTypes = EXTERNAL_ENTITY_TYPES[entityType] ?? [];

  const steps = expectedTypes.map((extType) => {
    const identity = identities.find(
      (i) => i.externalEntityType === extType
    );
    return {
      externalEntityType: extType,
      externalId: identity?.externalId ?? null,
      syncStatus: identity?.syncStatus ?? 'not_started',
      lastSyncedAt: identity?.lastSyncedAt ?? null,
      error: identity?.lastSyncError ?? null,
    };
  });

  const isFullySynced = steps.every(
    (s) => s.syncStatus === 'synced' && s.externalId
  );

  return { isFullySynced, steps };
}

/**
 * Get overall sync statistics for a registry
 */
export async function getRegistrySyncStats(
  registryName: RegistryName = 'isometric'
): Promise<{
  total: number;
  pending: number;
  syncing: number;
  synced: number;
  error: number;
}> {
  const allIdentities = await db.query.registryIdentities.findMany({
    where: eq(registryIdentities.registryName, registryName),
  });

  return {
    total: allIdentities.length,
    pending: allIdentities.filter((i) => i.syncStatus === 'pending').length,
    syncing: allIdentities.filter((i) => i.syncStatus === 'syncing').length,
    synced: allIdentities.filter((i) => i.syncStatus === 'synced').length,
    error: allIdentities.filter((i) => i.syncStatus === 'error').length,
  };
}
