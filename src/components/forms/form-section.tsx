"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ============================================
// Form Section - Groups of related fields
// Matches the Figma design pattern
// ============================================

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, children, className }: FormSectionProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      <div className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4">
        {children}
      </div>
    </div>
  );
}

// ============================================
// Form Header
// ============================================

interface FormHeaderProps {
  title: string;
  className?: string;
}

export function FormHeader({ title, className }: FormHeaderProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

// ============================================
// Form Row - Horizontal field layout
// ============================================

interface FormRowProps {
  children: React.ReactNode;
  className?: string;
}

export function FormRow({ children, className }: FormRowProps) {
  return (
    <div className={cn("flex gap-4", className)}>
      {children}
    </div>
  );
}
