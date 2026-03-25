"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface SlideOverlayProps {
  children: React.ReactNode;
  active: boolean;
  interactive?: boolean;
}

export default function SlideOverlay({ children, active, interactive = true }: SlideOverlayProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`absolute inset-0 z-10 ${interactive ? "pointer-events-auto" : "pointer-events-none"}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
