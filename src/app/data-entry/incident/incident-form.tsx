"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppForm } from "@/components/forms/form-context";
import { FormPageLayout } from "@/components/data-entry";
import { FormSection } from "@/components/forms/form-section";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { createIncident, updateIncident, deleteIncident } from "./actions";
import { isIncidentComplete } from "@/lib/validations/completion";
import type { SelectOption } from "../actions";

interface ProductionRunOption {
  id: string;
  name: string;
  facilityId: string;
}

interface IncidentData {
  id: string;
  productionRunId: string;
  incidentTime: Date;
  reactorId: string | null;
  operatorId: string | null;
  notes: string | null;
}

interface IncidentFormProps {
  mode: "create" | "edit";
  initialData?: IncidentData;
  options: {
    reactors: SelectOption[];
    operators: SelectOption[];
  };
  productionRuns: ProductionRunOption[];
}

export function IncidentForm({
  mode,
  initialData,
  options,
  productionRuns,
}: IncidentFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [photos, setPhotos] = React.useState<File[]>([]);
  const [isPending, startTransition] = React.useTransition();

  const form = useAppForm({
    defaultValues: {
      productionRunId: initialData?.productionRunId ?? "",
      incidentTime: initialData?.incidentTime ?? new Date(),
      reactorId: initialData?.reactorId ?? "",
      operatorId: initialData?.operatorId ?? "",
      notes: initialData?.notes ?? "",
    },
    onSubmit: async ({ value }) => {
      const isComplete = isIncidentComplete(value);

      const result = isEdit && initialData
        ? await updateIncident(initialData.id, value)
        : await createIncident(value);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        isComplete
          ? "Incident report completed"
          : isEdit
            ? "Draft updated"
            : "Draft saved"
      );
      router.push("/data-entry");
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
      const result = await deleteIncident(initialData.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Incident report deleted");
      router.push("/data-entry");
    });
  };

  // Memoized options
  const productionRunOptions = React.useMemo(
    () => productionRuns.map((pr) => ({ value: pr.id, label: pr.name })),
    [productionRuns]
  );
  const reactorOptions = React.useMemo(
    () => options.reactors.map((r) => ({ value: r.id, label: r.name })),
    [options.reactors]
  );
  const operatorOptions = React.useMemo(
    () => options.operators.map((o) => ({ value: o.id, label: o.name })),
    [options.operators]
  );

  return (
    <form.Subscribe selector={(state) => state.values}>
      {(values) => {
        const isComplete = isIncidentComplete(values);

        return (
          <FormPageLayout
            title={isEdit ? "Edit Incident Report" : "New Incident Report"}
            onSubmit={handleSubmit}
            onDelete={isEdit ? handleDelete : undefined}
            isSubmitting={isPending}
            isDeleting={isPending}
            hasDraft={isEdit}
            isComplete={isComplete}
          >
            {/* Overview */}
            <FormSection title="Overview">
              <form.AppField name="productionRunId">
                {(field) => (
                  <field.SelectField
                    label="Production Run"
                    placeholder="Select production run"
                    options={productionRunOptions}
                    required
                  />
                )}
              </form.AppField>

              <form.AppField name="incidentTime">
                {(field) => (
                  <field.DateTimePickerField
                    label="Incident Time"
                    placeholder="Select date and time"
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

            {/* Documentation */}
            <FormSection title="Documentation">
              <form.AppField name="notes">
                {(field) => (
                  <field.TextareaField
                    label="Notes"
                    placeholder="Enter notes"
                  />
                )}
              </form.AppField>

              <PhotoUpload
                value={photos}
                onChange={setPhotos}
                label="Add photo or video"
                accept="image/*,video/*"
              />
            </FormSection>
          </FormPageLayout>
        );
      }}
    </form.Subscribe>
  );
}
