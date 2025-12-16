"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppForm } from "@/components/forms/form-context";
import { FormPageLayout } from "@/components/data-entry";
import { FormSection } from "@/components/forms/form-section";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { createFeedstock, updateFeedstock, deleteFeedstock } from "./actions";
import { isCombinedFeedstockComplete } from "@/lib/validations/completion";
import {
  VEHICLE_TYPES,
  FUEL_TYPES,
  VEHICLE_FUEL_MAP,
  NO_FUEL_VEHICLES,
  calculateDistanceKm,
  calculateFuelConsumed,
} from "@/lib/constants/transport";
import type { SelectOption } from "../actions";

interface FeedstockData {
  id: string;
  facilityId: string;
  date: string;
  // Delivery fields
  deliveryDate: Date | null;
  supplierId: string | null;
  driverId: string | null;
  vehicleType: string | null;
  fuelType: string | null;
  fuelConsumedLiters: number | null;
  distanceKm: number | null;
  // Feedstock fields
  feedstockTypeId: string | null;
  weightKg: number | null;
  moisturePercent: number | null;
  storageLocationId: string | null;
  notes?: string | null;
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
  const [isPending, startTransition] = React.useTransition();

  // Pre-select first facility for create mode
  const defaultFacilityId = isEdit
    ? (initialData?.facilityId ?? "")
    : (options.facilities[0]?.id ?? "");

  const form = useAppForm({
    defaultValues: {
      // Delivery fields
      facilityId: defaultFacilityId,
      deliveryDate: initialData?.deliveryDate ?? new Date(),
      supplierId: initialData?.supplierId ?? "",
      driverId: initialData?.driverId ?? "",
      vehicleType: initialData?.vehicleType ?? "",
      fuelType: initialData?.fuelType ?? "",
      fuelConsumedLiters: initialData?.fuelConsumedLiters ?? undefined,
      distanceKm: initialData?.distanceKm ?? undefined,
      // Feedstock fields
      feedstockTypeId: initialData?.feedstockTypeId ?? "",
      weightKg: initialData?.weightKg ?? undefined,
      moisturePercent: initialData?.moisturePercent ?? undefined,
      storageLocationId: initialData?.storageLocationId ?? "",
      notes: initialData?.notes ?? "",
    },
    onSubmit: async ({ value }) => {
      const isComplete = isCombinedFeedstockComplete(value);

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
      const result = await deleteFeedstock(initialData.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Feedstock deleted");
      router.push("/data-entry");
      router.refresh();
    });
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

  // Get selected supplier and facility for GPS calculations
  const selectedSupplier = options.suppliers.find(
    (s) => s.id === form.state.values.supplierId
  );
  const selectedFacility = options.facilities.find(
    (f) => f.id === form.state.values.facilityId
  );

  // Auto-calculate distance when supplier or facility changes
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

  // Auto-select fuel type based on vehicle type
  React.useEffect(() => {
    const vehicleType = form.state.values.vehicleType;
    if (vehicleType) {
      const defaultFuelType = VEHICLE_FUEL_MAP[vehicleType.toLowerCase()];
      if (defaultFuelType && defaultFuelType !== "electric") {
        form.setFieldValue("fuelType", defaultFuelType);
      } else if (defaultFuelType === "electric") {
        form.setFieldValue("fuelType", "electric");
        form.setFieldValue("fuelConsumedLiters", undefined);
      }
    }
  }, [form.state.values.vehicleType]);

  // Auto-calculate fuel consumed when distance or vehicle type changes
  React.useEffect(() => {
    const vehicleType = form.state.values.vehicleType;
    const distanceKm = form.state.values.distanceKm;

    if (
      vehicleType &&
      distanceKm &&
      !NO_FUEL_VEHICLES.includes(vehicleType.toLowerCase())
    ) {
      const fuel = calculateFuelConsumed(vehicleType, distanceKm);
      form.setFieldValue("fuelConsumedLiters", fuel);
    }
  }, [form.state.values.vehicleType, form.state.values.distanceKm]);

  // Check if current vehicle requires fuel tracking
  const showFuelFields = !NO_FUEL_VEHICLES.includes(
    (form.state.values.vehicleType ?? "").toLowerCase()
  );

  return (
    <form.Subscribe selector={(state) => state.values}>
      {(values) => {
        const isComplete = isCombinedFeedstockComplete(values);
        return (
          <FormPageLayout
            title={isEdit ? "Edit Feedstock" : "New Feedstock"}
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

              {/* Supply Location - Read-only display */}
              {selectedSupplier && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Supply Location
                  </Label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1">
                      {selectedSupplier.location || "No location set"}
                    </span>
                    {selectedSupplier.gpsLat && selectedSupplier.gpsLng && (
                      <span className="text-xs text-muted-foreground">
                        ({selectedSupplier.gpsLat.toFixed(4)},{" "}
                        {selectedSupplier.gpsLng.toFixed(4)})
                      </span>
                    )}
                  </div>
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
            </FormSection>

            {/* Transport Details */}
            <FormSection title="Transport Details">
              <form.AppField name="vehicleType">
                {(field) => (
                  <field.SelectField
                    label="Vehicle Type"
                    placeholder="Select vehicle type"
                    options={[...VEHICLE_TYPES]}
                  />
                )}
              </form.AppField>

              <form.AppField name="distanceKm">
                {(field) => (
                  <field.NumberField
                    label="Distance"
                    unit="km"
                    placeholder="Auto-calculated from GPS"
                  />
                )}
              </form.AppField>

              {showFuelFields && (
                <>
                  <form.AppField name="fuelType">
                    {(field) => (
                      <field.SelectField
                        label="Fuel Type"
                        placeholder="Select fuel type"
                        options={[...FUEL_TYPES]}
                      />
                    )}
                  </form.AppField>

                  <form.AppField name="fuelConsumedLiters">
                    {(field) => (
                      <field.NumberField
                        label="Fuel Consumed"
                        unit="L"
                        placeholder="Auto-calculated from distance"
                      />
                    )}
                  </form.AppField>
                </>
              )}
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
