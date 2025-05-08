"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePreviewProps {
  file: File | null;
  url: string | null;
  onClear: () => void;
  className?: string;
}

export function ImagePreview({
  file,
  url,
  onClear,
  className = "",
}: ImagePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Free memory when component unmounts
      return () => URL.revokeObjectURL(objectUrl);
    } else if (url) {
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file, url]);

  if (!previewUrl) return null;

  return (
    <div className={`relative rounded-md overflow-hidden ${className}`}>
      <div className="aspect-square relative">
        {/* Use a regular img tag as fallback if there's an issue with next/image */}
        {previewUrl.includes(".public.blob.vercel-storage.com") ? (
          <img
            src={previewUrl || "/placeholder.svg"}
            alt="Preview"
            className="object-cover w-full h-full"
          />
        ) : (
          <Image
            src={previewUrl || "/placeholder.svg"}
            alt="Preview"
            fill
            className="object-cover"
          />
        )}
      </div>
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 rounded-full"
        onClick={onClear}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
