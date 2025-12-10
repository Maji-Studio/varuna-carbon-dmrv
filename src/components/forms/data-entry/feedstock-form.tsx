"use client";

import * as React from "react";
import { useAppForm } from "@/components/forms/form-context";
import { type FeedstockFormValues } from "@/lib/validations/data-entry";
import { FormSheet } from "@/components/forms/form-sheet";
import { FormSection, FormHeader } from "@/components/forms/form-section";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { z } from "zod";

// ============================================
// Types for select options
// ============================================

interface SelectOption {
  id: string;
  name: string;
  location?: string;
}

interface FeedstockFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FeedstockFormValues) => Promise<void>;
  // Options for select fields - would come from DB queries
  facilities?: SelectOption[];
  suppliers?: SelectOption[];
  drivers?: SelectOption[];
  feedstockTypes?: SelectOption[];
  storageLocations?: SelectOption[];
  defaultFacilityId?: string;
}

// ============================================
// Vehicle Types - hardcoded for now
// ============================================

const VEHICLE_TYPES = [
  { value: "truck", label: "Truck" },
  { value: "pickup", label: "Pickup" },
  { value: "tractor", label: "Tractor" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "bicycle", label: "Bicycle" },
  { value: "other", label: "Other" },
];

// ============================================
// Feedstock Form Component
// ============================================

export function FeedstockForm({
  open,
  onOpenChange,
  onSubmit,
  facilities = [],
  suppliers = [],
  drivers = [],
  feedstockTypes = [],
  storageLocations = [],
  defaultFacilityId,
}: FeedstockFormProps) {
  const [photos, setPhotos] = React.useState<File[]>([]);

  const form = useAppForm({
    defaultValues: {
      facilityId: defaultFacilityId ?? "",
      collectionDate: new Date() as Date | undefined,
      supplierId: "" as string | undefined,
      driverId: "" as string | undefined,
      vehicleType: "" as string | undefined,
      fuelConsumedLiters: undefined as number | undefined,
      feedstockTypeId: "" as string | undefined,
      weightKg: undefined as number | undefined,
      moisturePercent: undefined as number | undefined,
      storageLocationId: "" as string | undefined,
      notes: "" as string | undefined,
    },
    onSubmit: async ({ value }) => {
      await onSubmit({
        ...value,
        photos,
      } as FeedstockFormValues);
      onOpenChange(false);
    },
  });

  // Field-level validators
  const requiredString = z.string().min(1, "Required");

  // Convert options to { value, label } format
  const facilityOptions = facilities.map((f) => ({ value: f.id, label: f.name }));
  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.name }));
  const driverOptions = drivers.map((d) => ({ value: d.id, label: d.name }));
  const feedstockTypeOptions = feedstockTypes.map((t) => ({ value: t.id, label: t.name }));
  const feedstockStorageOptions = storageLocations
    .filter((loc) => loc.name.toLowerCase().includes("feedstock"))
    .map((l) => ({ value: l.id, label: l.name }));

  // Get supplier location for display
  const selectedSupplier = suppliers.find(
    (s) => s.id === form.state.values.supplierId
  );

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="New Feedstock"
      onSubmit={form.handleSubmit}
      isSubmitting={form.state.isSubmitting}
    >
      {/* Header */}
      <FormHeader title="New Feedstock" />

      {/* Delivery Information */}
      <FormSection title="Delivery Information">
        <form.AppField
          name="facilityId"
          validators={{ onBlur: requiredString }}
        >
          {(field) => (
            <field.SelectField
              label="Facility"
              placeholder="Select facility"
              options={facilityOptions}
            />
          )}
        </form.AppField>

        <form.AppField name="collectionDate">
          {(field) => (
            <field.DatePickerField
              label="Collection Date"
              placeholder="Select date"
            />
          )}
        </form.AppField>

        <form.AppField name="supplierId">
          {(field) => (
            <field.SelectField
              label="Supplier"
              placeholder="Select supplier"
              options={supplierOptions}
            />
          )}
        </form.AppField>

        {/* Supplier Location - Read-only, based on selected supplier */}
        {selectedSupplier?.location && (
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium">Supplier Location</Label>
            <Input value={selectedSupplier.location} disabled />
          </div>
        )}

        <form.AppField name="driverId">
          {(field) => (
            <field.SelectField
              label="Driver"
              placeholder="Select driver"
              options={driverOptions}
            />
          )}
        </form.AppField>

        <form.AppField name="vehicleType">
          {(field) => (
            <field.SelectField
              label="Vehicle Type"
              placeholder="Select vehicle type"
              options={VEHICLE_TYPES}
            />
          )}
        </form.AppField>

        <form.AppField name="fuelConsumedLiters">
          {(field) => (
            <field.NumberField
              label="Fuel Consumed"
              unit="l"
              placeholder="Enter fuel consumed"
            />
          )}
        </form.AppField>
      </FormSection>

      {/* Feedstock Details */}
      <FormSection title="Feedstock Details">
        <form.AppField name="feedstockTypeId">
          {(field) => (
            <field.SelectField
              label="Feedstock Type"
              placeholder="Select feedstock type"
              options={feedstockTypeOptions}
            />
          )}
        </form.AppField>

        <form.AppField name="weightKg">
          {(field) => (
            <field.NumberField
              label="Feedstock Weight"
              unit="kg"
              placeholder="Enter weight"
            />
          )}
        </form.AppField>

        <form.AppField name="moisturePercent">
          {(field) => (
            <field.NumberField
              label="Moisture Content"
              unit="%"
              placeholder="Enter moisture content"
            />
          )}
        </form.AppField>

        <form.AppField name="storageLocationId">
          {(field) => (
            <field.SelectField
              label="Storage"
              placeholder="Select storage"
              options={feedstockStorageOptions}
            />
          )}
        </form.AppField>
      </FormSection>

      {/* Documentation */}
      <FormSection title="Documentation">
        <form.AppField name="notes">
          {(field) => (
            <field.TextareaField
              label="Notes"
              placeholder="Enter notes"
            />
          )}
        </form.AppField>

        {/* Photos */}
        <PhotoUpload
          value={photos}
          onChange={setPhotos}
          label="Add photo"
          accept="image/*"
        />
      </FormSection>
    </FormSheet>
  );
}
