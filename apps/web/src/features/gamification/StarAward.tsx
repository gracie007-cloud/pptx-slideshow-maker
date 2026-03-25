"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";

export interface StarAwardProps {
  count: number;
  participantName: string;
  animated?: boolean;
  onComplete?: () => void;
}

export default function StarAward({
  count,
  participantName,
  animated = true,
  onComplete,
}: StarAwardProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (animated && onComplete) {
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [animated, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={animated ? { scale: 0, opacity: 0 } : undefined}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex flex-col items-center gap-2 p-4"
        >
          <div className="flex gap-1">
            {Array.from({ length: count }).map((_, i) => (
              <motion.div
                key={i}
                initial={animated ? { scale: 0, rotate: -180 } : undefined}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 400 }}
              >
                <Star className="h-10 w-10 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
              </motion.div>
            ))}
          </div>
          <motion.p
            initial={animated ? { y: 10, opacity: 0 } : undefined}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: count * 0.15 + 0.2 }}
            className="text-sm font-semibold text-gray-700"
          >
            {participantName}
          </motion.p>
          <motion.p
            initial={animated ? { y: 5, opacity: 0 } : undefined}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: count * 0.15 + 0.3 }}
            className="text-xs text-gray-500"
          >
            +{count} Star{count !== 1 ? "s" : ""}!
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
