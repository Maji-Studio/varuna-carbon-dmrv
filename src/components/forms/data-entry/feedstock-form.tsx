"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { type FeedstockFormValues } from "@/lib/validations/data-entry";
import { FormSheet } from "@/components/forms/form-sheet";
import { FormSection, FormHeader } from "@/components/forms/form-section";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

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
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [photos, setPhotos] = React.useState<File[]>([]);

  const form = useForm({
    defaultValues: {
      facilityId: defaultFacilityId ?? "",
      collectionDate: new Date(),
      supplierId: "",
      driverId: "",
      vehicleType: "",
      fuelConsumedLiters: undefined as number | undefined,
      feedstockTypeId: "",
      weightKg: undefined as number | undefined,
      moisturePercent: undefined as number | undefined,
      storageLocationId: "",
      notes: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await onSubmit({
          ...value,
          photos,
        } as FeedstockFormValues);
        onOpenChange(false);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

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
      isSubmitting={isSubmitting}
    >
      {/* Header */}
      <FormHeader title="New Feedstock" />

      {/* Delivery Information */}
      <FormSection title="Delivery Information">
        {/* Facility */}
        <form.Field name="facilityId">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Facility</Label>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select facility" />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map((facility) => (
                    <SelectItem key={facility.id} value={facility.id}>
                      {facility.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        {/* Collection Date */}
        <form.Field name="collectionDate">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Collection Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !field.state.value && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.state.value
                      ? format(field.state.value, "PPP")
                      : "Today"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.state.value}
                    onSelect={(date) => field.handleChange(date ?? new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </form.Field>

        {/* Supplier */}
        <form.Field name="supplierId">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Supplier</Label>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        {/* Supplier Location - Read-only, based on selected supplier */}
        {selectedSupplier?.location && (
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium">Supplier Location</Label>
            <Input value={selectedSupplier.location} disabled />
          </div>
        )}

        {/* Driver */}
        <form.Field name="driverId">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Driver</Label>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        {/* Vehicle Type */}
        <form.Field name="vehicleType">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Vehicle Type</Label>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        {/* Fuel Consumed */}
        <form.Field name="fuelConsumedLiters">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Fuel Consumed (l)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Enter fuel consumed in l"
                value={field.state.value ?? ""}
                onChange={(e) =>
                  field.handleChange(
                    e.target.value === "" ? undefined : parseFloat(e.target.value)
                  )
                }
              />
            </div>
          )}
        </form.Field>
      </FormSection>

      {/* Feedstock Details */}
      <FormSection title="Feedstock Details">
        {/* Feedstock Type */}
        <form.Field name="feedstockTypeId">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Feedstock Type</Label>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select feedstock type" />
                </SelectTrigger>
                <SelectContent>
                  {feedstockTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        {/* Weight */}
        <form.Field name="weightKg">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Feedstock Weight (kg)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Enter feedstock weight in kg"
                value={field.state.value ?? ""}
                onChange={(e) =>
                  field.handleChange(
                    e.target.value === "" ? undefined : parseFloat(e.target.value)
                  )
                }
              />
            </div>
          )}
        </form.Field>

        {/* Moisture Content */}
        <form.Field name="moisturePercent">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Moisture Content (%)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="Enter moisture content in %"
                value={field.state.value ?? ""}
                onChange={(e) =>
                  field.handleChange(
                    e.target.value === "" ? undefined : parseFloat(e.target.value)
                  )
                }
              />
            </div>
          )}
        </form.Field>

        {/* Storage Location */}
        <form.Field name="storageLocationId">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Storage</Label>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select storage" />
                </SelectTrigger>
                <SelectContent>
                  {storageLocations
                    .filter((loc) => loc.name.toLowerCase().includes("feedstock"))
                    .map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>
      </FormSection>

      {/* Documentation */}
      <FormSection title="Documentation">
        {/* Notes */}
        <form.Field name="notes">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea
                placeholder="Enter notes"
                className="min-h-[76px] resize-none"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>

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
