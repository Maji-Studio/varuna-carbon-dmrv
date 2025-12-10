"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FormPageLayoutProps {
  title: string;
  children: React.ReactNode;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
}

export function FormPageLayout({
  title,
  children,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  className,
}: FormPageLayoutProps) {
  const router = useRouter();

  const handleCancel = () => {
    router.back();
  };

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col bg-white",
        className
      )}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-end border-b bg-white px-4 py-4">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-lg p-1 hover:bg-stone-100 transition-colors"
          aria-label="Close"
        >
          <X className="size-4 text-stone-600" />
        </button>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="flex flex-col gap-8">
          {/* Form Title */}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 border-t bg-white px-4 py-4">
        <div className="flex gap-2">
          <Button
            type="button"
            className="flex-1"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
        </div>
      </footer>
    </div>
  );
}
