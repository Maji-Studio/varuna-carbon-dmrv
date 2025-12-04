import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { documentationEntityType, documentationType } from './common';

// ============================================
// Documentation - Polymorphic attachments
// Supports attachments across all entities
// ============================================

// Type for attachment JSON structure
export type Attachment = {
  fileUrl: string;
  fileType: 'photo' | 'video' | 'pdf';
};

export const documentation = pgTable('documentation', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Polymorphic reference
  entityType: documentationEntityType('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),

  // Content
  createdBy: text('created_by'), // User name who created
  notes: text('notes'),

  // Attachments stored as JSONB array
  // Structure: [{ fileUrl: string, fileType: 'photo' | 'video' | 'pdf' }]
  attachments: jsonb('attachments').$type<Attachment[]>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Note: Relations for polymorphic tables are typically handled at the application level
// rather than through Drizzle relations, since the entityType determines which table
// the entityId references.
