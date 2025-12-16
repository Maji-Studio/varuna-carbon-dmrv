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
import { calculateDistanceKm } from "@/lib/utils";
import type { SelectOption, VehicleOption } from "../actions";

// Helper component to handle auto-calculations with reactive form values
function AutoCalculations({
  values,
  options,
  form,
  prevAutoDistanceRef,
  prevAutoFuelRef,
}: {
  values: {
    facilityId: string;
    supplierId: string;
    vehicleId: string;
    distanceKm: number | undefined;
    fuelConsumedLiters: number | undefined;
  };
  options: {
    facilities: SelectOption[];
    suppliers: SelectOption[];
    vehicles: VehicleOption[];
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  prevAutoDistanceRef: React.MutableRefObject<number | undefined>;
  prevAutoFuelRef: React.MutableRefObject<number | undefined>;
}) {
  const selectedSupplier = options.suppliers.find((s) => s.id === values.supplierId);
  const selectedFacility = options.facilities.find((f) => f.id === values.facilityId);
  const selectedVehicle = options.vehicles.find((v) => v.id === values.vehicleId);

  // Auto-set fuel type when vehicle is selected
  React.useEffect(() => {
    if (selectedVehicle) {
      form.setFieldValue("fuelType", selectedVehicle.fuelType);
      form.setFieldValue("vehicleType", selectedVehicle.name);
    }
  }, [selectedVehicle?.id, form, selectedVehicle]);

  // Auto-calculate distance when supplier and facility are selected
  React.useEffect(() => {
    if (selectedSupplier && selectedFacility) {
      const supplierLat = selectedSupplier.gpsLat;
      const supplierLng = selectedSupplier.gpsLng;
      const facilityLat = selectedFacility.gpsLat;
      const facilityLng = selectedFacility.gpsLng;

      if (supplierLat && supplierLng && facilityLat && facilityLng) {
        const calculatedDistance = calculateDistanceKm(
          supplierLat,
          supplierLng,
          facilityLat,
          facilityLng
        );

        // Only update if no value set yet or if value matches previous auto-calculated value
        if (values.distanceKm === undefined || values.distanceKm === prevAutoDistanceRef.current) {
          form.setFieldValue("distanceKm", calculatedDistance);
        }
        prevAutoDistanceRef.current = calculatedDistance;
      }
    }
  }, [selectedSupplier?.id, selectedFacility?.id, form, selectedSupplier, selectedFacility, values.distanceKm, prevAutoDistanceRef]);

  // Auto-calculate fuel consumed when distance and vehicle are selected
  React.useEffect(() => {
    if (selectedVehicle && values.distanceKm) {
      const calculatedFuel = Math.round(
        values.distanceKm * selectedVehicle.fuelConsumptionLPerKm * 10
      ) / 10;

      // Only update if no value set yet or if value matches previous auto-calculated value
      if (values.fuelConsumedLiters === undefined || values.fuelConsumedLiters === prevAutoFuelRef.current) {
        form.setFieldValue("fuelConsumedLiters", calculatedFuel);
      }
      prevAutoFuelRef.current = calculatedFuel;
    }
  }, [values.distanceKm, selectedVehicle?.id, form, selectedVehicle, values.fuelConsumedLiters, prevAutoFuelRef]);

  return null;
}

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

  // Track previous auto-calculated values to detect manual overrides
  const prevAutoDistanceRef = React.useRef<number | undefined>(undefined);
  const prevAutoFuelRef = React.useRef<number | undefined>(undefined);

  const form = useAppForm({
    defaultValues: {
      // Preselect first facility if not editing
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
      const result = await deleteFeedstockDelivery(initialData.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Feedstock delivery deleted");
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
  const vehicleOptions = React.useMemo(
    () => options.vehicles.map((v) => ({ value: v.id, label: v.name })),
    [options.vehicles]
  );

  return (
    <form.Subscribe selector={(state) => state.values}>
      {(values) => {
        const isComplete = isFeedstockDeliveryComplete(values);
        const selectedSupplier = options.suppliers.find((s) => s.id === values.supplierId);
        const selectedVehicle = options.vehicles.find((v) => v.id === values.vehicleId);
        return (
          <>
            <AutoCalculations
              values={values}
              options={options}
              form={form}
              prevAutoDistanceRef={prevAutoDistanceRef}
              prevAutoFuelRef={prevAutoFuelRef}
            />
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
          </>
        );
      }}
    </form.Subscribe>
  );
}
