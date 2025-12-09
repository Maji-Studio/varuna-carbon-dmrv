"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { type BiocharProductFormValues } from "@/lib/validations/data-entry";
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
  code?: string;
}

interface BiocharProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BiocharProductFormValues) => Promise<void>;
  // Options for select fields
  facilities?: SelectOption[];
  formulations?: SelectOption[];
  storageLocations?: SelectOption[];
  defaultFacilityId?: string;
}

// ============================================
// Biochar Product Form Component
// ============================================

export function BiocharProductForm({
  open,
  onOpenChange,
  onSubmit,
  facilities = [],
  formulations = [],
  storageLocations = [],
  defaultFacilityId,
}: BiocharProductFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [photos, setPhotos] = React.useState<File[]>([]);

  const form = useForm({
    defaultValues: {
      facilityId: defaultFacilityId ?? "",
      productionDate: new Date(),
      formulationId: "",
      totalWeightKg: undefined as number | undefined,
      totalVolumeLiters: undefined as number | undefined,
      storageLocationId: "",
      biocharSourceStorageId: "",
      biocharAmountKg: undefined as number | undefined,
      biocharPerM3Kg: undefined as number | undefined,
      compostWeightKg: undefined as number | undefined,
      compostPerM3Kg: undefined as number | undefined,
      notes: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await onSubmit({
          ...value,
          photos,
        } as BiocharProductFormValues);
        onOpenChange(false);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Filter storage locations
  const biocharStorageLocations = storageLocations.filter(
    (loc) =>
      loc.name.toLowerCase().includes("biochar") ||
      loc.name.toLowerCase().includes("pile")
  );
  const productStorageLocations = storageLocations.filter(
    (loc) =>
      loc.name.toLowerCase().includes("product") ||
      loc.name.toLowerCase().includes("pile")
  );

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add Biochar Product"
      onSubmit={form.handleSubmit}
      isSubmitting={isSubmitting}
    >
      {/* Header */}
      <FormHeader title="Add Biochar Product" />

      {/* Overview */}
      <FormSection title="Overview">
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

        {/* Production Date */}
        <form.Field name="productionDate">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Production Date</Label>
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
      </FormSection>

      {/* Formulation */}
      <FormSection title="Formulation">
        {/* Formulation */}
        <form.Field name="formulationId">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Formulation</Label>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select formulation" />
                </SelectTrigger>
                <SelectContent>
                  {formulations.map((formulation) => (
                    <SelectItem key={formulation.id} value={formulation.id}>
                      {formulation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        {/* Total Weight */}
        <form.Field name="totalWeightKg">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Total Weight (kg)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Enter total weight in kg"
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

        {/* Total Volume */}
        <form.Field name="totalVolumeLiters">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Total Volume (l)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Enter total volume in l"
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
              <Label className="text-sm font-medium">Storage Location</Label>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select storage location" />
                </SelectTrigger>
                <SelectContent>
                  {productStorageLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>
      </FormSection>

      {/* Formulation Details */}
      <FormSection title="Formulation Details">
        {/* Biochar Source */}
        <form.Field name="biocharSourceStorageId">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Biochar Source</Label>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select biochar source" />
                </SelectTrigger>
                <SelectContent>
                  {biocharStorageLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        {/* Biochar Amount */}
        <form.Field name="biocharAmountKg">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Biochar Amount (kg)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Enter biochar amount in kg"
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

        {/* Biochar per m³ */}
        <form.Field name="biocharPerM3Kg">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Biochar per m³</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Enter biochar per m³"
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

        {/* Compost Amount */}
        <form.Field name="compostWeightKg">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Compost Amount (kg)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Enter compost amount in kg"
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

        {/* Compost per m³ */}
        <form.Field name="compostPerM3Kg">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Compost per m³</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Enter compost per m³"
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

        {/* Photos/Videos */}
        <PhotoUpload
          value={photos}
          onChange={setPhotos}
          label="Add photo or video"
          accept="image/*,video/*"
        />
      </FormSection>
    </FormSheet>
  );
}
