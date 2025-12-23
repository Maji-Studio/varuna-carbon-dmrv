# TODO: Schema & Form Gaps

Inconsistencies discovered between Figma mobile data entry forms and the database schema.

> Completed items have been archived to `archived/TODO-schema-form-gaps-completed.md`

## Priority 1: Required Schema Changes

### 1. ~~Add `notes` field to `feedstocks` table~~ DONE

**Resolved**: Added `notes` field to feedstocks schema and actions.

### 2. Create `documents` table for photo/video uploads

**Issue**: All forms (Feedstock, Sampling, Incident, Biochar Product) have photo/video upload functionality, but there's no storage schema for media files.

```typescript
// src/db/schema/documents.ts
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  filename: text("filename"),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),

  // Polymorphic reference
  entityType: text("entity_type").notNull(), // 'feedstock', 'sample', 'incident_report', 'biochar_product'
  entityId: uuid("entity_id").notNull(),

  uploadedBy: uuid("uploaded_by"), // user/operator reference
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Note**: Will also need file upload infrastructure (S3/R2 bucket, presigned URLs, etc.)

---

## Priority 2: Schema Design Decisions Needed

### 3. ~~Production Run - Multiple Feedstock Sources~~ DECIDED

**Decision**: Use JSON in `feedstockMix` field (simpler approach).

**Implementation**: Production run actions now store feedstock inputs as JSON:

```typescript
feedstockMix: JSON.stringify([
  { storageLocationId: "uuid", amountKg: 150 },
  ...
]);
```

The first feedstock source is also stored in `feedstockStorageLocationId` for backward compatibility.

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

## Workarounds Applied

| Issue                                  | Workaround                                                                  |
| -------------------------------------- | --------------------------------------------------------------------------- |
| Sampling/Incident missing `facilityId` | Form uses Production Run dropdown instead; facility derived from PR         |
| Multi-feedstock inputs                 | JSON stored in `feedstockMix`, first source in `feedstockStorageLocationId` |
| Photo uploads                          | UI shown but not persisted (documents table pending)                        |

---

## File References

### Page-Based Forms (Primary)

- Hub: `src/app/data-entry/page.tsx`
- Feedstock: `src/app/data-entry/feedstock/`
- Production Run: `src/app/data-entry/production-run/`
- Sampling: `src/app/data-entry/sampling/`
- Incident: `src/app/data-entry/incident/`
- Biochar Product: `src/app/data-entry/biochar-product/`

### Form Components

- Field components: `src/components/forms/form-field.tsx` (with required indicator support)
- Toast: `src/components/ui/sonner.tsx`
- Incomplete entries list: `src/components/data-entry/incomplete-entries-section.tsx`
- Relative time helper: `src/lib/utils.ts` (`formatRelativeTime`)

### Database Schemas

- `src/db/schema/feedstock.ts`
- `src/db/schema/production.ts`
- `src/db/schema/products.ts`

### Validations

- `src/lib/validations/data-entry.ts`

---

## Historical Notes

### TanStack Form Pattern

The page-based forms in `src/app/data-entry/` use:

- `useAppForm` hook from `form-context.tsx`
- `form.AppField` component for field rendering
- `form.state.isSubmitting` for submit state
- Reusable field components (`SelectField`, `NumberField`, `DatePickerField`, etc.)

**Pattern:**

```tsx
const form = useAppForm({
  defaultValues: { ... },
  onSubmit: async ({ value }) => {
    await createRecord(value);
    router.push("/data-entry");
  },
});

<form.AppField name="facilityId">
  {(field) => (
    <field.SelectField
      label="Facility"
      options={facilityOptions}
    />
  )}
</form.AppField>
```

### Remaining TODO

- Photo uploads not persisted (documents table pending)
- Form-level Zod validation not yet connected (only field-level validators used; server-side validation with toast errors now working)
- Clarify how the distance is automatically calculated, as drivers can have different routes.

### Configurable Fuel Consumption Factors

Currently hardcoded in `src/lib/constants/transport.ts`:

- truck: 0.30 L/km
- pickup: 0.15 L/km
- tractor: 0.25 L/km

**Future improvements:**

1. Add admin-configurable fuel factors table in database
2. Allow per-facility overrides
3. Support different factors by vehicle age/model
4. Integration with emission factor databases

---

## Known Issues - Not Yet Fixed

### 1. Re-export pattern broken in "use server" files

**Files:** `sampling/actions.ts`, `incident/actions.ts`
**Symptom:** Build fails with "Export doesn't exist in target module"

```typescript
// This pattern doesn't work in "use server" files with Turbopack
export { getProductionRunsForDropdown as getProductionRunsForSampling } from "@/lib/actions/utils";
```

**Fix:** Move the function into each file or restructure imports.

### 2. PhotoUpload state never used (memory leak risk)

**Files:** All 6 form components

```typescript
const [photos, setPhotos] = React.useState<File[]>([]); // Created but never sent to server
```

**Fix:** Either integrate with document upload or remove the state.

### 3. Zod schemas defined but never validated at runtime

**File:** `src/lib/validations/data-entry.ts`

- 6 Zod schemas exist but `.parse()` / `.safeParse()` never called
- Currently only used as TypeScript types
  **Impact:** Invalid data could be saved to database

### 4. Unused completion functions (orphaned code)

**File:** `src/lib/completion-checks.ts`

- `isSamplingComplete()` - never called
- `isIncidentComplete()` - never called
- `isBiocharProductComplete()` - only called in form, not in actions

### 5. Code duplication (not critical but technical debt)

- Code generation function duplicated 4x (~80 lines)
- Delete handler duplicated 6x in form components
- Option conversion (`map(f => ({value: f.id, label: f.name}))`) duplicated 6x
- Revalidation pattern (`revalidatePath`) repeated 30+ times

### 6. Production run has dual state for feedstock inputs

**File:** `production-run-form.tsx`

- TanStack Form state has `feedstockAmountKg`
- Separate React state has `feedstockInputs` array
- Two sources of truth - could cause sync issues
