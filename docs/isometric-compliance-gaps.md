# Isometric Compliance Gaps

> Generated: 2025-12-09
> Based on: Biochar Protocol v1.2, GHG Accounting Module v1.0, Energy Use Accounting Module v1.2

## Overview

Current implementation covers ~60% of Isometric requirements. The core CO₂e stored calculation is correct, but supporting modules are incomplete.

| Category | Status | Priority |
|----------|--------|----------|
| CO₂e Stored Calculation | ✅ Complete | - |
| Multi-Source Blending | ✅ Complete | - |
| Durability Validation | ✅ Complete | - |
| Energy Accounting | ⚠️ Partial | Critical |
| Counterfactual Emissions | ❌ Missing | Critical |
| Transportation Emissions | ❌ Missing | High |
| Sample Count Validation | ⚠️ Partial | High |

---

## Critical Gaps (Blocks Verification)

### 1. Counterfactual Emissions Not Implemented

**Requirement:** GHG Accounting Module v1.0, Section 2.1

The GHG Statement requires three components:
```
Net CO₂e = CO₂e_Stored - CO₂e_Emissions - CO₂e_Counterfactual
```

Currently only `CO₂e_Stored` is calculated.

**What's needed:**
- Implement Biomass Feedstock Accounting Module v1.3
- Calculate baseline emissions (what would happen without the project)
- Track feedstock fate (decomposition, burning, etc.)

**Files to modify:**
- `src/lib/adapters/isometric/utils/counterfactual.ts` (new)
- `src/lib/adapters/isometric/adapter.ts`

**Reference:** https://registry.isometric.com/module/biomass-feedstock-accounting/1.3

---

### 2. Missing Emission Factors

**Requirement:** Energy Use Accounting Module v1.2, Section 5

Current code tracks diesel liters and electricity kWh but doesn't convert to CO₂e.

**Required factors:**

| Factor | Description | Typical Value |
|--------|-------------|---------------|
| `f_fuel` (diesel) | Well-to-wheel emissions | ~3.2 kg CO₂e/L |
| `f_grid` | Regional grid average | Varies by country |

**Formulas:**
```
CO₂e_Fuel = Σ(m_fuel,k × f_fuel,k)
CO₂e_Electricity = f_grid × ΣE_i
```

**What's needed:**
- Create emission factor configuration (per region/fuel type)
- Implement emission calculation functions
- Populate existing schema fields: `emissionsFromFossilsKg`, `emissionsFromGridKg`

**Files to modify:**
- `src/config/emission-factors.ts` (new)
- `src/lib/adapters/isometric/utils/emissions.ts` (new)
- `src/lib/adapters/isometric/utils/aggregation.ts`

**Reference:** https://registry.isometric.com/module/energy-use-accounting/1.2

---

### 3. Incomplete Fuel Type Aggregation

**Requirement:** Energy Use Accounting Module v1.2

Schema tracks three fuel types but only one is aggregated:

| Field | In Schema | Aggregated |
|-------|-----------|------------|
| `dieselOperationLiters` | ✅ | ✅ |
| `dieselGensetLiters` | ✅ | ❌ |
| `preprocessingFuelLiters` | ✅ | ❌ |

**Fix in `aggregation.ts:176`:**
```typescript
// Current
totalDieselLiters += run.dieselOperationLiters ?? 0;

// Should be
totalDieselLiters += (run.dieselOperationLiters ?? 0) +
                     (run.dieselGensetLiters ?? 0) +
                     (run.preprocessingFuelLiters ?? 0);
```

**Files to modify:**
- `src/lib/adapters/isometric/utils/aggregation.ts`

---

## High Priority Gaps

### 4. Transportation Emissions Not Implemented

**Requirement:** Transportation Emissions Accounting Module v1.1

Must track and calculate emissions from:
- Feedstock transport (source → facility)
- Biochar transport (facility → storage location)

**Formula:**
```
CO₂e_Transport = distance × mass × emission_factor
```

**What's needed:**
- Track transport distances in schema (partially exists via relations)
- Implement transport emission calculation
- Include in aggregation

**Files to modify:**
- `src/lib/adapters/isometric/utils/transportation.ts` (new)
- `src/lib/adapters/isometric/utils/aggregation.ts`

**Reference:** https://registry.isometric.com/module/transportation/1.1

---

### 5. Minimum Sample Count Not Enforced

**Requirement:** Biochar Protocol v1.2, Section 8.3

> "A minimum of three samples must be collected from each measured Production Batch"

Current validation only warns about missing samples, doesn't enforce minimum.

**Fix in `aggregation.ts:128-130`:**
```typescript
// Current - just a warning
if (!run.samples || run.samples.length === 0) {
  warnings.push(`Production run ${run.code} has no samples`);
}

// Should be - error if < 3 samples without justification
if (!run.samples || run.samples.length < 3) {
  errors.push(
    `Production run ${run.code} has ${run.samples?.length ?? 0} samples. ` +
    `Minimum 3 required per Isometric Protocol Section 8.3`
  );
}
```

**Files to modify:**
- `src/lib/adapters/isometric/utils/aggregation.ts`

---

### 6. Input Key Validation Missing

**Risk:** If Isometric changes template input keys, sync will silently fail to map data.

**Current behavior:** Hardcoded mapping in `removal.ts:63-110` assumes input keys like `carbon_content`, `product_mass` exist.

**What's needed:**
- Validate that mapped input keys exist in fetched template
- Fail loudly if expected keys are missing
- Log unmapped template inputs for visibility

**Files to modify:**
- `src/lib/adapters/isometric/transformers/removal.ts`

---

## Medium Priority Gaps

### 7. Hourly Electricity Tracking

**Requirement:** Energy Use Accounting Module v1.2

> "Measurements must be made... with hourly reporting frequency at minimum"

Current schema tracks total `electricityKwh` per production run, not hourly readings.

**Options:**
1. Add hourly electricity readings table
2. Accept daily/batch totals with documented justification

**Files to modify:**
- `src/db/schema/production.ts` (if adding hourly tracking)

---

### 8. Production Process Consistency Validation

**Requirement:** Biochar Protocol v1.2, Method B sampling

When using Method B (sampling 1 in 10 batches), all batches must be from the same "Production Process" (consistent feedstock + pyrolysis conditions).

**What's needed:**
- Validate blended runs share same feedstock type
- Validate similar pyrolysis parameters
- Warn/error if mixing incompatible processes

**Files to modify:**
- `src/lib/adapters/isometric/utils/aggregation.ts`

---

### 9. Leakage Emissions

**Requirement:** GHG Accounting Module v1.0, Section 2.4.2

Market leakage from feedstock diversion should be tracked under `CO₂e_Leakage`.

**What's needed:**
- Assess if feedstock would have had alternative use
- Calculate displaced emissions if applicable

**Files to modify:**
- `src/lib/adapters/isometric/utils/leakage.ts` (new)

---

## Schema Fields Available but Unused

These fields exist in `production.ts` but aren't populated or used in sync:

| Field | Purpose |
|-------|---------|
| `emissionsFromFossilsKg` | Calculated fossil fuel emissions |
| `emissionsFromGridKg` | Calculated grid electricity emissions |
| `totalEmissionsKg` | Total production emissions |

---

## Implementation Order Recommendation

1. **Fuel aggregation fix** - Quick win, 5 min fix
2. **Sample count validation** - Quick win, prevents bad data
3. **Emission factors + calculation** - Required for GHG Statement
4. **Input key validation** - Prevents silent failures
5. **Transportation emissions** - Needed for complete accounting
6. **Counterfactual emissions** - Complex, requires Biomass Feedstock Module

---

## Authoritative References

- Biochar Protocol v1.2: https://registry.isometric.com/protocol/biochar/1.2
- GHG Accounting Module v1.0: https://registry.isometric.com/module/ghg-accounting/1.0
- Energy Use Accounting Module v1.2: https://registry.isometric.com/module/energy-use-accounting/1.2
- Transportation Module v1.1: https://registry.isometric.com/module/transportation/1.1
- Biomass Feedstock Accounting v1.3: https://registry.isometric.com/module/biomass-feedstock-accounting/1.3
