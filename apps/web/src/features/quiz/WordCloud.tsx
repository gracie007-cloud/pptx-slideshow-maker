"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import type { Quiz } from "@slideshow/shared";
import type { WordCloudItem } from "@slideshow/shared";

export interface WordCloudProps {
  quiz: Quiz;
  onSubmit: (word: string) => void;
  words: WordCloudItem[];
  disabled?: boolean;
}

function generateCloudPositions(
  count: number
): { x: number; y: number; rotate: number }[] {
  const positions: { x: number; y: number; rotate: number }[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const radius = Math.sqrt(i / count) * 40;
    const angle = i * goldenAngle;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const rotate = (Math.random() - 0.5) * 20;
    positions.push({ x, y, rotate });
  }
  return positions;
}

const WORD_COLORS = [
  "text-blue-600",
  "text-purple-600",
  "text-green-600",
  "text-red-600",
  "text-orange-600",
  "text-teal-600",
  "text-pink-600",
  "text-indigo-600",
  "text-cyan-600",
  "text-emerald-600",
];

export default function WordCloud({
  quiz,
  onSubmit,
  words,
  disabled = false,
}: WordCloudProps) {
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const maxValue = useMemo(
    () => Math.max(...words.map((w) => w.value), 1),
    [words]
  );

  const positions = useMemo(
    () => generateCloudPositions(words.length),
    [words.length]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed || submitted || disabled) return;
      onSubmit(trimmed);
      setInputValue("");
      setSubmitted(true);
    },
    [inputValue, submitted, disabled, onSubmit]
  );

  const getFontSize = (value: number): number => {
    const minSize = 0.875;
    const maxSize = 3.5;
    const normalized = value / maxValue;
    return minSize + normalized * (maxSize - minSize);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <h2 className="text-xl font-bold text-gray-900 text-center">
        {quiz.question}
      </h2>

      {/* Input form */}
      {!submitted && !disabled && (
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-md gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter a word or phrase..."
            maxLength={50}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
            Submit
          </button>
        </form>
      )}

      {submitted && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-green-600 font-medium"
        >
          Word submitted! Watch it appear in the cloud.
        </motion.p>
      )}

      {/* Word cloud display */}
      <div className="relative flex min-h-[300px] w-full max-w-2xl items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white p-8 overflow-hidden">
        <AnimatePresence>
          {words.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-gray-400"
            >
              Waiting for responses...
            </motion.p>
          ) : (
            <div className="relative flex flex-wrap items-center justify-center gap-2">
              {words.map((word, index) => {
                const pos = positions[index] ?? { x: 0, y: 0, rotate: 0 };
                const fontSize = getFontSize(word.value);
                const colorClass =
                  WORD_COLORS[index % WORD_COLORS.length];

                return (
                  <motion.span
                    key={word.text}
                    initial={{
                      opacity: 0,
                      scale: 0,
                      rotate: pos.rotate - 10,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      rotate: pos.rotate,
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                      delay: index * 0.05,
                    }}
                    className={`inline-block font-bold cursor-default select-none transition-transform hover:scale-110 ${colorClass}`}
                    style={{
                      fontSize: `${fontSize}rem`,
                      transform: `translate(${pos.x}%, ${pos.y}%)`,
                    }}
                    title={`${word.text}: ${word.value}`}
                  >
                    {word.text}
                  </motion.span>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {words.length > 0 && (
        <p className="text-xs text-gray-400">
          {words.length} unique word{words.length !== 1 ? "s" : ""} submitted
        </p>
      )}
    </div>
  );
}
