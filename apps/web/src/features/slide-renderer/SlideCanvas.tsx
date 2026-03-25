"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Slide } from "@slideshow/shared";

export interface SlideCanvasProps {
  slide: Slide | null;
  slideIndex: number;
  totalSlides: number;
  onNavigate?: (index: number) => void;
  showControls?: boolean;
  className?: string;
}

export default function SlideCanvas({
  slide,
  slideIndex,
  totalSlides,
  onNavigate,
  showControls = true,
  className = "",
}: SlideCanvasProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const hasPrev = slideIndex > 0;
  const hasNext = slideIndex < totalSlides - 1;

  return (
    <div className={`relative flex items-center justify-center w-full h-full bg-black select-none ${className}`}>
      {slide ? (
        <>
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white/80" />
            </div>
          )}
          {imageError ? (
            <div className="flex flex-col items-center gap-3 text-white/60">
              <div className="text-5xl">🖼</div>
              <p className="text-sm">Failed to load slide image</p>
              <p className="text-xs text-white/40">{slide.imagePath}</p>
            </div>
          ) : (
            <img
              src={slide.imagePath}
              alt={`Slide ${slideIndex + 1}`}
              className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              draggable={false}
            />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 text-white/50">
          <div className="text-6xl">📊</div>
          <p className="text-lg font-medium">No slide to display</p>
          <p className="text-sm text-white/30">Waiting for content...</p>
        </div>
      )}

      {showControls && onNavigate && (
        <>
          <button
            disabled={!hasPrev}
            onClick={() => onNavigate(slideIndex - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm transition-all hover:bg-black/60 disabled:opacity-0 disabled:pointer-events-none"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            disabled={!hasNext}
            onClick={() => onNavigate(slideIndex + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm transition-all hover:bg-black/60 disabled:opacity-0 disabled:pointer-events-none"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/50 px-4 py-1.5 text-sm text-white backdrop-blur-sm">
            <span className="font-medium">{slideIndex + 1}</span>
            <span className="text-white/50">/</span>
            <span className="text-white/70">{totalSlides}</span>
          </div>
        </>
      )}
    </div>
  );
}
