"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export type TransitionType = "fade" | "slide" | "zoom" | "none";
export type TransitionDirection = "left" | "right";

export interface TransitionEngineProps {
  children: React.ReactNode;
  slideKey: string | number;
  transitionType?: TransitionType;
  direction?: TransitionDirection;
  duration?: number;
}

const variants = {
  fade: {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    enter: (dir: TransitionDirection) => ({
      x: dir === "right" ? "100%" : "-100%",
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: TransitionDirection) => ({
      x: dir === "right" ? "-100%" : "100%",
      opacity: 0,
    }),
  },
  zoom: {
    enter: { scale: 0.8, opacity: 0 },
    center: { scale: 1, opacity: 1 },
    exit: { scale: 1.2, opacity: 0 },
  },
  none: {
    enter: {},
    center: {},
    exit: {},
  },
};

export default function TransitionEngine({
  children,
  slideKey,
  transitionType = "fade",
  direction = "right",
  duration = 0.4,
}: TransitionEngineProps) {
  const variant = variants[transitionType];

  return (
    <div className="relative w-full h-full overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={slideKey}
          custom={direction}
          initial={typeof variant.enter === "function" ? variant.enter(direction) : variant.enter}
          animate={variant.center}
          exit={typeof variant.exit === "function" ? variant.exit(direction) : variant.exit}
          transition={{ duration, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
