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

### 3. Production Run - Multiple Feedstock Sources

**Issue**: Figma shows "Add Feedstock Source" button allowing multiple feedstock inputs per production run. Current schema only has single `feedstockStorageLocationId` and `feedstockAmountKg`.

**Options**:

1. **New join table** (recommended for proper data modeling):

   ```typescript
   export const productionRunFeedstockInputs = pgTable("production_run_feedstock_inputs", {
     id: uuid("id").primaryKey().defaultRandom(),
     productionRunId: uuid("production_run_id")
       .notNull()
       .references(() => productionRuns.id),
     storageLocationId: uuid("storage_location_id")
       .notNull()
       .references(() => storageLocations.id),
     amountKg: real("amount_kg").notNull(),
     createdAt: timestamp("created_at").defaultNow().notNull(),
   });
   ```

2. **Use existing `feedstockMix` text field as JSON**:
   ```typescript
   // Store as JSON array
   feedstockMix: '[{"storageLocationId": "uuid", "amountKg": 150}, ...]';
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

The review of your current implementation for mobile-data-input reveals several critical issues when compared to TanStack Form best practices.
Critique Summary
The current implementation is incomplete and disconnected. You have set up the infrastructure for a powerful, reusable form system (form-context.tsx, form-field.tsx), but the actual form (BiocharProductForm) ignores it entirely, resulting in verbose boilerplate, missing validation, and broken abstractions.
Key Issues Identified

1. Validation is Missing (Critical)
   Although you defined Zod schemas in src/lib/validations/data-entry.ts, they are not connected to the form. The useForm hook in BiocharProductForm does not pass a validators or validatorAdapter prop.
   Consequence: Users can submit empty or invalid data. The Zod schemas are currently just unused code.
   Fix: You need to use the zodValidator and pass the schema to useForm.
2. Ignoring Custom Infrastructure
   You created useAppForm, useFieldContext, and useFormContext in src/components/forms/form-context.tsx, which is the correct way to set up TanStack Form for Type Safety and Context injection.
   The Mistake: BiocharProductForm imports the raw useForm from @tanstack/react-form instead of your custom useAppForm.
   Consequence: The reusable components in src/components/forms/form-field.tsx (like TextField, NumberField) will crash or fail because they try to consume a useFieldContext that doesn't exist. This explains why your form implementation manually rewrites the form.Field render prop every time instead of using your nice components.
3. Redundant State Management
   You are manually managing isSubmitting state:
   biochar-product-form.tsxLines 4-6
   Apply to biochar-prod...
   const [isSubmitting, setIsSubmitting] = React.useState(false); // ❌ Unnecessary
   Better Way: TanStack Form tracks this automatically. You should use form.state.isSubmitting.
4. Verbose & Repetitive Code
   Because you aren't using your reusable TextField / NumberField components, BiocharProductForm is over 400 lines long, filled with repetitive boilerplate like this:
   <form.Field name="facilityId"> {(field) => ( <div className="flex flex-col gap-1"> <Label...> <Select...> {/_ Manual error handling... _/} </div> )}</form.Field>
   Using your SelectField component would reduce this to 1 line.
   Recommendations
   Switch to useAppForm: Update the form to use your custom hook.
   Hook up Validation: Pass the Zod validator to the form.
   Refactor to use Reusable Fields: Replace the manual <form.Field> render props with your <TextField>, <SelectField>, etc.
   Refactored Example
   Here is how BiocharProductForm should look to fix these issues:
   "use client";import _ as React from "react";import { useAppForm } from "@/components/forms/form-context"; // ✅ Use custom hookimport { biocharProductFormSchema, type BiocharProductFormValues } from "@/lib/validations/data-entry";import { zodValidator } from "@tanstack/zod-form-adapter";import { FormSheet } from "@/components/forms/form-sheet";import { FormSection, FormHeader } from "@/components/forms/form-section";import { SelectField, TextField, NumberField, TextareaField } from "@/components/forms/form-field"; // ✅ Use reusable components// ... types ...export function BiocharProductForm({ open, onOpenChange, onSubmit, facilities = [], // ... other props}: BiocharProductFormProps) { // ✅ No local isSubmitting state needed const form = useAppForm({ defaultValues: { facilityId: "", // ... }, validatorAdapter: zodValidator(), // ✅ Connect Zod validators: { onChange: biocharProductFormSchema, // or onSubmit }, onSubmit: async ({ value }) => { // ✅ value is now fully typed and validated await onSubmit(value as BiocharProductFormValues); onOpenChange(false); }, }); return ( <FormSheet open={open} onOpenChange={onOpenChange} title="Add Biochar Product" onSubmit={form.handleSubmit} isSubmitting={form.state.isSubmitting} // ✅ Use built-in state > <FormHeader title="Add Biochar Product" /> <FormSection title="Overview"> {/_ ✅ Much cleaner implementation _/} <form.Field name="facilityId" children={(field) => ( <SelectField label="Facility" options={facilities.map(f => ({ value: f.id, label: f.name }))} // You might need to adjust SelectField to accept the field API or name // OR better yet, update SelectField to take 'name' and use useFieldContext internally /> )} /> {/_ If your TextField handles the field context internally: _/} <form.Field name="totalWeightKg"> {/_ You need to ensure your reusable components align with how you call them. If TextField uses useFieldContext, it must be rendered INSIDE a context provider OR the createFormHook's Field component automatically provides it? Actually, standard TanStack Form Field does NOT provide context automatically to children. You usually pass the 'field' object to your component, OR use a custom Field component. _/} </form.Field> </FormSection> {/_ ... \*/} </FormSheet> );}
   Correction on form-field.tsx:
   Your TextField uses useFieldContext. For this to work, you must usage the Field component exported from useAppForm AND likely pass your component to the component prop of the Field, or ensure the Field provides context.
   Current createFormHook behavior: The Field component returned by createFormHook supports a component prop which does receive the context, but if you just render children, they don't magically get context unless Field wraps them in a Provider.
   Verification: Check form-context.tsx. createFormHookContexts creates a React Context. createFormHook uses that context.
   The Pattern: You should likely use:
   <form.Field name="myField" component={TextField} props={{ label: "My Label" }} // Props passed to your component />
   This way, TextField is rendered by the Field
   , and useFieldContext inside it will work.
