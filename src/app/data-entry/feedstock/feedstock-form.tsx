"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppForm } from "@/components/forms/form-context";
import { FormPageLayout } from "@/components/data-entry";
import { FormSection } from "@/components/forms/form-section";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { createFeedstock, updateFeedstock, deleteFeedstock } from "./actions";
import { isFeedstockComplete } from "@/lib/validations/completion";
import type { SelectOption } from "../actions";

interface FeedstockData {
  id: string;
  facilityId: string;
  date: string;
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
    feedstockTypes: SelectOption[];
    storageLocations: SelectOption[];
  };
}

export function FeedstockForm({ mode, initialData, options }: FeedstockFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [photos, setPhotos] = React.useState<File[]>([]);
  const [isPending, startTransition] = React.useTransition();

  const form = useAppForm({
    defaultValues: {
      facilityId: initialData?.facilityId ?? "",
      collectionDate: initialData?.date ? new Date(initialData.date) : new Date(),
      feedstockTypeId: initialData?.feedstockTypeId ?? "",
      weightKg: initialData?.weightKg ?? undefined,
      moisturePercent: initialData?.moisturePercent ?? undefined,
      storageLocationId: initialData?.storageLocationId ?? "",
      notes: initialData?.notes ?? "",
    },
    onSubmit: async ({ value }) => {
      const isComplete = isFeedstockComplete(value);

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
    });
  };

  // Convert options to { value, label } format (memoized)
  const facilityOptions = React.useMemo(
    () => options.facilities.map((f) => ({ value: f.id, label: f.name })),
    [options.facilities]
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

  return (
    <form.Subscribe selector={(state) => state.values}>
      {(values) => {
        const isComplete = isFeedstockComplete(values);
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

        <form.AppField name="collectionDate">
          {(field) => (
            <field.DatePickerField
              label="Collection Date"
              placeholder="Select date"
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
