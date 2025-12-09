/**
 * Removal Data Mapper
 *
 * Maps local DMRV data to Isometric removal template component inputs.
 * This is template-driven: we fetch the template structure from Isometric
 * and map our local fields to the expected inputs.
 *
 * Key component: CO₂ stored from biochar application (rtc_1KBMJJGR41S0XH0S)
 * - carbon_content: Carbon content of biochar (dimensionless fraction)
 * - product_mass: Mass of biochar stored (kg)
 */

import type { productionRuns, samples, applications } from '@/db/schema';
import type {
  RemovalTemplate,
  RemovalTemplateComponent,
  RemovalTemplateComponentInput,
  ComponentScalarInput,
} from '@/lib/isometric/types';
import type { AggregatedProductionData, ProductionRunWithSamples } from '../utils/aggregation';

// ============================================
// Local Types
// ============================================

type LocalProductionRun = typeof productionRuns.$inferSelect;
type LocalSample = typeof samples.$inferSelect;
type LocalApplication = typeof applications.$inferSelect;

/** Single-source removal data (legacy, backward compatible) */
export interface RemovalLocalData {
  productionRun: LocalProductionRun;
  sample: LocalSample;
  application: LocalApplication;
}

/**
 * Multi-source aggregated removal data
 *
 * Used when a credit batch contains biochar from multiple production runs
 * (Storage Batch in Isometric terminology)
 */
export interface AggregatedRemovalLocalData {
  /** Aggregated values from multiple production runs */
  aggregated: AggregatedProductionData;
  /** Representative application (for location/date info) */
  application: LocalApplication;
  /** Source production runs (for audit trail) */
  sourceProductionRuns: ProductionRunWithSamples[];
  /** Source samples (for audit trail) */
  sourceSamples: LocalSample[];
}

// ============================================
// Input Mapping Configuration
// ============================================

/**
 * Maps Isometric input keys to local data field paths.
 *
 * Format: { [input_key]: { source: 'productionRun' | 'sample' | 'application', field: string, unit: string, transform?: (value: number) => number } }
 */
const INPUT_MAPPING: Record<
  string,
  {
    source: keyof RemovalLocalData;
    field: string;
    unit: string;
    transform?: (value: number) => number;
  }
> = {
  // CO₂ stored component inputs
  carbon_content: {
    source: 'sample',
    field: 'organicCarbonPercent',
    unit: '1', // dimensionless (fraction)
    transform: (percent: number) => percent / 100, // Convert % to fraction
  },
  product_mass: {
    source: 'productionRun',
    field: 'biocharAmountKg',
    unit: 'kg',
  },

  // Fuel usage inputs (volume)
  volume_of_fuel: {
    source: 'productionRun',
    field: 'dieselOperationLiters',
    unit: 'L',
  },

  // Electricity inputs
  electricity_use: {
    source: 'productionRun',
    field: 'electricityKwh',
    unit: 'kWh',
  },

  // Mass of feedstock transported
  feedstock_mass: {
    source: 'productionRun',
    field: 'feedstockAmountKg',
    unit: 'kg',
  },
  mass: {
    source: 'productionRun',
    field: 'feedstockAmountKg',
    unit: 'kg',
  },
};

// ============================================
// Core Mapping Functions
// ============================================

/**
 * Get a value from local data based on source and field path
 */
function getLocalValue(
  localData: RemovalLocalData,
  source: keyof RemovalLocalData,
  field: string
): number | null {
  const sourceData = localData[source];
  if (!sourceData) return null;

  // Handle nested field paths (e.g., "facility.name")
  const value = (sourceData as Record<string, unknown>)[field];
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Map local data to a single component input
 */
function mapInputValue(
  inputKey: string,
  localData: RemovalLocalData
): ComponentScalarInput | null {
  const mapping = INPUT_MAPPING[inputKey];
  if (!mapping) {
    // No mapping defined for this input - will use template defaults
    return null;
  }

  const rawValue = getLocalValue(localData, mapping.source, mapping.field);
  if (rawValue === null) {
    return null;
  }

  const transformedValue = mapping.transform ? mapping.transform(rawValue) : rawValue;

  return {
    input_key: inputKey,
    value: {
      magnitude: transformedValue,
      unit: mapping.unit,
    },
  };
}

/**
 * Map local data to a template component's inputs
 */
export function mapComponentInputs(
  component: RemovalTemplateComponent,
  localData: RemovalLocalData
): RemovalTemplateComponentInput | null {
  const inputs: ComponentScalarInput[] = [];

  for (const templateInput of component.inputs) {
    // Only map 'monitored' inputs - 'fixed' inputs come from template defaults
    if (templateInput.type === 'fixed') {
      continue;
    }

    const mappedInput = mapInputValue(templateInput.input_key, localData);
    if (mappedInput) {
      inputs.push(mappedInput);
    }
  }

  // Only return if we have at least one input mapped
  if (inputs.length === 0) {
    return null;
  }

  return {
    removal_template_component_id: component.id,
    inputs,
  };
}

/**
 * Map local data to all template components
 *
 * This is the main entry point for creating removal_template_components
 * for the createRemoval API call.
 */
export function mapRemovalTemplateComponents(
  template: RemovalTemplate,
  localData: RemovalLocalData
): RemovalTemplateComponentInput[] {
  const result: RemovalTemplateComponentInput[] = [];

  for (const group of template.groups) {
    for (const component of group.components) {
      const mappedComponent = mapComponentInputs(component, localData);
      if (mappedComponent) {
        result.push(mappedComponent);
      }
    }
  }

  return result;
}

// ============================================
// Validation Functions
// ============================================

/**
 * Check if we have the minimum required data for a removal
 *
 * The most critical component is CO₂ stored, which needs:
 * - carbon_content (from sample)
 * - product_mass (from production run)
 */
export function validateLocalDataForRemoval(localData: RemovalLocalData): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required: Sample organic carbon content
  if (
    !localData.sample?.organicCarbonPercent &&
    localData.sample?.organicCarbonPercent !== 0
  ) {
    errors.push('Sample organic carbon percent is required for CO₂ calculation');
  }

  // Required: Production run biochar amount
  if (
    !localData.productionRun?.biocharAmountKg &&
    localData.productionRun?.biocharAmountKg !== 0
  ) {
    errors.push('Production run biochar amount (kg) is required for CO₂ calculation');
  }

  // Warnings for optional but recommended data
  if (!localData.productionRun?.dieselOperationLiters) {
    warnings.push('No diesel usage data - emissions will be incomplete');
  }
  if (!localData.productionRun?.electricityKwh) {
    warnings.push('No electricity usage data - emissions will be incomplete');
  }

  // Validate H:Corg ratio for durability
  if (localData.sample?.hCorgMolarRatio !== null && localData.sample?.hCorgMolarRatio !== undefined) {
    if (localData.sample.hCorgMolarRatio >= 0.5) {
      errors.push(
        `H:Corg ratio (${localData.sample.hCorgMolarRatio}) must be < 0.5 for 200-year durability`
      );
    }
  } else {
    warnings.push('H:Corg molar ratio not provided - durability eligibility cannot be verified');
  }

  // Validate O:Corg ratio for durability
  if (localData.sample?.oCorgMolarRatio !== null && localData.sample?.oCorgMolarRatio !== undefined) {
    if (localData.sample.oCorgMolarRatio >= 0.2) {
      errors.push(
        `O:Corg ratio (${localData.sample.oCorgMolarRatio}) must be < 0.2 for 200-year durability`
      );
    }
  } else {
    warnings.push('O:Corg molar ratio not provided - durability eligibility cannot be verified');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get a summary of what data will be mapped
 */
export function getRemovalDataSummary(localData: RemovalLocalData): {
  co2StoredInputs: {
    carbonContent: number | null;
    productMass: number | null;
  };
  emissionsInputs: {
    dieselLiters: number | null;
    electricityKwh: number | null;
  };
} {
  return {
    co2StoredInputs: {
      carbonContent: localData.sample?.organicCarbonPercent
        ? localData.sample.organicCarbonPercent / 100
        : null,
      productMass: localData.productionRun?.biocharAmountKg ?? null,
    },
    emissionsInputs: {
      dieselLiters: localData.productionRun?.dieselOperationLiters ?? null,
      electricityKwh: localData.productionRun?.electricityKwh ?? null,
    },
  };
}

// ============================================
// Multi-Source Aggregated Data Mapping
// ============================================

/**
 * Input mapping for aggregated multi-source data
 *
 * Maps aggregated values (from multiple production runs) to Isometric inputs
 */
const AGGREGATED_INPUT_MAPPING: Record<
  string,
  {
    source: 'aggregated' | 'application';
    field: string;
    unit: string;
    transform?: (value: number) => number;
  }
> = {
  // CO₂ stored component inputs
  carbon_content: {
    source: 'aggregated',
    field: 'weightedCarbonContent',
    unit: '1', // Already a fraction (no transform needed)
  },
  product_mass: {
    source: 'aggregated',
    field: 'totalBiocharMassKg',
    unit: 'kg',
  },

  // Fuel usage inputs (volume) - SUM across runs
  volume_of_fuel: {
    source: 'aggregated',
    field: 'totalDieselLiters',
    unit: 'L',
  },

  // Electricity inputs - SUM across runs
  electricity_use: {
    source: 'aggregated',
    field: 'totalElectricityKwh',
    unit: 'kWh',
  },

  // Mass of feedstock transported - SUM across runs
  feedstock_mass: {
    source: 'aggregated',
    field: 'totalFeedstockMassKg',
    unit: 'kg',
  },
  mass: {
    source: 'aggregated',
    field: 'totalFeedstockMassKg',
    unit: 'kg',
  },
};

/**
 * Get a value from aggregated data based on source and field
 */
function getAggregatedValue(
  data: AggregatedRemovalLocalData,
  source: 'aggregated' | 'application',
  field: string
): number | null {
  if (source === 'aggregated') {
    const value = (data.aggregated as unknown as Record<string, unknown>)[field];
    if (typeof value === 'number') return value;
    return null;
  }

  if (source === 'application') {
    const value = (data.application as unknown as Record<string, unknown>)[field];
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  return null;
}

/**
 * Map aggregated data to a single component input
 */
function mapAggregatedInputValue(
  inputKey: string,
  data: AggregatedRemovalLocalData
): ComponentScalarInput | null {
  const mapping = AGGREGATED_INPUT_MAPPING[inputKey];
  if (!mapping) {
    // No mapping defined for this input - will use template defaults
    return null;
  }

  const rawValue = getAggregatedValue(data, mapping.source, mapping.field);
  if (rawValue === null) {
    return null;
  }

  const transformedValue = mapping.transform ? mapping.transform(rawValue) : rawValue;

  return {
    input_key: inputKey,
    value: {
      magnitude: transformedValue,
      unit: mapping.unit,
    },
  };
}

/**
 * Map aggregated data to a template component's inputs
 */
export function mapAggregatedComponentInputs(
  component: RemovalTemplateComponent,
  data: AggregatedRemovalLocalData
): RemovalTemplateComponentInput | null {
  const inputs: ComponentScalarInput[] = [];

  for (const templateInput of component.inputs) {
    // Only map 'monitored' inputs - 'fixed' inputs come from template defaults
    if (templateInput.type === 'fixed') {
      continue;
    }

    const mappedInput = mapAggregatedInputValue(templateInput.input_key, data);
    if (mappedInput) {
      inputs.push(mappedInput);
    }
  }

  // Only return if we have at least one input mapped
  if (inputs.length === 0) {
    return null;
  }

  return {
    removal_template_component_id: component.id,
    inputs,
  };
}

/**
 * Map aggregated data to all template components
 *
 * This is the main entry point for multi-source blending,
 * creating removal_template_components for the createRemoval API call.
 */
export function mapAggregatedRemovalTemplateComponents(
  template: RemovalTemplate,
  data: AggregatedRemovalLocalData
): RemovalTemplateComponentInput[] {
  const result: RemovalTemplateComponentInput[] = [];

  for (const group of template.groups) {
    for (const component of group.components) {
      const mappedComponent = mapAggregatedComponentInputs(component, data);
      if (mappedComponent) {
        result.push(mappedComponent);
      }
    }
  }

  return result;
}

/**
 * Validate aggregated data for removal
 *
 * Checks that aggregated values meet Isometric requirements
 */
export function validateAggregatedDataForRemoval(data: AggregatedRemovalLocalData): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required: Weighted carbon content must be positive
  if (data.aggregated.weightedCarbonContent <= 0) {
    errors.push('Weighted carbon content must be positive');
  }

  // Required: Total biochar mass must be positive
  if (data.aggregated.totalBiocharMassKg <= 0) {
    errors.push('Total biochar mass must be positive');
  }

  // Validate H:Corg ratio for durability (mass-weighted)
  if (data.aggregated.weightedHCorgRatio !== null) {
    if (data.aggregated.weightedHCorgRatio >= 0.5) {
      errors.push(
        `Weighted H:Corg ratio (${data.aggregated.weightedHCorgRatio.toFixed(3)}) must be < 0.5 for 200-year durability`
      );
    }
  } else {
    warnings.push('H:Corg ratio not available - durability eligibility cannot be verified');
  }

  // Validate O:Corg ratio for durability (mass-weighted)
  if (data.aggregated.weightedOCorgRatio !== null) {
    if (data.aggregated.weightedOCorgRatio >= 0.2) {
      errors.push(
        `Weighted O:Corg ratio (${data.aggregated.weightedOCorgRatio.toFixed(3)}) must be < 0.2 for 200-year durability`
      );
    }
  } else {
    warnings.push('O:Corg ratio not available - durability eligibility cannot be verified');
  }

  // Warnings for optional but recommended data
  if (data.aggregated.totalDieselLiters === 0) {
    warnings.push('No diesel usage data - emissions will be incomplete');
  }
  if (data.aggregated.totalElectricityKwh === 0) {
    warnings.push('No electricity usage data - emissions will be incomplete');
  }

  // Add aggregation-specific warnings
  warnings.push(...data.aggregated.warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get a summary of aggregated removal data
 */
export function getAggregatedRemovalDataSummary(data: AggregatedRemovalLocalData): {
  sourceCount: number;
  co2StoredInputs: {
    carbonContent: number;
    productMass: number;
  };
  emissionsInputs: {
    dieselLiters: number;
    electricityKwh: number;
  };
} {
  return {
    sourceCount: data.sourceProductionRuns.length,
    co2StoredInputs: {
      carbonContent: data.aggregated.weightedCarbonContent,
      productMass: data.aggregated.totalBiocharMassKg,
    },
    emissionsInputs: {
      dieselLiters: data.aggregated.totalDieselLiters,
      electricityKwh: data.aggregated.totalElectricityKwh,
    },
  };
}
