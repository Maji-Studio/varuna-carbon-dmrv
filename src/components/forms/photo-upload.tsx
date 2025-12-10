"use client";

import * as React from "react";
import { CameraIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================
// Photo Upload Field
// ============================================

interface PhotoUploadProps {
  value?: File[];
  onChange?: (files: File[]) => void;
  label?: string;
  accept?: string;
  multiple?: boolean;
  className?: string;
}

export function PhotoUpload({
  value = [],
  onChange,
  label = "Add photo",
  accept = "image/*,video/*",
  multiple = true,
  className,
}: PhotoUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = React.useState<string[]>([]);

  React.useEffect(() => {
    // Create preview URLs
    const urls = value.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    // Cleanup
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [value]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      onChange?.(multiple ? [...value, ...files] : files);
    }
    // Reset input to allow selecting the same file again
    e.target.value = "";
  };

  const handleRemove = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange?.(newFiles);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((preview, index) => (
            <div
              key={preview}
              className="relative h-16 w-16 overflow-hidden rounded-md border"
            >
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute right-0.5 top-0.5 rounded-full bg-background/80 p-0.5 hover:bg-background"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleClick}
      >
        <CameraIcon className="mr-2 h-4 w-4" />
        {label}
      </Button>

      {/* Hidden Input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
