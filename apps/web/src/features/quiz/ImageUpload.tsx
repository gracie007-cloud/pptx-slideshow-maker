"use client";

import React, { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, X, Check, ImageIcon } from "lucide-react";
import type { Quiz } from "@slideshow/shared";
import { MAX_IMAGE_UPLOAD_SIZE } from "@slideshow/shared";

export interface ImageUploadProps {
  quiz: Quiz;
  onSubmit: (dataUrl: string) => void;
}

export default function ImageUpload({ quiz, onSubmit }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);

  const maxSize = MAX_IMAGE_UPLOAD_SIZE;

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, GIF, etc.).");
      return;
    }

    if (file.size > maxSize) {
      setError(
        `File too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(0)} MB.`
      );
      return;
    }

    setError(null);
    setFileName(file.name);
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);
  }, [maxSize]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleRemove = useCallback(() => {
    setPreview(null);
    setFileName(null);
    setFileSize(0);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleSubmit = useCallback(() => {
    if (!preview || submitted) return;
    setSubmitted(true);
    onSubmit(preview);
  }, [preview, submitted, onSubmit]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 p-4">
      <h2 className="text-xl font-bold text-gray-900 text-center">
        {quiz.question}
      </h2>

      {!preview ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex h-56 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-50 scale-[1.02]"
              : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          <div
            className={`rounded-full p-4 ${
              isDragging ? "bg-blue-100" : "bg-gray-100"
            }`}
          >
            <Upload
              className={`h-8 w-8 ${
                isDragging ? "text-blue-500" : "text-gray-400"
              }`}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">
              {isDragging
                ? "Drop your image here"
                : "Drag and drop an image, or click to browse"}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Max size: {(maxSize / 1024 / 1024).toFixed(0)} MB
            </p>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full"
        >
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-video bg-gray-100">
              <img
                src={preview}
                alt="Preview"
                className="h-full w-full object-contain"
              />
              {!submitted && (
                <button
                  onClick={handleRemove}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {fileName && (
              <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-2">
                <ImageIcon className="h-4 w-4 text-gray-400" />
                <span className="flex-1 truncate text-xs text-gray-500">
                  {fileName}
                </span>
                <span className="text-xs text-gray-400">
                  {formatFileSize(fileSize)}
                </span>
              </div>
            )}
          </div>

          {!submitted && (
            <button
              onClick={handleSubmit}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Submit Image
            </button>
          )}
        </motion.div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-red-500"
        >
          {error}
        </motion.p>
      )}

      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm font-medium text-green-600"
        >
          <Check className="h-4 w-4" />
          Image submitted!
        </motion.div>
      )}
    </div>
  );
}
