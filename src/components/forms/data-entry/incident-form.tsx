"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { type IncidentFormValues } from "@/lib/validations/data-entry";
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

interface IncidentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: IncidentFormValues) => Promise<void>;
  // Options for select fields
  facilities?: SelectOption[];
  reactors?: SelectOption[];
  operators?: SelectOption[];
  // If linked to a production run
  productionRunId?: string;
  defaultFacilityId?: string;
}

// ============================================
// Incident Form Component
// ============================================

export function IncidentForm({
  open,
  onOpenChange,
  onSubmit,
  facilities = [],
  reactors = [],
  operators = [],
  productionRunId,
  defaultFacilityId,
}: IncidentFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [photos, setPhotos] = React.useState<File[]>([]);

  const form = useForm({
    defaultValues: {
      facilityId: defaultFacilityId ?? "",
      incidentTime: new Date(),
      reactorId: "",
      operatorId: "",
      notes: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await onSubmit({
          ...value,
          photos,
        } as IncidentFormValues);
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
      title="Add Incident"
      onSubmit={form.handleSubmit}
      isSubmitting={isSubmitting}
    >
      {/* Header */}
      <FormHeader title="Add Incident" />

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

        {/* Incident Time */}
        <form.Field name="incidentTime">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Incident Time</Label>
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
