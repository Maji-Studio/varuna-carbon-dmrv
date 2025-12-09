"use client";

import * as React from "react";
import { useFieldContext } from "@/components/forms/form-context";
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
import { cn } from "@/lib/utils";

// ============================================
// Form Field Wrapper - Vertical Layout
// ============================================

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  error?: string;
}

export function FormField({ label, children, className, error }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ============================================
// Text Input Field
// ============================================

interface TextFieldProps {
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "email";
  className?: string;
}

export function TextField({ label, placeholder, type = "text", className }: TextFieldProps) {
  const field = useFieldContext<string | number>();

  return (
    <FormField
      label={label}
      className={className}
      error={field.state.meta.errors?.[0]?.message}
    >
      <Input
        type={type}
        placeholder={placeholder}
        value={field.state.value ?? ""}
        onChange={(e) => {
          const value = type === "number"
            ? (e.target.value === "" ? undefined : parseFloat(e.target.value))
            : e.target.value;
          field.handleChange(value as string | number);
        }}
        onBlur={field.handleBlur}
        aria-invalid={field.state.meta.errors?.length > 0}
      />
    </FormField>
  );
}

// ============================================
// Number Field with Unit
// ============================================

interface NumberFieldProps {
  label: string;
  placeholder?: string;
  unit?: string;
  className?: string;
}

export function NumberField({ label, placeholder, unit, className }: NumberFieldProps) {
  const field = useFieldContext<number | undefined>();

  const displayLabel = unit ? `${label} (${unit})` : label;

  return (
    <FormField
      label={displayLabel}
      className={className}
      error={field.state.meta.errors?.[0]?.message}
    >
      <Input
        type="number"
        step="any"
        placeholder={placeholder}
        value={field.state.value ?? ""}
        onChange={(e) => {
          const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
          field.handleChange(value);
        }}
        onBlur={field.handleBlur}
        aria-invalid={field.state.meta.errors?.length > 0}
      />
    </FormField>
  );
}

// ============================================
// Select Field
// ============================================

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  className?: string;
}

export function SelectField({ label, placeholder, options, className }: SelectFieldProps) {
  const field = useFieldContext<string | undefined>();

  return (
    <FormField
      label={label}
      className={className}
      error={field.state.meta.errors?.[0]?.message}
    >
      <Select
        value={field.state.value ?? ""}
        onValueChange={(value) => field.handleChange(value)}
      >
        <SelectTrigger
          className="w-full"
          aria-invalid={field.state.meta.errors?.length > 0}
        >
          <SelectValue placeholder={placeholder ?? `Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}

// ============================================
// Textarea Field
// ============================================

interface TextareaFieldProps {
  label: string;
  placeholder?: string;
  className?: string;
}

export function TextareaField({ label, placeholder, className }: TextareaFieldProps) {
  const field = useFieldContext<string | undefined>();

  return (
    <FormField
      label={label}
      className={className}
      error={field.state.meta.errors?.[0]?.message}
    >
      <Textarea
        placeholder={placeholder}
        value={field.state.value ?? ""}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        className="min-h-[76px] resize-none"
        aria-invalid={field.state.meta.errors?.length > 0}
      />
    </FormField>
  );
}
