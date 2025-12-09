import { z } from "zod";

// ============================================
// Feedstock Form Schema
// ============================================

export const feedstockFormSchema = z.object({
  // Delivery Information
  facilityId: z.string().uuid("Please select a facility"),
  collectionDate: z.date().optional(),
  supplierId: z.string().uuid().optional(),
  // Note: Figma has "Supplier Location" but DB has location on supplier table
  // This would need to come from the selected supplier
  driverId: z.string().uuid().optional(),
  vehicleType: z.string().optional(),
  fuelConsumedLiters: z.number().min(0).optional(),

  // Feedstock Details
  feedstockTypeId: z.string().uuid().optional(),
  weightKg: z.number().min(0).optional(),
  moisturePercent: z.number().min(0).max(100).optional(),
  storageLocationId: z.string().uuid().optional(),

  // Documentation
  notes: z.string().optional(),
  photos: z.array(z.instanceof(File)).optional(),
});

export type FeedstockFormValues = z.infer<typeof feedstockFormSchema>;

// ============================================
// Production Run Form Schema
// ============================================

export const productionRunFormSchema = z.object({
  // Overview
  facilityId: z.string().uuid("Please select a facility"),
  startTime: z.date().optional(),
  reactorId: z.string().uuid().optional(),
  processType: z.string().optional(),
  operatorId: z.string().uuid().optional(),

  // Feedstock Input
  // Note: Figma shows multiple feedstock sources, DB has single feedstockStorageLocationId
  // This is a potential inconsistency - could use feedstockMix JSON field or separate table
  feedstockInputs: z
    .array(
      z.object({
        storageLocationId: z.string().uuid(),
        amountKg: z.number().min(0),
      })
    )
    .optional(),
  moistureBeforeDryingPercent: z.number().min(0).max(100).optional(),
  moistureAfterDryingPercent: z.number().min(0).max(100).optional(),

  // Biochar Output
  biocharAmountKg: z.number().min(0).optional(),
  biocharStorageLocationId: z.string().uuid().optional(),

  // Processing Parameters
  dieselOperationLiters: z.number().min(0).optional(),
  dieselGensetLiters: z.number().min(0).optional(),
  preprocessingFuelLiters: z.number().min(0).optional(),
  electricityKwh: z.number().min(0).optional(),
});

export type ProductionRunFormValues = z.infer<typeof productionRunFormSchema>;

// ============================================
// Sampling Form Schema
// ============================================

export const samplingFormSchema = z.object({
  // Overview
  facilityId: z.string().uuid("Please select a facility"),
  samplingTime: z.date(),
  reactorId: z.string().uuid().optional(),
  operatorId: z.string().uuid().optional(),

  // Sampling Details
  weightG: z.number().min(0).optional(),
  volumeMl: z.number().min(0).optional(),
  temperatureC: z.number().optional(),
  moisturePercent: z.number().min(0).max(100).optional(),
  ashPercent: z.number().min(0).max(100).optional(),
  volatileMatterPercent: z.number().min(0).max(100).optional(),

  // Documentation
  notes: z.string().optional(),
  photos: z.array(z.instanceof(File)).optional(),
});

export type SamplingFormValues = z.infer<typeof samplingFormSchema>;

// ============================================
// Incident Report Form Schema
// ============================================

export const incidentFormSchema = z.object({
  // Overview
  facilityId: z.string().uuid("Please select a facility"),
  incidentTime: z.date(),
  reactorId: z.string().uuid().optional(),
  operatorId: z.string().uuid().optional(),

  // Documentation
  notes: z.string().optional(),
  photos: z.array(z.instanceof(File)).optional(),
});

export type IncidentFormValues = z.infer<typeof incidentFormSchema>;

// ============================================
// Biochar Product Form Schema
// ============================================

export const biocharProductFormSchema = z.object({
  // Overview
  facilityId: z.string().uuid("Please select a facility"),
  productionDate: z.date().optional(),

  // Formulation
  formulationId: z.string().uuid().optional(),
  totalWeightKg: z.number().min(0).optional(),
  totalVolumeLiters: z.number().min(0).optional(),
  storageLocationId: z.string().uuid().optional(),

  // Formulation Details
  biocharSourceStorageId: z.string().uuid().optional(),
  biocharAmountKg: z.number().min(0).optional(),
  biocharPerM3Kg: z.number().min(0).optional(),
  compostWeightKg: z.number().min(0).optional(),
  compostPerM3Kg: z.number().min(0).optional(),

  // Documentation
  notes: z.string().optional(),
  photos: z.array(z.instanceof(File)).optional(),
});

export type BiocharProductFormValues = z.infer<typeof biocharProductFormSchema>;
