"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAppForm } from "@/components/forms/form-context";
import { FormPageLayout } from "@/components/data-entry";
import { FormSection } from "@/components/forms/form-section";
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
import { PlusIcon, TrashIcon } from "lucide-react";
import { updateProductionRun } from "../actions";
import type { SelectOption } from "../../actions";

interface ProductionRunEditPageProps {
  options: {
    facilities: SelectOption[];
    reactors: SelectOption[];
    operators: SelectOption[];
    storageLocations: SelectOption[];
  };
  productionRun: {
    id: string;
    facilityId: string;
    date: string;
    startTime: Date | null;
    endTime: Date | null;
    reactorId: string | null;
    processType: string | null;
    operatorId: string | null;
    feedstockAmountKg: number | null;
    moistureBeforeDryingPercent: number | null;
    moistureAfterDryingPercent: number | null;
    biocharAmountKg: number | null;
    biocharStorageLocationId: string | null;
    dieselOperationLiters: number | null;
    dieselGensetLiters: number | null;
    preprocessingFuelLiters: number | null;
    electricityKwh: number | null;
  };
}

const PROCESS_TYPES = [
  { value: "raw_biochar", label: "Raw Biochar" },
  { value: "activated_biochar", label: "Activated Biochar" },
  { value: "slow_pyrolysis", label: "Slow Pyrolysis" },
  { value: "fast_pyrolysis", label: "Fast Pyrolysis" },
];

export function ProductionRunEditPage({ options, productionRun }: ProductionRunEditPageProps) {
  const router = useRouter();

  // Initialize feedstock inputs - for edit, we just show the total amount
  const [feedstockInputs, setFeedstockInputs] = React.useState<
    Array<{ storageLocationId: string; amountKg: number | undefined }>
  >([{ storageLocationId: "", amountKg: productionRun.feedstockAmountKg ?? undefined }]);

  const form = useAppForm({
    defaultValues: {
      facilityId: productionRun.facilityId,
      startTime: productionRun.startTime ?? new Date(),
      endTime: productionRun.endTime ?? undefined,
      reactorId: productionRun.reactorId ?? undefined,
      processType: productionRun.processType ?? undefined,
      operatorId: productionRun.operatorId ?? undefined,
      moistureBeforeDryingPercent: productionRun.moistureBeforeDryingPercent ?? undefined,
      moistureAfterDryingPercent: productionRun.moistureAfterDryingPercent ?? undefined,
      biocharAmountKg: productionRun.biocharAmountKg ?? undefined,
      biocharStorageLocationId: productionRun.biocharStorageLocationId ?? undefined,
      dieselOperationLiters: productionRun.dieselOperationLiters ?? undefined,
      dieselGensetLiters: productionRun.dieselGensetLiters ?? undefined,
      preprocessingFuelLiters: productionRun.preprocessingFuelLiters ?? undefined,
      electricityKwh: productionRun.electricityKwh ?? undefined,
    },
    onSubmit: async ({ value }) => {
      await updateProductionRun(productionRun.id, {
        ...value,
        feedstockInputs: feedstockInputs
          .filter((f) => f.storageLocationId && f.amountKg !== undefined)
          .map((f) => ({ storageLocationId: f.storageLocationId, amountKg: f.amountKg! })),
      });
      router.push("/data-entry");
    },
  });

  // Filter storage locations by type
  const feedstockStorageLocations = options.storageLocations.filter(
    (loc) =>
      loc.name.toLowerCase().includes("feedstock") ||
      loc.name.toLowerCase().includes("bin")
  );
  const biocharStorageLocations = options.storageLocations.filter(
    (loc) =>
      loc.name.toLowerCase().includes("biochar") ||
      loc.name.toLowerCase().includes("pile")
  );

  // Convert options to { value, label } format
  const facilityOptions = options.facilities.map((f) => ({ value: f.id, label: f.name }));
  const reactorOptions = options.reactors.map((r) => ({ value: r.id, label: r.name }));
  const operatorOptions = options.operators.map((o) => ({ value: o.id, label: o.name }));
  const biocharStorageOptions = biocharStorageLocations.map((l) => ({ value: l.id, label: l.name }));

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
    <FormPageLayout
      title="Edit Production Run"
      onSubmit={form.handleSubmit}
      isSubmitting={form.state.isSubmitting}
      submitLabel="Update"
    >
      {/* Overview */}
      <FormSection title="Overview">
        <form.AppField name="facilityId">
          {(field) => (
            <field.SelectField
              label="Facility"
              placeholder="Select facility"
              options={facilityOptions}
            />
          )}
        </form.AppField>

        <form.AppField name="startTime">
          {(field) => (
            <field.DateTimePickerField
              label="Start Time"
              placeholder="Select date and time"
            />
          )}
        </form.AppField>

        <form.AppField name="endTime">
          {(field) => (
            <field.DateTimePickerField
              label="End Time"
              placeholder="Select end date and time"
            />
          )}
        </form.AppField>

        <form.AppField name="reactorId">
          {(field) => (
            <field.SelectField
              label="Reactor"
              placeholder="Select reactor"
              options={reactorOptions}
            />
          )}
        </form.AppField>

        <form.AppField name="processType">
          {(field) => (
            <field.SelectField
              label="Process Type"
              placeholder="Select process type"
              options={PROCESS_TYPES}
            />
          )}
        </form.AppField>

        <form.AppField name="operatorId">
          {(field) => (
            <field.SelectField
              label="Operator"
              placeholder="Select operator"
              options={operatorOptions}
            />
          )}
        </form.AppField>
      </FormSection>

      {/* Feedstock Input */}
      <FormSection title="Feedstock Input">
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
                placeholder="Amount"
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

        <form.AppField name="moistureBeforeDryingPercent">
          {(field) => (
            <field.NumberField
              label="Moisture before Drying"
              unit="%"
              placeholder="Enter moisture content"
            />
          )}
        </form.AppField>

        <form.AppField name="moistureAfterDryingPercent">
          {(field) => (
            <field.NumberField
              label="Moisture after Drying"
              unit="%"
              placeholder="Enter moisture content"
            />
          )}
        </form.AppField>
      </FormSection>

      {/* Biochar Output */}
      <FormSection title="Biochar Output">
        <form.AppField name="biocharAmountKg">
          {(field) => (
            <field.NumberField
              label="Biochar Amount"
              unit="kg"
              placeholder="Enter biochar amount"
            />
          )}
        </form.AppField>

        <form.AppField name="biocharStorageLocationId">
          {(field) => (
            <field.SelectField
              label="Biochar Storage Location"
              placeholder="Select storage location"
              options={biocharStorageOptions}
            />
          )}
        </form.AppField>
      </FormSection>

      {/* Processing Parameters */}
      <FormSection title="Processing Parameter">
        <form.AppField name="dieselOperationLiters">
          {(field) => (
            <field.NumberField
              label="Diesel Operation"
              unit="l"
              placeholder="Enter diesel amount"
            />
          )}
        </form.AppField>

        <form.AppField name="dieselGensetLiters">
          {(field) => (
            <field.NumberField
              label="Diesel Genset"
              unit="l"
              placeholder="Enter diesel amount"
            />
          )}
        </form.AppField>

        <form.AppField name="preprocessingFuelLiters">
          {(field) => (
            <field.NumberField
              label="Preprocessing Fuel"
              unit="l"
              placeholder="Enter fuel amount"
            />
          )}
        </form.AppField>

        <form.AppField name="electricityKwh">
          {(field) => (
            <field.NumberField
              label="Electricity"
              unit="kWh"
              placeholder="Enter electricity"
            />
          )}
        </form.AppField>
      </FormSection>
    </FormPageLayout>
  );
}
