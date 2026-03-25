import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  JOIN_CODE_LENGTH,
  JOIN_CODE_CHARS,
  LEVEL_THRESHOLDS,
} from "@slideshow/shared";

/**
 * Merge Tailwind CSS class names with proper conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Generate a random session join code using unambiguous characters.
 */
export function generateJoinCode(): string {
  let code = "";
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
    const index = Math.floor(Math.random() * JOIN_CODE_CHARS.length);
    code += JOIN_CODE_CHARS[index];
  }
  return code;
}

/**
 * Format seconds into a human-readable time string (MM:SS or HH:MM:SS).
 */
export function formatTime(seconds: number): string {
  const absSeconds = Math.abs(Math.floor(seconds));
  const h = Math.floor(absSeconds / 3600);
  const m = Math.floor((absSeconds % 3600) / 60);
  const s = absSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
}

/**
 * Calculate gamification level from total stars using level thresholds.
 */
export function calculateLevel(stars: number): number {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (stars >= LEVEL_THRESHOLDS[i]) {
      level = i;
      break;
    }
  }
  return level;
}

/**
 * Stars needed to reach the next level.
 */
export function starsToNextLevel(stars: number): number {
  const currentLevel = calculateLevel(stars);
  const nextLevel = currentLevel + 1;
  if (nextLevel >= LEVEL_THRESHOLDS.length) {
    return 0; // Max level reached
  }
  return LEVEL_THRESHOLDS[nextLevel] - stars;
}
