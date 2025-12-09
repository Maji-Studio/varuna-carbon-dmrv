# TODO: Schema & Form Gaps

Inconsistencies discovered between Figma mobile data entry forms and the database schema.

## Priority 1: Required Schema Changes

### 1. Add `notes` field to `feedstocks` table

**Issue**: Figma form has Notes textarea, but `feedstocks` table has no `notes` column.

```sql
ALTER TABLE feedstocks ADD COLUMN notes TEXT;
```

Or in Drizzle schema (`src/db/schema/feedstock.ts`):
```typescript
notes: text('notes'),
```

### 2. Create `documents` table for photo/video uploads

**Issue**: All forms (Feedstock, Sampling, Incident, Biochar Product) have photo/video upload functionality, but there's no storage schema for media files.

```typescript
// src/db/schema/documents.ts
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  url: text('url').notNull(),
  filename: text('filename'),
  mimeType: text('mime_type'),
  sizeBytes: integer('size_bytes'),

  // Polymorphic reference
  entityType: text('entity_type').notNull(), // 'feedstock', 'sample', 'incident_report', 'biochar_product'
  entityId: uuid('entity_id').notNull(),

  uploadedBy: uuid('uploaded_by'), // user/operator reference
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Note**: Will also need file upload infrastructure (S3/R2 bucket, presigned URLs, etc.)

---

## Priority 2: Schema Design Decisions Needed

### 3. Production Run - Multiple Feedstock Sources

**Issue**: Figma shows "Add Feedstock Source" button allowing multiple feedstock inputs per production run. Current schema only has single `feedstockStorageLocationId` and `feedstockAmountKg`.

**Options**:
1. **New join table** (recommended for proper data modeling):
   ```typescript
   export const productionRunFeedstockInputs = pgTable('production_run_feedstock_inputs', {
     id: uuid('id').primaryKey().defaultRandom(),
     productionRunId: uuid('production_run_id').notNull().references(() => productionRuns.id),
     storageLocationId: uuid('storage_location_id').notNull().references(() => storageLocations.id),
     amountKg: real('amount_kg').notNull(),
     createdAt: timestamp('created_at').defaultNow().notNull(),
   });
   ```

2. **Use existing `feedstockMix` text field as JSON**:
   ```typescript
   // Store as JSON array
   feedstockMix: '[{"storageLocationId": "uuid", "amountKg": 150}, ...]'
   ```

**Current workaround**: Form uses local state array, but only sends first item or aggregated data on submit.

---

## Priority 3: Form UX vs. Schema Derivation

### 4. Sampling & Incident Forms - Facility Field

**Issue**: Figma shows Facility selector in Sampling and Incident forms, but both tables only reference `productionRunId` (facility is derived through the production run).

**Resolution**: Keep Facility field in forms for filtering (reactors, operators, etc.) but:
- On submit, derive `facilityId` from the linked production run
- Or add optional `facilityId` FK to `samples` and `incidentReports` tables for denormalization

### 5. Biochar Product - Missing `linkedProductionRunId` in Form

**Issue**: Database has `linkedProductionRunId` FK but Figma form doesn't show it.

**Resolution**: Could be:
- Auto-linked based on biochar source storage selection
- Added as optional advanced field
- Set programmatically based on business logic

---

## Completed

- [x] All 5 data entry forms built
- [x] Form validation schemas created (`src/lib/validations/data-entry.ts`)
- [x] Base form components (FormSheet, FormSection, PhotoUpload, etc.)
- [x] TypeScript errors resolved

---

## File References

- Forms: `src/components/forms/data-entry/`
- Schemas: `src/db/schema/feedstock.ts`, `production.ts`, `products.ts`
- Validations: `src/lib/validations/data-entry.ts`
