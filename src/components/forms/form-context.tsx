"use client";

import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import {
  TextField,
  NumberField,
  SelectField,
  TextareaField,
} from "./form-field";
import {
  DatePickerField,
  DateTimePickerField,
} from "./date-time-picker";

// Create the form hook contexts for TanStack Form
export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

// Create the custom form hook with our contexts and registered field components
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    NumberField,
    SelectField,
    TextareaField,
    DatePickerField,
    DateTimePickerField,
  },
  formComponents: {},
});
