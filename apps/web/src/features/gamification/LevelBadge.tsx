"use client";

import React from "react";
import { LEVEL_THRESHOLDS } from "@slideshow/shared";

export interface LevelBadgeProps {
  level: number;
  stars: number;
  showProgress?: boolean;
}

export default function LevelBadge({ level, stars, showProgress = false }: LevelBadgeProps) {
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const currentThreshold = LEVEL_THRESHOLDS[level] ?? 0;
  const progress = nextThreshold > currentThreshold
    ? Math.min(((stars - currentThreshold) / (nextThreshold - currentThreshold)) * 100, 100)
    : 100;

  return (
    <div className="inline-flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[11px] font-bold text-white shadow-sm">
        {level}
      </span>

      {showProgress && (
        <div className="flex flex-col gap-0.5">
          <div className="h-1.5 w-16 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[9px] text-gray-400">
            {stars}/{nextThreshold}
          </span>
        </div>
      )}
    </div>
  );
}
