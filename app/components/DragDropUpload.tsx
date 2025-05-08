"use client";

import type React from "react";
import { useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Plus, X } from "lucide-react";

interface DragDropUploadProps {
  onFileSelected?: (file: File) => void; // Keep the existing one for single file uploads
  currentImageUrl?: string;
  onClearCurrentImage?: () => void;
  multiple?: boolean;
  onAdditionalImagesSelected?: (files: File[]) => void; // Rename this for clarity
  additionalImages?: string[];
  onClearAdditionalImage?: (index: number) => void;
  onAdditionalFilesSelected?: (files: File[]) => void; // New prop for local preview
}

const ImagePreview: React.FC<{
  file: File | null;
  url: string | null;
  onClear: () => void;
  className?: string;
}> = ({ file, url, onClear, className }) => {
  const imageUrl = url || (file ? URL.createObjectURL(file) : null);

  return (
    <div className={`relative ${className}`}>
      {imageUrl && (
        <img
          src={imageUrl || "/placeholder.svg"}
          alt="Preview"
          className="object-cover w-full h-full rounded-lg"
        />
      )}
      <button
        onClick={onClear}
        className="absolute top-2 right-2 bg-neutral-800 rounded-full p-1 text-white hover:bg-neutral-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const DragDropUpload: React.FC<DragDropUploadProps> = ({
  onFileSelected,
  currentImageUrl,
  onClearCurrentImage,
  multiple = false,
  onAdditionalImagesSelected, // Renamed
  additionalImages = [],
  onClearAdditionalImage,
  onAdditionalFilesSelected, // New prop
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = (acceptedFiles: File[]) => {
    if (!multiple) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      onFileSelected && onFileSelected(file);
    } else {
      onAdditionalImagesSelected && onAdditionalImagesSelected(acceptedFiles);
      onAdditionalFilesSelected && onAdditionalFilesSelected(acceptedFiles); // Call the new prop
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    multiple,
  });

  const handleClear = () => {
    setSelectedFile(null);
    onClearCurrentImage && onClearCurrentImage();
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files && files.length > 0) {
      if (!multiple) {
        const file = files[0];
        setSelectedFile(file);
        onFileSelected(file);
      } else {
        const fileArray = Array.from(files);
        onAdditionalImagesSelected && onAdditionalImagesSelected(fileArray);
      }
    }
  };

  const showPreview =
    (selectedFile || currentImageUrl) &&
    (!multiple || additionalImages.length > 0);

  return (
    <div>
      {!showPreview && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-neutral-400 hover:border-neutral-500"
          }`}
        >
          <input
            {...getInputProps()}
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
          <p className="text-neutral-500">
            {isDragActive
              ? "Drop the files here ..."
              : "Drag and drop files here, or click to select files"}
          </p>
        </div>
      )}

      {showPreview && (
        <div>
          <ImagePreview
            file={selectedFile}
            url={currentImageUrl}
            onClear={handleClear}
            className="w-full h-64"
          />
        </div>
      )}

      {multiple && (
        <div className="mt-4">
          <div className="grid grid-cols-3 gap-2">
            {additionalImages.map((url, index) => (
              <div key={index} className="relative aspect-square">
                <ImagePreview
                  file={null}
                  url={url}
                  onClear={() =>
                    onClearAdditionalImage && onClearAdditionalImage(index)
                  }
                  className="w-full h-full"
                />
              </div>
            ))}

            {/* Upload more button - always show this when multiple is true */}
            <div
              className="border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-neutral-500 aspect-square"
              onClick={handleButtonClick}
            >
              <Plus className="h-8 w-8 text-neutral-400" />
            </div>
          </div>
          {additionalImages.length > 6 && (
            <p className="text-sm text-neutral-400 mt-2">
              +{additionalImages.length - 6} more images
            </p>
          )}
        </div>
      )}
      <input
        type="file"
        style={{ display: "none" }}
        multiple={multiple}
        ref={fileInputRef}
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default DragDropUpload;
