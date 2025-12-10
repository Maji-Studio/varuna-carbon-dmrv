"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface FormPageLayoutProps {
  title: string;
  children: React.ReactNode;
  onSubmit?: () => void;
  onDelete?: () => void | Promise<void>;
  isSubmitting?: boolean;
  isDeleting?: boolean;
  /** Whether editing an existing draft */
  hasDraft?: boolean;
  /** Whether all required fields are filled */
  isComplete?: boolean;
  cancelLabel?: string;
  className?: string;
}

export function FormPageLayout({
  title,
  children,
  onSubmit,
  onDelete,
  isSubmitting = false,
  isDeleting = false,
  hasDraft = false,
  isComplete = false,
  cancelLabel = "Cancel",
  className,
}: FormPageLayoutProps) {
  const router = useRouter();

  const getSubmitLabel = () => {
    if (isComplete) return "Finish Data Entry";
    if (hasDraft) return "Update";
    return "Save Draft";
  };

  const getSubmittingLabel = () => {
    if (isComplete) return "Finishing...";
    if (hasDraft) return "Updating...";
    return "Saving...";
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className={cn("mx-auto flex min-h-screen max-w-2xl flex-col bg-white", className)}>
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
            {/* Form Title with Delete Button */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      disabled={isDeleting}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      aria-label="Delete"
                    >
                      <Trash2 className="size-5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete
                        this entry from the database.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
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
              disabled={isSubmitting || isDeleting}
            >
              {isSubmitting ? getSubmittingLabel() : getSubmitLabel()}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={isSubmitting || isDeleting}
            >
              {cancelLabel}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
