"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Check } from "lucide-react";
import type { Quiz } from "@slideshow/shared";

export interface ShortAnswerProps {
  quiz: Quiz;
  onSubmit: (answer: string) => void;
  disabled: boolean;
}

const MAX_LENGTH = 500;

export default function ShortAnswer({
  quiz,
  onSubmit,
  disabled,
}: ShortAnswerProps) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const charCount = value.length;
  const charPercent = (charCount / MAX_LENGTH) * 100;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || submitted || disabled) return;
      setSubmitted(true);
      onSubmit(trimmed);
    },
    [value, submitted, disabled, onSubmit]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-lg flex-col gap-4 p-4"
    >
      <h2 className="text-xl font-bold text-gray-900 text-center">
        {quiz.question}
      </h2>

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={MAX_LENGTH}
          rows={4}
          placeholder="Type your answer here..."
          disabled={submitted || disabled}
          className={`w-full resize-none rounded-xl border p-4 text-sm transition-all focus:outline-none focus:ring-2 ${
            submitted
              ? "border-green-300 bg-green-50 text-green-800 cursor-not-allowed"
              : disabled
              ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
              : "border-gray-300 bg-white text-gray-800 focus:border-blue-400 focus:ring-blue-200"
          }`}
        />

        {/* Character count bar */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  charPercent > 90
                    ? "bg-red-500"
                    : charPercent > 70
                    ? "bg-yellow-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${charPercent}%` }}
              />
            </div>
            <span
              className={`text-xs tabular-nums ${
                charPercent > 90
                  ? "text-red-500 font-medium"
                  : "text-gray-400"
              }`}
            >
              {charCount}/{MAX_LENGTH}
            </span>
          </div>

          {!submitted && !disabled && (
            <button
              type="submit"
              disabled={!value.trim()}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
              Submit
            </button>
          )}
        </div>
      </div>

      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 rounded-lg bg-green-50 py-3 text-sm font-medium text-green-600"
        >
          <Check className="h-4 w-4" />
          Answer submitted successfully!
        </motion.div>
      )}
    </form>
  );
}
