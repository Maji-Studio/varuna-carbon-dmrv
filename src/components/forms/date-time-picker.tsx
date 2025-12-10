"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFieldContext } from "@/components/forms/form-context";
import { FormField } from "@/components/forms/form-field";

// ============================================
// Date Picker Field
// ============================================

interface DatePickerFieldProps {
  label: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function DatePickerField({ label, placeholder, className, required }: DatePickerFieldProps) {
  const field = useFieldContext<Date | string | undefined>();
  const [open, setOpen] = React.useState(false);

  const value = field.state.value
    ? (typeof field.state.value === "string" ? new Date(field.state.value) : field.state.value)
    : undefined;

  return (
    <FormField
      label={label}
      className={className}
      error={field.state.meta.errors?.[0]?.message}
      required={required}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : <span>{placeholder ?? "Pick a date"}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              field.handleChange(date);
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </FormField>
  );
}

// ============================================
// Date Time Picker Field
// ============================================

interface DateTimePickerFieldProps {
  label: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function DateTimePickerField({ label, placeholder, className, required }: DateTimePickerFieldProps) {
  const field = useFieldContext<Date | string | undefined>();
  const [open, setOpen] = React.useState(false);

  const value = field.state.value
    ? (typeof field.state.value === "string" ? new Date(field.state.value) : field.state.value)
    : undefined;

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!value) return;

    const [hours, minutes] = e.target.value.split(":").map(Number);
    const newDate = new Date(value);
    newDate.setHours(hours, minutes);
    field.handleChange(newDate);
  };

  const timeValue = value
    ? `${value.getHours().toString().padStart(2, "0")}:${value.getMinutes().toString().padStart(2, "0")}`
    : "";

  return (
    <FormField
      label={label}
      className={className}
      error={field.state.meta.errors?.[0]?.message}
      required={required}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP p") : <span>{placeholder ?? "Pick date & time"}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              if (date) {
                // Preserve existing time or set to current time
                const hours = value?.getHours() ?? new Date().getHours();
                const minutes = value?.getMinutes() ?? new Date().getMinutes();
                date.setHours(hours, minutes);
              }
              field.handleChange(date);
            }}
            initialFocus
          />
          <div className="border-t p-3">
            <Label className="text-xs text-muted-foreground">Time</Label>
            <Input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="mt-1"
            />
          </div>
        </PopoverContent>
      </Popover>
    </FormField>
  );
}
