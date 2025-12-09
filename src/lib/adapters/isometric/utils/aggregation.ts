/**
 * Multi-Source Blending Aggregation Utilities
 *
 * Implements Isometric Protocol v1.2 aggregation for credit batches
 * containing biochar from multiple production runs (Storage Batch).
 *
 * Formula: CO2e_Stored = SUM(C_biochar,p * m_biochar,p / 100) * 44.01/12.01
 *
 * Where:
 * - p = Production Batch identifier
 * - C_biochar,p = carbon concentration (weight %) from production batch p
 * - m_biochar,p = mass of biochar from production batch p
 */

import type { productionRuns, samples } from '@/db/schema';

// ============================================
// Types
// ============================================

type LocalProductionRun = typeof productionRuns.$inferSelect;
type LocalSample = typeof samples.$inferSelect;

export interface ProductionRunWithSamples extends LocalProductionRun {
  samples: LocalSample[];
}

export interface AggregatedProductionData {
  /** Mass-weighted average carbon content (fraction, 0-1) */
  weightedCarbonContent: number;
  /** Total biochar mass (kg) - SUM across all runs */
  totalBiocharMassKg: number;
  /** Total feedstock mass (kg) - SUM across all runs */
  totalFeedstockMassKg: number;
  /** Total diesel (liters) - SUM across all runs */
  totalDieselLiters: number;
  /** Total electricity (kWh) - SUM across all runs */
  totalElectricityKwh: number;
  /** Mass-weighted average H:Corg ratio */
  weightedHCorgRatio: number | null;
  /** Mass-weighted average O:Corg ratio */
  weightedOCorgRatio: number | null;
  /** Source production run IDs (for traceability) */
  sourceProductionRunIds: string[];
  /** Warnings generated during aggregation */
  warnings: string[];
}

export interface AggregationValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate mass-weighted average of values
 *
 * Formula: SUM(value_i * mass_i) / SUM(mass_i)
 */
export function calculateMassWeightedAverage(
  items: Array<{ value: number; mass: number }>
): number {
  if (items.length === 0) return 0;

  const totalWeightedValue = items.reduce(
    (sum, item) => sum + item.value * item.mass,
    0
  );
  const totalMass = items.reduce((sum, item) => sum + item.mass, 0);

  if (totalMass === 0) return 0;
  return totalWeightedValue / totalMass;
}

/**
 * Average sample values within a single production run
 *
 * Returns null if no valid samples
 */
function averageSampleValue(
  samples: LocalSample[],
  field: keyof LocalSample
): number | null {
  const validValues = samples
    .map((s) => s[field])
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));

  if (validValues.length === 0) return null;
  return validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
}

// ============================================
// Core Aggregation Functions
// ============================================

/**
 * Validate inputs before aggregation
 */
export function validateAggregationInputs(
  productionRuns: ProductionRunWithSamples[]
): AggregationValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (productionRuns.length === 0) {
    errors.push('No production runs provided for aggregation');
    return { valid: false, errors, warnings };
  }

  // Check each production run
  for (const run of productionRuns) {
    // Required: biochar mass (needed for weighting)
    if (run.biocharAmountKg === null || run.biocharAmountKg === undefined) {
      errors.push(
        `Production run ${run.code} is missing biocharAmountKg (required for mass-weighted averaging)`
      );
    } else if (run.biocharAmountKg <= 0) {
      errors.push(
        `Production run ${run.code} has invalid biocharAmountKg: ${run.biocharAmountKg}`
      );
    }

    // Warning: missing samples
    if (!run.samples || run.samples.length === 0) {
      warnings.push(`Production run ${run.code} has no samples`);
    } else {
      // Check for organic carbon in samples
      const hasOrgCarbon = run.samples.some(
        (s) => s.organicCarbonPercent !== null && s.organicCarbonPercent !== undefined
      );
      if (!hasOrgCarbon) {
        warnings.push(
          `Production run ${run.code} samples are missing organic carbon content`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Aggregate multiple production runs into a single Storage Batch
 *
 * Following Isometric Protocol v1.2:
 * - Carbon content: Mass-weighted average
 * - Quantities (mass, fuel, electricity): Sum
 * - Stability ratios: Mass-weighted average
 */
export function aggregateProductionRuns(
  productionRuns: ProductionRunWithSamples[]
): AggregatedProductionData {
  const warnings: string[] = [];
  const sourceProductionRunIds = productionRuns.map((run) => run.id);

  // Build data for mass-weighted averaging
  const carbonItems: Array<{ value: number; mass: number }> = [];
  const hCorgItems: Array<{ value: number; mass: number }> = [];
  const oCorgItems: Array<{ value: number; mass: number }> = [];

  // Accumulate sums
  let totalBiocharMassKg = 0;
  let totalFeedstockMassKg = 0;
  let totalDieselLiters = 0;
  let totalElectricityKwh = 0;

  for (const run of productionRuns) {
    const mass = run.biocharAmountKg ?? 0;
    totalBiocharMassKg += mass;

    // Sum additive fields
    totalFeedstockMassKg += run.feedstockAmountKg ?? 0;
    totalDieselLiters += run.dieselOperationLiters ?? 0;
    totalElectricityKwh += run.electricityKwh ?? 0;

    // Get average sample values for this run
    if (run.samples && run.samples.length > 0) {
      const avgCarbon = averageSampleValue(run.samples, 'organicCarbonPercent');
      if (avgCarbon !== null && mass > 0) {
        carbonItems.push({ value: avgCarbon / 100, mass }); // Convert % to fraction
      }

      const avgHCorg = averageSampleValue(run.samples, 'hCorgMolarRatio');
      if (avgHCorg !== null && mass > 0) {
        hCorgItems.push({ value: avgHCorg, mass });
      }

      const avgOCorg = averageSampleValue(run.samples, 'oCorgMolarRatio');
      if (avgOCorg !== null && mass > 0) {
        oCorgItems.push({ value: avgOCorg, mass });
      }
    }
  }

  // Calculate mass-weighted averages
  const weightedCarbonContent =
    carbonItems.length > 0 ? calculateMassWeightedAverage(carbonItems) : 0;

  const weightedHCorgRatio =
    hCorgItems.length > 0 ? calculateMassWeightedAverage(hCorgItems) : null;

  const weightedOCorgRatio =
    oCorgItems.length > 0 ? calculateMassWeightedAverage(oCorgItems) : null;

  // Check for high variance in carbon content (warning if >20%)
  if (carbonItems.length > 1) {
    const carbonValues = carbonItems.map((c) => c.value);
    const min = Math.min(...carbonValues);
    const max = Math.max(...carbonValues);
    const mean = (max + min) / 2;
    const variancePercent = mean > 0 ? ((max - min) / mean) * 100 : 0;

    if (variancePercent > 20) {
      warnings.push(
        `High carbon content variance (${variancePercent.toFixed(1)}%) across ${carbonItems.length} production runs. ` +
          `Range: ${(min * 100).toFixed(1)}% - ${(max * 100).toFixed(1)}%. Consider reviewing blend composition.`
      );
    }
  }

  // Log multi-source info if applicable
  if (productionRuns.length > 1) {
    warnings.push(
      `Multi-source blend: ${productionRuns.length} production runs aggregated`
    );
  }

  return {
    weightedCarbonContent,
    totalBiocharMassKg,
    totalFeedstockMassKg,
    totalDieselLiters,
    totalElectricityKwh,
    weightedHCorgRatio,
    weightedOCorgRatio,
    sourceProductionRunIds,
    warnings,
  };
}

/**
 * Calculate expected CO2e stored using Isometric formula
 *
 * CO2e_Stored = SUM(C_biochar,p * m_biochar,p / 100) * 44.01/12.01
 *
 * Note: This is a simplified calculation. The actual Isometric
 * calculation also includes durability factor (F_durable).
 */
export function calculateCO2eStored(aggregated: AggregatedProductionData): number {
  // weightedCarbonContent is already a fraction (0-1)
  // totalBiocharMassKg is in kg
  const carbonMassKg = aggregated.weightedCarbonContent * aggregated.totalBiocharMassKg;
  const co2eKg = carbonMassKg * (44.01 / 12.01);
  return co2eKg / 1000; // Convert to tonnes
}
