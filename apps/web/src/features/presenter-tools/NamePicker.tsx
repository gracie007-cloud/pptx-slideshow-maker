"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, User, RotateCw } from "lucide-react";

export interface NamePickerProps {
  participants: string[];
  onSpin: () => void;
  selectedName?: string | null;
}

export default function NamePicker({
  participants,
  onSpin,
  selectedName: externalSelectedName,
}: NamePickerProps) {
  const [spinning, setSpinning] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (externalSelectedName) {
      setSelectedName(externalSelectedName);
      setDisplayName(externalSelectedName);
    }
  }, [externalSelectedName]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSpin = useCallback(() => {
    if (participants.length === 0 || spinning) return;

    setSpinning(true);
    setSelectedName(null);
    onSpin();

    let speed = 50;
    let iteration = 0;
    const totalIterations = 20 + Math.floor(Math.random() * 10);
    const targetIndex = Math.floor(Math.random() * participants.length);

    const animate = () => {
      intervalRef.current = setInterval(() => {
        iteration++;
        const nameIndex = iteration % participants.length;
        setDisplayName(participants[nameIndex]);

        if (iteration >= totalIterations) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setDisplayName(participants[targetIndex]);
          setSelectedName(participants[targetIndex]);
          setSpinning(false);
        } else {
          // Slow down gradually
          speed = Math.min(300, speed + (iteration / totalIterations) * 25);
          if (intervalRef.current) clearInterval(intervalRef.current);
          animate();
        }
      }, speed);
    };

    animate();
  }, [participants, spinning, onSpin]);

  const handleReset = useCallback(() => {
    setSelectedName(null);
    setDisplayName(null);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Spinning display */}
      <div className="relative flex h-52 w-52 items-center justify-center">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-blue-400"
          animate={
            spinning
              ? { rotate: 360, borderColor: ["#60A5FA", "#A78BFA", "#F472B6", "#60A5FA"] }
              : { rotate: 0 }
          }
          transition={
            spinning
              ? { rotate: { repeat: Infinity, duration: 1, ease: "linear" }, borderColor: { repeat: Infinity, duration: 2 } }
              : {}
          }
        />

        {/* Inner circle with gradient */}
        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 shadow-inner" />

        {/* Name display */}
        <div className="relative z-10 flex flex-col items-center gap-2 px-4 text-center">
          <AnimatePresence mode="wait">
            {displayName ? (
              <motion.div
                key={displayName}
                initial={{ opacity: 0, y: spinning ? -20 : 0, scale: spinning ? 0.8 : 1 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: spinning ? 20 : 0 }}
                transition={{ duration: spinning ? 0.05 : 0.3 }}
                className="flex flex-col items-center gap-1"
              >
                {selectedName && !spinning ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg"
                  >
                    <User className="h-6 w-6 text-white" />
                  </motion.div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <span
                  className={`text-lg font-bold max-w-[160px] truncate ${
                    selectedName && !spinning
                      ? "text-blue-700"
                      : "text-gray-600"
                  }`}
                >
                  {displayName}
                </span>
              </motion.div>
            ) : (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-400"
              >
                {participants.length} participant{participants.length !== 1 ? "s" : ""}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Decorative dots */}
        {spinning &&
          Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full bg-blue-400"
              style={{
                top: `${50 + 45 * Math.sin((i * Math.PI * 2) / 8)}%`,
                left: `${50 + 45 * Math.cos((i * Math.PI * 2) / 8)}%`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                repeat: Infinity,
                duration: 0.5,
                delay: i * 0.06,
              }}
            />
          ))}
      </div>

      {/* Selected name announcement */}
      <AnimatePresence>
        {selectedName && !spinning && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 text-center shadow-lg"
          >
            <p className="text-xs text-blue-100 mb-1">Selected:</p>
            <p className="text-xl font-bold text-white">{selectedName}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSpin}
          disabled={spinning || participants.length === 0}
          className="flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
        >
          <Shuffle className={`h-5 w-5 ${spinning ? "animate-spin" : ""}`} />
          {spinning ? "Picking..." : "Pick a Name"}
        </button>

        {selectedName && !spinning && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-xl bg-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-300 transition-colors"
          >
            <RotateCw className="h-4 w-4" />
            Reset
          </button>
        )}
      </div>

      {/* Participant list preview */}
      {participants.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1 max-w-xs">
          {participants.slice(0, 10).map((name) => (
            <span
              key={name}
              className={`rounded-full px-2 py-0.5 text-xs ${
                selectedName === name
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {name}
            </span>
          ))}
          {participants.length > 10 && (
            <span className="text-xs text-gray-400">
              +{participants.length - 10} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
