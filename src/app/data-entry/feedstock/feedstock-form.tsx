"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppForm } from "@/components/forms/form-context";
import { FormPageLayout } from "@/components/data-entry";
import { FormSection } from "@/components/forms/form-section";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createFeedstock, updateFeedstock, deleteFeedstock } from "./actions";
import { isFeedstockComplete } from "@/lib/validations/completion";
import type { SelectOption } from "../actions";

const VEHICLE_TYPES = [
  { value: "truck", label: "Truck" },
  { value: "pickup", label: "Pickup" },
  { value: "tractor", label: "Tractor" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "bicycle", label: "Bicycle" },
  { value: "other", label: "Other" },
];

interface FeedstockData {
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
  notes?: string | null;
  supplier?: { location: string | null } | null;
}

interface FeedstockFormProps {
  mode: "create" | "edit";
  initialData?: FeedstockData;
  options: {
    facilities: SelectOption[];
    suppliers: SelectOption[];
    drivers: SelectOption[];
    feedstockTypes: SelectOption[];
    storageLocations: SelectOption[];
  };
}

export function FeedstockForm({ mode, initialData, options }: FeedstockFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [photos, setPhotos] = React.useState<File[]>([]);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const form = useAppForm({
    defaultValues: {
      facilityId: initialData?.facilityId ?? "",
      collectionDate: initialData?.date ? new Date(initialData.date) : new Date(),
      supplierId: initialData?.supplierId ?? "",
      driverId: initialData?.driverId ?? "",
      vehicleType: initialData?.vehicleType ?? "",
      fuelConsumedLiters: initialData?.fuelConsumedLiters ?? undefined,
      feedstockTypeId: initialData?.feedstockTypeId ?? "",
      weightKg: initialData?.weightKg ?? undefined,
      moisturePercent: initialData?.moisturePercent ?? undefined,
      storageLocationId: initialData?.storageLocationId ?? "",
      notes: initialData?.notes ?? "",
    },
    onSubmit: async ({ value }) => {
      const isComplete = isFeedstockComplete(value);

      const result = isEdit && initialData
        ? await updateFeedstock(initialData.id, value)
        : await createFeedstock(value);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        isComplete
          ? "Feedstock entry completed"
          : isEdit
            ? "Draft updated"
            : "Draft saved"
      );
      router.push("/data-entry");
    },
  });

  const handleDelete = async () => {
    if (!initialData?.id) return;
    setIsDeleting(true);
    const result = await deleteFeedstock(initialData.id);
    if (!result.success) {
      toast.error(result.error);
      setIsDeleting(false);
      return;
    }
    toast.success("Feedstock deleted");
    router.push("/data-entry");
  };

  // Convert options to { value, label } format (memoized)
  const facilityOptions = React.useMemo(
    () => options.facilities.map((f) => ({ value: f.id, label: f.name })),
    [options.facilities]
  );
  const supplierOptions = React.useMemo(
    () => options.suppliers.map((s) => ({ value: s.id, label: s.name })),
    [options.suppliers]
  );
  const driverOptions = React.useMemo(
    () => options.drivers.map((d) => ({ value: d.id, label: d.name })),
    [options.drivers]
  );
  const feedstockTypeOptions = React.useMemo(
    () => options.feedstockTypes.map((t) => ({ value: t.id, label: t.name })),
    [options.feedstockTypes]
  );
  const feedstockStorageOptions = React.useMemo(
    () =>
      options.storageLocations
        .filter((loc) => loc.name.toLowerCase().includes("feedstock"))
        .map((l) => ({ value: l.id, label: l.name })),
    [options.storageLocations]
  );

  // Get supplier location for display
  const selectedSupplier = options.suppliers.find(
    (s) => s.id === form.state.values.supplierId
  );

  return (
    <form.Subscribe selector={(state) => state.values}>
      {(values) => {
        const isComplete = isFeedstockComplete(values);
        return (
    <FormPageLayout
      title={isEdit ? "Edit Feedstock" : "New Feedstock"}
      onSubmit={form.handleSubmit}
      onDelete={isEdit ? handleDelete : undefined}
      isSubmitting={form.state.isSubmitting}
      isDeleting={isDeleting}
      hasDraft={isEdit}
      isComplete={isComplete}
    >
      {/* Delivery Information */}
      <FormSection title="Delivery Information">
        <form.AppField name="facilityId">
          {(field) => (
            <field.SelectField
              label="Facility"
              placeholder="Select facility"
              options={facilityOptions}
              required
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
              required
            />
          )}
        </form.AppField>

        {/* Supplier Location - Read-only */}
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
              required
            />
          )}
        </form.AppField>

        <form.AppField name="weightKg">
          {(field) => (
            <field.NumberField
              label="Feedstock Weight"
              unit="kg"
              placeholder="Enter weight"
              required
            />
          )}
        </form.AppField>

        <form.AppField name="moisturePercent">
          {(field) => (
            <field.NumberField
              label="Moisture Content"
              unit="%"
              placeholder="Enter moisture content"
              required
            />
          )}
        </form.AppField>

        <form.AppField name="storageLocationId">
          {(field) => (
            <field.SelectField
              label="Storage"
              placeholder="Select storage"
              options={feedstockStorageOptions}
              required
            />
          )}
        </form.AppField>
      </FormSection>

      {/* Documentation */}
      <FormSection title="Documentation">
        <form.AppField name="notes">
          {(field) => (
            <field.TextareaField label="Notes" placeholder="Enter notes" />
          )}
        </form.AppField>

        <PhotoUpload
          value={photos}
          onChange={setPhotos}
          label="Add photo"
          accept="image/*"
        />
      </FormSection>
          </FormPageLayout>
        );
      }}
    </form.Subscribe>
  );
}
