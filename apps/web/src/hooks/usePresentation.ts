"use client";

import { useEffect, useState, useCallback } from "react";
import type { Presentation, Slide } from "@slideshow/shared";

interface UsePresentationReturn {
  presentation: Presentation | null;
  slides: Slide[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches presentation data including slides by presentation ID.
 */
export function usePresentation(presentationId: string | null): UsePresentationReturn {
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPresentation = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/presentations/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch presentation: ${response.statusText}`);
      }

      const data = await response.json();
      setPresentation(data.presentation);
      setSlides(data.slides ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setPresentation(null);
      setSlides([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (presentationId) {
      fetchPresentation(presentationId);
    } else {
      setPresentation(null);
      setSlides([]);
    }
  }, [presentationId, fetchPresentation]);

  return { presentation, slides, isLoading, error };
}
