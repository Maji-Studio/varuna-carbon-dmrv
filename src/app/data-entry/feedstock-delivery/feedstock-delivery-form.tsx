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
  createFeedstockDeliveryFn,
  updateFeedstockDeliveryFn,
  deleteFeedstockDeliveryFn,
} from "@/fn/feedstock-deliveries";
import { isFeedstockDeliveryComplete } from "@/lib/completion-checks";
import { calculateDistanceKm } from "@/utils";
import type { SelectOption, VehicleOption } from "../actions";

interface FeedstockDeliveryData {
  id: string;
  facilityId: string;
  deliveryDate: Date | null;
  supplierId: string | null;
  driverId: string | null;
  vehicleId: string | null;
  vehicleType: string | null;
  fuelType: string | null;
  distanceKm: number | null;
  fuelConsumedLiters: number | null;
  feedstockTypeId: string | null;
  weightKg: number | null;
  moisturePercent: number | null;
  notes?: string | null;
  supplier?: { location: string | null } | null;
  vehicle?: { id: string; name: string; fuelType: string; fuelConsumptionLPerKm: number } | null;
}

interface FeedstockDeliveryFormProps {
  mode: "create" | "edit";
  initialData?: FeedstockDeliveryData;
  options: {
    facilities: SelectOption[];
    suppliers: SelectOption[];
    drivers: SelectOption[];
    feedstockTypes: SelectOption[];
    vehicles: VehicleOption[];
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
  const [isPending, startTransition] = React.useTransition();

  const form = useAppForm({
    defaultValues: {
      facilityId: initialData?.facilityId ?? options.facilities[0]?.id ?? "",
      deliveryDate: initialData?.deliveryDate ?? new Date(),
      supplierId: initialData?.supplierId ?? "",
      driverId: initialData?.driverId ?? "",
      vehicleId: initialData?.vehicleId ?? "",
      vehicleType: initialData?.vehicleType ?? "",
      fuelType: initialData?.fuelType ?? "",
      distanceKm: initialData?.distanceKm ?? undefined,
      fuelConsumedLiters: initialData?.fuelConsumedLiters ?? undefined,
      feedstockTypeId: initialData?.feedstockTypeId ?? "",
      weightKg: initialData?.weightKg ?? undefined,
      moisturePercent: initialData?.moisturePercent ?? undefined,
      notes: initialData?.notes ?? "",
    },
    onSubmit: async ({ value }) => {
      const isComplete = isFeedstockDeliveryComplete(value);

      const result =
        isEdit && initialData
          ? await updateFeedstockDeliveryFn(initialData.id, value)
          : await createFeedstockDeliveryFn(value);

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
      router.push("/data-entry");
      router.refresh();
    },
  });

  const handleSubmit = () => {
    startTransition(() => {
      form.handleSubmit();
    });
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    startTransition(async () => {
      const result = await deleteFeedstockDeliveryFn(initialData.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Feedstock delivery deleted");
      router.push("/data-entry");
      router.refresh();
    });
  };

  // Convert options to { value, label } format
  const facilityOptions = options.facilities.map((f) => ({ value: f.id, label: f.name }));
  const supplierOptions = options.suppliers.map((s) => ({ value: s.id, label: s.name }));
  const driverOptions = options.drivers.map((d) => ({ value: d.id, label: d.name }));
  const feedstockTypeOptions = options.feedstockTypes.map((t) => ({ value: t.id, label: t.name }));
  const vehicleOptions = options.vehicles.map((v) => ({ value: v.id, label: v.name }));

  // Get selected entities for calculations
  const selectedSupplier = options.suppliers.find(
    (s) => s.id === form.state.values.supplierId
  );
  const selectedFacility = options.facilities.find(
    (f) => f.id === form.state.values.facilityId
  );
  const selectedVehicle = options.vehicles.find(
    (v) => v.id === form.state.values.vehicleId
  );

  // Auto-set fuel type and vehicle name when vehicle is selected
  React.useEffect(() => {
    if (selectedVehicle) {
      form.setFieldValue("fuelType", selectedVehicle.fuelType);
      form.setFieldValue("vehicleType", selectedVehicle.name);
    }
  }, [selectedVehicle?.id]);

  // Auto-calculate distance when supplier and facility are selected
  React.useEffect(() => {
    if (
      selectedSupplier?.gpsLat &&
      selectedSupplier?.gpsLng &&
      selectedFacility?.gpsLat &&
      selectedFacility?.gpsLng
    ) {
      const distance = calculateDistanceKm(
        selectedSupplier.gpsLat,
        selectedSupplier.gpsLng,
        selectedFacility.gpsLat,
        selectedFacility.gpsLng
      );
      form.setFieldValue("distanceKm", distance);
    }
  }, [
    selectedSupplier?.gpsLat,
    selectedSupplier?.gpsLng,
    selectedFacility?.gpsLat,
    selectedFacility?.gpsLng,
  ]);

  // Auto-calculate fuel consumed when distance or vehicle changes
  React.useEffect(() => {
    const distanceKm = form.state.values.distanceKm;
    if (selectedVehicle && distanceKm) {
      const fuel = Math.round(distanceKm * selectedVehicle.fuelConsumptionLPerKm * 10) / 10;
      form.setFieldValue("fuelConsumedLiters", fuel);
    }
  }, [selectedVehicle?.id, form.state.values.distanceKm]);

  return (
    <form.Subscribe selector={(state) => state.values}>
      {(values) => {
        const isComplete = isFeedstockDeliveryComplete(values);
        return (
          <FormPageLayout
            title={isEdit ? "Edit Feedstock Delivery" : "New Feedstock Delivery"}
            onSubmit={handleSubmit}
            onDelete={isEdit ? handleDelete : undefined}
            isSubmitting={isPending}
            isDeleting={isPending}
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

              <form.AppField name="vehicleId">
                {(field) => (
                  <field.SelectField
                    label="Vehicle"
                    placeholder="Select vehicle"
                    options={vehicleOptions}
                  />
                )}
              </form.AppField>

              {/* Fuel Type - Read-only, auto-populated from vehicle */}
              {selectedVehicle && (
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-medium">Fuel Type</Label>
                  <Input value={selectedVehicle.fuelType} disabled />
                </div>
              )}

              <form.AppField name="distanceKm">
                {(field) => (
                  <field.NumberField
                    label="Distance"
                    unit="km"
                    placeholder="Auto-calculated from GPS"
                  />
                )}
              </form.AppField>

              <form.AppField name="fuelConsumedLiters">
                {(field) => (
                  <field.NumberField
                    label="Fuel Consumed"
                    unit="l"
                    placeholder="Auto-calculated from distance"
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
