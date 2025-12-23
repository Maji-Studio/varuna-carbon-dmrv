# Archived: Schema & Form Gaps - Completed Items

> Archived from `TODO-schema-form-gaps.md` on 2025-12-23
> These items have been resolved and are kept for historical reference.

---

## Completed (Dec 2024)

- [x] All 5 data entry page routes created (`/data-entry/*`)
- [x] Data entry hub page with incomplete entries query
- [x] Form validation schemas created (`src/lib/validations/data-entry.ts`)
- [x] Base form components (FormSheet, FormSection, PhotoUpload, etc.)
- [x] Page-based form components using TanStack Form + `useAppForm`
- [x] Server actions for create/update operations
- [x] Auto-generated codes (FS-2025-001, PR-2025-001, BP-2025-001)
- [x] Edit pages for incomplete feedstock and production run entries
- [x] TypeScript errors resolved
- [x] **Deleted duplicate sheet-based forms** (`src/components/forms/data-entry/`) - kept only page-based forms
- [x] **Added `notes` field** to feedstocks schema and actions
- [x] **Fixed UUID validation** in all form actions (empty strings → null)
- [x] **Multi-feedstock JSON storage** in `feedstockMix` field

---

## Completed (Dec 10, 2025) - Form UX Improvements

- [x] **Toast notifications** for form errors using sonner (`src/components/ui/sonner.tsx`)
- [x] **Required field indicators** - asterisk (\*) shown for required fields in all forms
- [x] **Last edited timestamps** - incomplete entries show relative time ("Edited 2h ago")
- [x] **Smart "Show All (X)" button** - only visible when >5 incomplete entries
- [x] **Entries sorted by most recently edited** - uses `updatedAt` for sorting
- [x] **ActionResult pattern** - all form actions return `{ success, data/error }` instead of throwing
- [x] **Inline + toast error display** - form errors shown both inline and as toast notifications

---

## Form Simplification (Dec 10, 2025)

- **Deleted ~1,800 lines** of duplicate sheet-based forms
- **Added UUID validation** helper (`toUuidOrNull`) to all actions
- **Facility/Production Run required** - forms now require a primary entity before saving
- **Multi-feedstock as JSON** - stored in `feedstockMix` field

---

## Code Review Fixes (Dec 10, 2025)

| Issue                                   | Status   | Fix                                                       |
| --------------------------------------- | -------- | --------------------------------------------------------- |
| Missing error handling on DB operations | Fixed | Added try-catch to all action functions                   |
| Biochar form notes bug                  | Fixed | Changed `notes: ""` → `notes: initialData?.notes ?? ""`   |
| Buggy inline completion logic           | Fixed | Now using `isFeedstockComplete()` etc. from `src/lib/completion-checks.ts` |

**Details on completion logic bug fix:**

```typescript
// BEFORE (buggy) - 0 is falsy, so weightKg=0 would fail
const hasRequiredFields = values.weightKg && values.moisturePercent;

// AFTER (correct) - uses proper completion function from src/lib/completion-checks.ts
const status = isFeedstockComplete(values) ? "complete" : "missing_data";
```
