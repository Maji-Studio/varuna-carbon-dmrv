"use client";

import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

// Create the form hook contexts for TanStack Form
export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

// Create the custom form hook with our contexts
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {},
});
