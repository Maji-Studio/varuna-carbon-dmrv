"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { PlusIcon, TrashIcon, UploadIcon } from "lucide-react";
import {
  createProductionRunFn,
  updateProductionRunFn,
  deleteProductionRunFn,
} from "@/fn/production-runs";
import type { SelectOption } from "../actions";

interface ProductionRunData {
  id: string;
  facilityId: string;
  startTime: Date | null;
  endTime: Date | null;
  reactorId: string | null;
  operatorId: string | null;
  feedstockAmountKg: number | null;
  moistureBeforeDryingPercent: number | null;
  moistureAfterDryingPercent: number | null;
  biocharAmountKg: number | null;
  biocharDryWeightKg: number | null;
  biocharWetWeightKg: number | null;
  biocharDryMoisturePercent: number | null;
  uncarbonizedBiocharKg: number | null;
  biocharStorageLocationId: string | null;
  dieselOperationLiters: number | null;
  dieselGensetLiters: number | null;
  preprocessingFuelLiters: number | null;
  electricityKwh: number | null;
  plcDataFileUrl: string | null;
}

interface ProductionRunFormProps {
  mode: "create" | "edit";
  initialData?: ProductionRunData;
  options: {
    facilities: SelectOption[];
    reactors: SelectOption[];
    operators: SelectOption[];
    storageLocations: SelectOption[];
  };
}

export function ProductionRunForm({
  mode,
  initialData,
  options,
}: ProductionRunFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [isPending, startTransition] = React.useTransition();

  // PLC data file state
  const [plcDataFile, setPlcDataFile] = React.useState<File | null>(null);
  const plcInputRef = React.useRef<HTMLInputElement>(null);

  // Pre-select first facility for create mode
  const defaultFacilityId = isEdit
    ? (initialData?.facilityId ?? "")
    : (options.facilities[0]?.id ?? "");

  // Feedstock inputs state for multi-source blending
  const [feedstockInputs, setFeedstockInputs] = React.useState<
    Array<{ storageLocationId: string; amountKg: number | undefined }>
  >([
    {
      storageLocationId: "",
      amountKg: initialData?.feedstockAmountKg ?? undefined,
    },
  ]);

  const form = useAppForm({
    defaultValues: {
      facilityId: defaultFacilityId,
      startTime: initialData?.startTime ?? new Date(),
      endTime: initialData?.endTime ?? undefined,
      reactorId: initialData?.reactorId ?? "",
      operatorId: initialData?.operatorId ?? "",
      moistureBeforeDryingPercent:
        initialData?.moistureBeforeDryingPercent ?? undefined,
      moistureAfterDryingPercent:
        initialData?.moistureAfterDryingPercent ?? undefined,
      biocharAmountKg: initialData?.biocharAmountKg ?? undefined,
      biocharDryWeightKg: initialData?.biocharDryWeightKg ?? undefined,
      biocharWetWeightKg: initialData?.biocharWetWeightKg ?? undefined,
      biocharDryMoisturePercent: initialData?.biocharDryMoisturePercent ?? undefined,
      uncarbonizedBiocharKg: initialData?.uncarbonizedBiocharKg ?? undefined,
      biocharStorageLocationId: initialData?.biocharStorageLocationId ?? "",
      dieselOperationLiters: initialData?.dieselOperationLiters ?? undefined,
      dieselGensetLiters: initialData?.dieselGensetLiters ?? undefined,
      preprocessingFuelLiters: initialData?.preprocessingFuelLiters ?? undefined,
      electricityKwh: initialData?.electricityKwh ?? undefined,
    },
    onSubmit: async ({ value }) => {
      const validFeedstockInputs = feedstockInputs.filter(
        (f) => f.storageLocationId && f.amountKg !== undefined && f.amountKg > 0
      );
      const isComplete = Boolean(
        value.facilityId &&
          validFeedstockInputs.length > 0 &&
          value.biocharAmountKg !== undefined &&
          value.biocharAmountKg > 0
      );

      const formData = {
        ...value,
        feedstockInputs: validFeedstockInputs.map((f) => ({
          storageLocationId: f.storageLocationId,
          amountKg: f.amountKg!,
        })),
      };

      const result =
        isEdit && initialData
          ? await updateProductionRunFn(initialData.id, formData)
          : await createProductionRunFn(formData);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        isComplete
          ? "Production run completed"
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
      const result = await deleteProductionRunFn(initialData.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Production run deleted");
      router.push("/data-entry");
      router.refresh();
    });
  };

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

  const hasFeedstockInput = feedstockInputs.some(
    (f) => f.storageLocationId && f.amountKg !== undefined && f.amountKg > 0
  );

  return (
    <form.Subscribe selector={(state) => state.values}>
      {(values) => {
        const isComplete = Boolean(
          values.facilityId &&
            hasFeedstockInput &&
            values.biocharAmountKg !== undefined &&
            values.biocharAmountKg > 0
        );

        return (
          <FormPageLayout
            title={isEdit ? "Edit Production Run" : "New Production Run"}
            onSubmit={handleSubmit}
            onDelete={isEdit ? handleDelete : undefined}
            isSubmitting={isPending}
            isDeleting={isPending}
            hasDraft={isEdit}
            isComplete={isComplete}
          >
            {/* Overview */}
            <FormSection title="Overview">
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

              <form.AppField name="startTime">
                {(field) => (
                  <field.DateTimePickerField
                    label="Start Time"
                    placeholder="Select date and time"
                  />
                )}
              </form.AppField>

              {isEdit && (
                <form.AppField name="endTime">
                  {(field) => (
                    <field.DateTimePickerField
                      label="End Time"
                      placeholder="Select end date and time"
                    />
                  )}
                </form.AppField>
              )}

              <form.AppField name="reactorId">
                {(field) => (
                  <field.SelectField
                    label="Reactor"
                    placeholder="Select reactor"
                    options={reactorOptions}
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
                    <Label className="text-sm font-medium">
                      Feedstock Storage
                      <span className="text-destructive ml-0.5">*</span>
                    </Label>
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
                    <Label className="text-sm font-medium">
                      Amount (kg)
                      <span className="text-destructive ml-0.5">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Amount"
                      value={input.amountKg ?? ""}
                      onChange={(e) =>
                        updateFeedstockInput(
                          index,
                          "amountKg",
                          e.target.value === ""
                            ? undefined
                            : parseFloat(e.target.value)
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
                    required
                  />
                )}
              </form.AppField>

              <form.AppField name="biocharDryWeightKg">
                {(field) => (
                  <field.NumberField
                    label="Dry Weight"
                    unit="kg"
                    placeholder="Enter dry weight"
                  />
                )}
              </form.AppField>

              <form.AppField name="biocharWetWeightKg">
                {(field) => (
                  <field.NumberField
                    label="Wet Weight"
                    unit="kg"
                    placeholder="Enter wet weight"
                  />
                )}
              </form.AppField>

              <form.AppField name="biocharDryMoisturePercent">
                {(field) => (
                  <field.NumberField
                    label="Dry Moisture Content"
                    unit="%"
                    placeholder="Enter dry moisture content"
                  />
                )}
              </form.AppField>

              <form.AppField name="uncarbonizedBiocharKg">
                {(field) => (
                  <field.NumberField
                    label="Uncarbonized Biochar"
                    unit="kg"
                    placeholder="Enter uncarbonized biochar amount"
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

            {/* Processing Data */}
            <FormSection title="Processing Data">
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">PLC Data (CSV)</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => plcInputRef.current?.click()}
                  >
                    <UploadIcon className="mr-2 h-4 w-4" />
                    {plcDataFile ? plcDataFile.name : "Upload PLC Data"}
                  </Button>
                  {plcDataFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setPlcDataFile(null)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <input
                  ref={plcInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setPlcDataFile(file);
                    e.target.value = "";
                  }}
                />
                {initialData?.plcDataFileUrl && !plcDataFile && (
                  <p className="text-xs text-muted-foreground">
                    Current file: {initialData.plcDataFileUrl.split('/').pop()}
                  </p>
                )}
              </div>
            </FormSection>
          </FormPageLayout>
        );
      }}
    </form.Subscribe>
  );
}
