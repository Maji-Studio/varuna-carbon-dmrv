# TODO: Isometric Template Change Resilience

> **Priority:** High
> **Effort:** ~1 day
> **Risk if not done:** Silent data loss when Isometric updates templates

## Problem

The DMRV syncs data to Isometric using **hardcoded input key mappings**. If Isometric renames a template input (e.g., `carbon_content` → `carbon_fraction`), the sync **silently skips** that data instead of failing.

### Current Risk Matrix

| Isometric Change | Current Behavior | Impact |
|------------------|------------------|--------|
| Input key renamed | Silent skip (`return null`) | Missing data in Removal |
| New required input added | Not mapped | Incomplete submission |
| Unit changed (kg → tonnes) | Wrong values sent | Incorrect CO₂e calculation |
| Protocol version update | Not tracked | Unknown compliance state |

---

## Brittleness Points (Code Locations)

### 1. Hardcoded INPUT_MAPPING
**File:** `src/lib/adapters/isometric/transformers/removal.ts:63-110`

```typescript
const INPUT_MAPPING: Record<string, {...}> = {
  carbon_content: { source: 'sample', field: 'organicCarbonPercent', unit: '1' },
  product_mass: { source: 'productionRun', field: 'biocharAmountKg', unit: 'kg' },
  volume_of_fuel: { source: 'productionRun', field: 'dieselOperationLiters', unit: 'L' },
  electricity_use: { source: 'productionRun', field: 'electricityKwh', unit: 'kWh' },
  feedstock_mass: { source: 'productionRun', field: 'feedstockAmountKg', unit: 'kg' },
  mass: { source: 'productionRun', field: 'feedstockAmountKg', unit: 'kg' },
};
```

### 2. Silent Skip on Unknown Keys
**File:** `src/lib/adapters/isometric/transformers/removal.ts:144-147`

```typescript
const mapping = INPUT_MAPPING[inputKey];
if (!mapping) {
  return null;  // ← SILENT FAILURE - no error, no warning
}
```

### 3. Duplicate Aggregated Mapping
**File:** `src/lib/adapters/isometric/transformers/removal.ts:330-376`

Same hardcoded keys duplicated for multi-source blending.

### 4. No Template Version Tracking
**File:** `src/lib/adapters/isometric/adapter.ts`

Template ID used but version not stored with synced records.

---

## Implementation Checklist

### Phase 1: Extract Config (~2 hours)

- [ ] Create `src/config/isometric-mappings.ts`
  ```typescript
  export const ISOMETRIC_INPUT_MAPPINGS = {
    // Template input key → local data mapping
    carbon_content: {
      source: 'sample',
      field: 'organicCarbonPercent',
      unit: '1',
      transform: (v: number) => v / 100,
      required: true,  // NEW: mark critical inputs
    },
    // ... rest of mappings
  };

  export const REQUIRED_INPUT_KEYS = [
    'carbon_content',
    'product_mass',
  ];
  ```

- [ ] Update `removal.ts` to import from config
- [ ] Remove duplicate `AGGREGATED_INPUT_MAPPING` (use same config)

### Phase 2: Add Validation (~2 hours)

- [ ] Create `src/lib/adapters/isometric/utils/template-validation.ts`
  ```typescript
  export function validateTemplateMapping(
    template: RemovalTemplate,
    mappings: typeof ISOMETRIC_INPUT_MAPPINGS
  ): { valid: boolean; errors: string[]; warnings: string[] }
  ```

- [ ] Check all `REQUIRED_INPUT_KEYS` exist in template
- [ ] Warn on unmapped template inputs (template has key, we don't map it)
- [ ] Validate units match between mapping and template

- [ ] Update `adapter.ts:syncCreditBatch()` to call validation before sync
- [ ] Fail sync if validation errors (not just warnings)

### Phase 3: Version Tracking (~1 hour)

- [ ] Add to `credit_batches` schema (optional):
  ```typescript
  isometricTemplateId: text('isometric_template_id'),
  isometricSyncedAt: timestamp('isometric_synced_at'),
  ```

- [ ] Store template ID + timestamp on successful sync
- [ ] Log template version in sync output

### Phase 4: Change Detection (~1 hour)

- [ ] Create script: `scripts/check-isometric-template.ts`
  - Fetches current template from Isometric
  - Compares input keys against `ISOMETRIC_INPUT_MAPPINGS`
  - Reports: new keys, removed keys, changed units
  - Exit code 1 if breaking changes detected

- [ ] Add to CI or pre-deploy check (optional)

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/config/isometric-mappings.ts` | **Create** - External mapping config |
| `src/lib/adapters/isometric/utils/template-validation.ts` | **Create** - Validation functions |
| `src/lib/adapters/isometric/transformers/removal.ts` | **Modify** - Use external config, remove duplicates |
| `src/lib/adapters/isometric/adapter.ts` | **Modify** - Add validation call, version tracking |
| `scripts/check-isometric-template.ts` | **Create** - Template change detection |
| `src/db/schema/credit-batches.ts` | **Modify** (optional) - Add template version fields |

---

## Testing Approach

### Unit Tests
```typescript
// template-validation.test.ts
describe('validateTemplateMapping', () => {
  it('fails if required key missing from template', () => {
    const template = { groups: [{ components: [{ inputs: [] }] }] };
    const result = validateTemplateMapping(template, ISOMETRIC_INPUT_MAPPINGS);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Required input "carbon_content" not found in template');
  });

  it('warns on unmapped template inputs', () => {
    const template = mockTemplateWith(['carbon_content', 'new_unknown_input']);
    const result = validateTemplateMapping(template, ISOMETRIC_INPUT_MAPPINGS);
    expect(result.warnings).toContain('Template input "new_unknown_input" has no local mapping');
  });
});
```

### Integration Test
```typescript
// Run against Isometric sandbox
it('validates current production template', async () => {
  const template = await isometric.getRemovalTemplate(projectId, templateId);
  const result = validateTemplateMapping(template, ISOMETRIC_INPUT_MAPPINGS);
  expect(result.valid).toBe(true);
});
```

### Manual Test
```bash
# Check template before deploy
pnpm tsx scripts/check-isometric-template.ts

# Expected output:
# ✓ All required input keys present
# ✓ Units match expected values
# ⚠ Unmapped template inputs: [list any new ones]
```

---

## Success Criteria

- [ ] Sync fails loudly if Isometric renames critical input keys
- [ ] Warnings logged for new unmapped template inputs
- [ ] Mapping changes require only config file update (no transformer code changes)
- [ ] Template version recorded with each sync
- [ ] CI/script can detect template changes before they break production

---

## References

- Current implementation: `src/lib/adapters/isometric/transformers/removal.ts`
- Compliance gaps doc: `docs/isometric-compliance-gaps.md` (Gap #6)
- Isometric template API: `src/lib/isometric/client.ts:366`
