"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { type ProductionRunFormValues } from "@/lib/validations/data-entry";
import { FormSheet } from "@/components/forms/form-sheet";
import { FormSection, FormHeader } from "@/components/forms/form-section";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarIcon, PlusIcon, TrashIcon } from "lucide-react";
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

interface ProductionRunFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ProductionRunFormValues) => Promise<void>;
  // Options for select fields
  facilities?: SelectOption[];
  reactors?: SelectOption[];
  operators?: SelectOption[];
  storageLocations?: SelectOption[];
  defaultFacilityId?: string;
}

// ============================================
// Process Types
// ============================================

const PROCESS_TYPES = [
  { value: "raw_biochar", label: "Raw Biochar" },
  { value: "activated_biochar", label: "Activated Biochar" },
  { value: "slow_pyrolysis", label: "Slow Pyrolysis" },
  { value: "fast_pyrolysis", label: "Fast Pyrolysis" },
];

// ============================================
// Production Run Form Component
// ============================================

export function ProductionRunForm({
  open,
  onOpenChange,
  onSubmit,
  facilities = [],
  reactors = [],
  operators = [],
  storageLocations = [],
  defaultFacilityId,
}: ProductionRunFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Separate feedstock inputs state for multi-source blending
  const [feedstockInputs, setFeedstockInputs] = React.useState<
    Array<{ storageLocationId: string; amountKg: number | undefined }>
  >([{ storageLocationId: "", amountKg: undefined }]);

  const form = useForm({
    defaultValues: {
      facilityId: defaultFacilityId ?? "",
      startTime: new Date(),
      reactorId: "",
      processType: "",
      operatorId: "",
      moistureBeforeDryingPercent: undefined as number | undefined,
      moistureAfterDryingPercent: undefined as number | undefined,
      biocharAmountKg: undefined as number | undefined,
      biocharStorageLocationId: "",
      dieselOperationLiters: undefined as number | undefined,
      dieselGensetLiters: undefined as number | undefined,
      preprocessingFuelLiters: undefined as number | undefined,
      electricityKwh: undefined as number | undefined,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await onSubmit({
          ...value,
          feedstockInputs: feedstockInputs.filter(
            (f) => f.storageLocationId && f.amountKg !== undefined
          ),
        } as ProductionRunFormValues);
        onOpenChange(false);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Filter storage locations by type
  const feedstockStorageLocations = storageLocations.filter(
    (loc) =>
      loc.name.toLowerCase().includes("feedstock") ||
      loc.name.toLowerCase().includes("bin")
  );
  const biocharStorageLocations = storageLocations.filter(
    (loc) =>
      loc.name.toLowerCase().includes("biochar") ||
      loc.name.toLowerCase().includes("pile")
  );

  const addFeedstockInput = () => {
    setFeedstockInputs([
      ...feedstockInputs,
      { storageLocationId: "", amountKg: undefined },
    ]);
  };

  const removeFeedstockInput = (index: number) => {
    setFeedstockInputs(feedstockInputs.filter((_, i) => i !== index));
  };

  const updateFeedstockInput = (
    index: number,
    field: "storageLocationId" | "amountKg",
    value: string | number | undefined
  ) => {
    const updated = [...feedstockInputs];
    updated[index] = { ...updated[index], [field]: value };
    setFeedstockInputs(updated);
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add Production Run"
      onSubmit={form.handleSubmit}
      isSubmitting={isSubmitting}
    >
      {/* Header */}
      <FormHeader title="Add Production Run" />

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

        {/* Start Time */}
        <form.Field name="startTime">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Start Time</Label>
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

        {/* Process Type */}
        <form.Field name="processType">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Process Type</Label>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select process type" />
                </SelectTrigger>
                <SelectContent>
                  {PROCESS_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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

      {/* Feedstock Input */}
      <FormSection title="Feedstock Input">
        {/* Multi-source feedstock inputs */}
        {feedstockInputs.map((input, index) => (
          <div key={index} className="flex gap-4 items-end">
            <div className="flex flex-col gap-1 flex-1">
              <Label className="text-sm font-medium">Feedstock Storage</Label>
              <Select
                value={input.storageLocationId}
                onValueChange={(value) =>
                  updateFeedstockInput(index, "storageLocationId", value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select feedstock storage" />
                </SelectTrigger>
                <SelectContent>
                  {feedstockStorageLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1 w-[120px]">
              <Label className="text-sm font-medium">Amount (kg)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Amount in kg"
                value={input.amountKg ?? ""}
                onChange={(e) =>
                  updateFeedstockInput(
                    index,
                    "amountKg",
                    e.target.value === "" ? undefined : parseFloat(e.target.value)
                  )
                }
              />
            </div>
            {feedstockInputs.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFeedstockInput(index)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addFeedstockInput}
          className="w-fit"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Feedstock Source
        </Button>

        {/* Moisture Before Drying */}
        <form.Field name="moistureBeforeDryingPercent">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">
                Moisture before Drying (%)
              </Label>
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

        {/* Moisture After Drying */}
        <form.Field name="moistureAfterDryingPercent">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">
                Moisture after Drying (%)
              </Label>
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
      </FormSection>

      {/* Biochar Output */}
      <FormSection title="Biochar Output">
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

        {/* Biochar Storage Location */}
        <form.Field name="biocharStorageLocationId">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">
                Biochar Storage Location
              </Label>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select biochar storage location" />
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
      </FormSection>

      {/* Processing Parameters */}
      <FormSection title="Processing Parameter">
        {/* Diesel Operation */}
        <form.Field name="dieselOperationLiters">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Diesel Operation (l)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Enter diesel operation in l"
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

        {/* Diesel Genset */}
        <form.Field name="dieselGensetLiters">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Diesel Genset (l)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Enter diesel genset in l"
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

        {/* Preprocessing Fuel */}
        <form.Field name="preprocessingFuelLiters">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Preprocessing Fuel (l)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Enter preprocessing fuel in l"
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

        {/* Electricity */}
        <form.Field name="electricityKwh">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Electricity (kWh)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Enter electricity in kWh"
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
    </FormSheet>
  );
}
