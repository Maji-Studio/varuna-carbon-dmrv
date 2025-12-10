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
import {
  createFeedstockDelivery,
  updateFeedstockDelivery,
  deleteFeedstockDelivery,
} from "./actions";
import { isFeedstockDeliveryComplete } from "@/lib/validations/completion";
import type { SelectOption } from "../actions";

const VEHICLE_TYPES = [
  { value: "truck", label: "Truck" },
  { value: "pickup", label: "Pickup" },
  { value: "tractor", label: "Tractor" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "bicycle", label: "Bicycle" },
  { value: "other", label: "Other" },
];

const FUEL_TYPES = [
  { value: "diesel", label: "Diesel" },
  { value: "petrol", label: "Petrol" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
  { value: "other", label: "Other" },
];

interface FeedstockDeliveryData {
  id: string;
  facilityId: string;
  deliveryDate: Date | null;
  supplierId: string | null;
  driverId: string | null;
  vehicleType: string | null;
  fuelType: string | null;
  fuelConsumedLiters: number | null;
  notes?: string | null;
  supplier?: { location: string | null } | null;
}

interface FeedstockDeliveryFormProps {
  mode: "create" | "edit";
  initialData?: FeedstockDeliveryData;
  options: {
    facilities: SelectOption[];
    suppliers: SelectOption[];
    drivers: SelectOption[];
  };
}

export function FeedstockDeliveryForm({
  mode,
  initialData,
  options,
}: FeedstockDeliveryFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [photos, setPhotos] = React.useState<File[]>([]);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const form = useAppForm({
    defaultValues: {
      facilityId: initialData?.facilityId ?? "",
      deliveryDate: initialData?.deliveryDate ?? new Date(),
      supplierId: initialData?.supplierId ?? "",
      driverId: initialData?.driverId ?? "",
      vehicleType: initialData?.vehicleType ?? "",
      fuelType: initialData?.fuelType ?? "",
      fuelConsumedLiters: initialData?.fuelConsumedLiters ?? undefined,
      notes: initialData?.notes ?? "",
    },
    onSubmit: async ({ value }) => {
      const isComplete = isFeedstockDeliveryComplete(value);

      const result =
        isEdit && initialData
          ? await updateFeedstockDelivery(initialData.id, value)
          : await createFeedstockDelivery(value);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        isComplete
          ? "Feedstock delivery completed"
          : isEdit
            ? "Draft updated"
            : "Draft saved"
      );
      router.refresh();
      router.push("/data-entry");
    },
  });

  const handleDelete = async () => {
    if (!initialData?.id) return;
    setIsDeleting(true);
    const result = await deleteFeedstockDelivery(initialData.id);
    if (!result.success) {
      toast.error(result.error);
      setIsDeleting(false);
      return;
    }
    toast.success("Feedstock delivery deleted");
    router.refresh();
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

  // Get supplier location for display
  const selectedSupplier = options.suppliers.find(
    (s) => s.id === form.state.values.supplierId
  );

  return (
    <form.Subscribe selector={(state) => state.values}>
      {(values) => {
        const isComplete = isFeedstockDeliveryComplete(values);
        return (
          <FormPageLayout
            title={isEdit ? "Edit Feedstock Delivery" : "New Feedstock Delivery"}
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

              <form.AppField name="deliveryDate">
                {(field) => (
                  <field.DatePickerField
                    label="Delivery Date"
                    placeholder="Select date"
                    required
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

              <form.AppField name="fuelType">
                {(field) => (
                  <field.SelectField
                    label="Fuel Type"
                    placeholder="Select fuel type"
                    options={FUEL_TYPES}
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
