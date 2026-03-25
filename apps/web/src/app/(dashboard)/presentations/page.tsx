"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Plus,
  Presentation,
  Loader2,
  FileUp,
  Trash2,
  MoreHorizontal,
  Search,
  X,
  AlertCircle,
} from "lucide-react";
import type { PresentationListItem, UploadProgress } from "@/types";

export default function PresentationsPage() {
  const [presentations, setPresentations] = useState<PresentationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [upload, setUpload] = useState<UploadProgress | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const fetchPresentations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/presentations");
      if (!res.ok) throw new Error("Failed to fetch presentations");
      const data = await res.json();
      setPresentations(data.presentations || data || []);
    } catch {
      setError("Failed to load presentations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPresentations();
  }, [fetchPresentations]);

  const handleUpload = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      if (!file.name.endsWith(".pptx")) {
        setError("Please upload a .pptx file.");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setError("File size exceeds 50MB limit.");
        return;
      }

      setError("");
      setUpload({
        fileName: file.name,
        progress: 0,
        status: "uploading",
      });

      try {
        const formData = new FormData();
        formData.append("file", file);

        setUpload((prev) => prev && { ...prev, progress: 30, status: "uploading" });

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Upload failed");
        }

        setUpload((prev) => prev && { ...prev, progress: 80, status: "processing" });

        await new Promise((resolve) => setTimeout(resolve, 500));

        setUpload((prev) => prev && { ...prev, progress: 100, status: "complete" });

        setTimeout(() => {
          setUpload(null);
          fetchPresentations();
        }, 1500);
      } catch (err) {
        setUpload((prev) =>
          prev && {
            ...prev,
            status: "error",
            error: err instanceof Error ? err.message : "Upload failed",
          }
        );
      }
    },
    [fetchPresentations]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleUpload,
    accept: {
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    },
    maxFiles: 1,
    noClick: false,
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this presentation?")) return;
    try {
      await fetch(`/api/presentations/${id}`, { method: "DELETE" });
      setPresentations((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Failed to delete presentation.");
    }
    setMenuOpen(null);
  };

  const filtered = presentations.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presentations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload and manage your PPTX presentations
          </p>
        </div>
        <button
          onClick={open}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Upload PPTX
        </button>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")}>
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          isDragActive
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-200 bg-gray-50/50 hover:border-indigo-300 hover:bg-indigo-50/50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          {upload ? (
            <div className="w-full max-w-xs">
              <div className="flex items-center gap-3">
                <FileUp className="h-8 w-8 text-indigo-500" />
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {upload.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {upload.status === "uploading" && "Uploading..."}
                    {upload.status === "processing" && "Processing slides..."}
                    {upload.status === "complete" && "Upload complete!"}
                    {upload.status === "error" && (upload.error || "Upload failed")}
                  </p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                <motion.div
                  className={`h-full rounded-full ${
                    upload.status === "error" ? "bg-red-500" : "bg-indigo-500"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${upload.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-600">
                {isDragActive
                  ? "Drop your file here..."
                  : "Drag and drop your .pptx file here, or click to browse"}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Supports .pptx files up to 50MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      {presentations.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search presentations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      )}

      {/* Empty state */}
      {!loading && presentations.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Presentation className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-base font-semibold text-gray-900">
            No presentations yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload your first .pptx file to get started
          </p>
          <button
            onClick={open}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Upload className="h-4 w-4" />
            Upload PPTX
          </button>
        </div>
      )}

      {/* Presentations grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence>
            {filtered.map((pres) => (
              <motion.div
                key={pres.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <Link href={`/presentations/${pres.id}`} className="block p-4">
                  {/* Thumbnail */}
                  <div className="flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
                    {pres.thumbnailUrl ? (
                      <img
                        src={pres.thumbnailUrl}
                        alt={pres.title}
                        className="h-full w-full rounded-lg object-cover"
                      />
                    ) : (
                      <Presentation className="h-10 w-10 text-gray-300" />
                    )}
                  </div>
                  <h3 className="mt-3 truncate text-sm font-semibold text-gray-900 group-hover:text-indigo-600">
                    {pres.title}
                  </h3>
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                    <span>{pres.slideCount} slides</span>
                    <span>
                      {new Date(pres.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </Link>

                {/* Actions menu */}
                <div className="absolute right-2 top-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setMenuOpen(menuOpen === pres.id ? null : pres.id);
                    }}
                    className="rounded-lg bg-white/80 p-1.5 text-gray-400 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:text-gray-600"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {menuOpen === pres.id && (
                    <div className="absolute right-0 top-8 z-10 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      <button
                        onClick={() => handleDelete(pres.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* No search results */}
      {!loading && presentations.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <Search className="h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">
            No presentations matching &quot;{searchQuery}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
