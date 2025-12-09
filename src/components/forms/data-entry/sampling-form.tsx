"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { type SamplingFormValues } from "@/lib/validations/data-entry";
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

interface SamplingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SamplingFormValues) => Promise<void>;
  // Options for select fields
  facilities?: SelectOption[];
  reactors?: SelectOption[];
  operators?: SelectOption[];
  // If linked to a production run
  productionRunId?: string;
  defaultFacilityId?: string;
}

// ============================================
// Sampling Form Component
// ============================================

export function SamplingForm({
  open,
  onOpenChange,
  onSubmit,
  facilities = [],
  reactors = [],
  operators = [],
  productionRunId,
  defaultFacilityId,
}: SamplingFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [photos, setPhotos] = React.useState<File[]>([]);

  const form = useForm({
    defaultValues: {
      facilityId: defaultFacilityId ?? "",
      samplingTime: new Date(),
      reactorId: "",
      operatorId: "",
      weightG: undefined as number | undefined,
      volumeMl: undefined as number | undefined,
      temperatureC: undefined as number | undefined,
      moisturePercent: undefined as number | undefined,
      ashPercent: undefined as number | undefined,
      volatileMatterPercent: undefined as number | undefined,
      notes: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await onSubmit({
          ...value,
          photos,
        } as SamplingFormValues);
        onOpenChange(false);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add Sampling"
      onSubmit={form.handleSubmit}
      isSubmitting={isSubmitting}
    >
      {/* Header */}
      <FormHeader title="Add Sampling" />

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

        {/* Sampling Time */}
        <form.Field name="samplingTime">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Sampling Time</Label>
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
                      ? format(field.state.value, "PPP p")
                      : "Today, now"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.state.value}
                    onSelect={(date) => field.handleChange(date ?? new Date())}
                    initialFocus
                  />
                  <div className="border-t p-3">
                    <Label className="text-xs text-muted-foreground">Time</Label>
                    <Input
                      type="time"
                      value={
                        field.state.value
                          ? `${field.state.value.getHours().toString().padStart(2, "0")}:${field.state.value.getMinutes().toString().padStart(2, "0")}`
                          : ""
                      }
                      onChange={(e) => {
                        if (field.state.value) {
                          const [hours, minutes] = e.target.value
                            .split(":")
                            .map(Number);
                          const newDate = new Date(field.state.value);
                          newDate.setHours(hours, minutes);
                          field.handleChange(newDate);
                        }
                      }}
                      className="mt-1"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </form.Field>

        {/* Reactor */}
        <form.Field name="reactorId">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Reactor</Label>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select reactor" />
                </SelectTrigger>
                <SelectContent>
                  {reactors.map((reactor) => (
                    <SelectItem key={reactor.id} value={reactor.id}>
                      {reactor.code ?? reactor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        {/* Operator */}
        <form.Field name="operatorId">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Operator</Label>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((operator) => (
                    <SelectItem key={operator.id} value={operator.id}>
                      {operator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>
      </FormSection>

      {/* Sampling Details */}
      <FormSection title="Sampling Details">
        {/* Weight */}
        <form.Field name="weightG">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Weight (g)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter weight in g"
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

        {/* Volume */}
        <form.Field name="volumeMl">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Volume (ml)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Enter volume in ml"
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

        {/* Temperature */}
        <form.Field name="temperatureC">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Temperature (°C)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Enter temperature in °C"
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

        {/* Ash */}
        <form.Field name="ashPercent">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Ash (%)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="Enter ash content in %"
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

        {/* Volatile Matter */}
        <form.Field name="volatileMatterPercent">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Volatile Matter (%)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="Enter volatile matter in %"
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
