"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAppForm } from "@/components/forms/form-context";
import { FormPageLayout } from "@/components/data-entry";
import { FormSection } from "@/components/forms/form-section";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { updateFeedstock } from "../actions";
import type { SelectOption } from "../../actions";

interface FeedstockEditPageProps {
  options: {
    facilities: SelectOption[];
    suppliers: SelectOption[];
    drivers: SelectOption[];
    feedstockTypes: SelectOption[];
    storageLocations: SelectOption[];
  };
  feedstock: {
    id: string;
    facilityId: string;
    date: string;
    feedstockTypeId: string | null;
    supplierId: string | null;
    driverId: string | null;
    vehicleType: string | null;
    fuelConsumedLiters: number | null;
    weightKg: number | null;
    moisturePercent: number | null;
    storageLocationId: string | null;
    supplier?: { location: string | null } | null;
  };
}

const VEHICLE_TYPES = [
  { value: "truck", label: "Truck" },
  { value: "pickup", label: "Pickup" },
  { value: "tractor", label: "Tractor" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "bicycle", label: "Bicycle" },
  { value: "other", label: "Other" },
];

export function FeedstockEditPage({ options, feedstock }: FeedstockEditPageProps) {
  const router = useRouter();
  const [photos, setPhotos] = React.useState<File[]>([]);

  const form = useAppForm({
    defaultValues: {
      facilityId: feedstock.facilityId,
      collectionDate: feedstock.date ? new Date(feedstock.date) : new Date(),
      supplierId: feedstock.supplierId ?? undefined,
      driverId: feedstock.driverId ?? undefined,
      vehicleType: feedstock.vehicleType ?? undefined,
      fuelConsumedLiters: feedstock.fuelConsumedLiters ?? undefined,
      feedstockTypeId: feedstock.feedstockTypeId ?? undefined,
      weightKg: feedstock.weightKg ?? undefined,
      moisturePercent: feedstock.moisturePercent ?? undefined,
      storageLocationId: feedstock.storageLocationId ?? undefined,
      notes: "" as string | undefined,
    },
    onSubmit: async ({ value }) => {
      await updateFeedstock(feedstock.id, value);
      router.push("/data-entry");
    },
  });

  // Convert options to { value, label } format
  const facilityOptions = options.facilities.map((f) => ({ value: f.id, label: f.name }));
  const supplierOptions = options.suppliers.map((s) => ({ value: s.id, label: s.name }));
  const driverOptions = options.drivers.map((d) => ({ value: d.id, label: d.name }));
  const feedstockTypeOptions = options.feedstockTypes.map((t) => ({ value: t.id, label: t.name }));
  const feedstockStorageOptions = options.storageLocations
    .filter((loc) => loc.name.toLowerCase().includes("feedstock"))
    .map((l) => ({ value: l.id, label: l.name }));

  // Get supplier location for display
  const selectedSupplier = options.suppliers.find(
    (s) => s.id === form.state.values.supplierId
  );

  return (
    <FormPageLayout
      title="Edit Feedstock"
      onSubmit={form.handleSubmit}
      isSubmitting={form.state.isSubmitting}
      submitLabel="Update"
    >
      {/* Delivery Information */}
      <FormSection title="Delivery Information">
        <form.AppField name="facilityId">
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
    </FormPageLayout>
  );
}
