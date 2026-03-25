"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Send, Check } from "lucide-react";
import type { Quiz } from "@slideshow/shared";

export interface FillInBlankProps {
  quiz: Quiz;
  onSubmit: (answer: string) => void;
  disabled: boolean;
}

export default function FillInBlank({
  quiz,
  onSubmit,
  disabled,
}: FillInBlankProps) {
  const parts = useMemo(
    () => quiz.question.split(/____+/),
    [quiz.question]
  );
  const blankCount = parts.length - 1;

  const [answers, setAnswers] = useState<string[]>(
    Array(Math.max(blankCount, 1)).fill("")
  );
  const [submitted, setSubmitted] = useState(false);

  const handleChange = useCallback((index: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (submitted || disabled) return;
      const filledAnswers = answers.map((a) => a.trim());
      if (filledAnswers.some((a) => !a)) return;
      setSubmitted(true);
      onSubmit(filledAnswers.join("|"));
    },
    [answers, submitted, disabled, onSubmit]
  );

  const allFilled = answers.every((a) => a.trim().length > 0);

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-2xl flex-col gap-6 p-4"
    >
      <h2 className="text-lg font-bold text-gray-900 text-center">
        Fill in the blank{blankCount > 1 ? "s" : ""}
      </h2>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-lg leading-relaxed text-gray-800">
          {parts.map((part, i) => (
            <React.Fragment key={i}>
              <span>{part}</span>
              {i < blankCount && (
                <span className="inline-block align-bottom mx-1">
                  <input
                    type="text"
                    value={answers[i]}
                    onChange={(e) => handleChange(i, e.target.value)}
                    disabled={submitted || disabled}
                    placeholder={`blank ${i + 1}`}
                    className={`inline-block w-40 border-b-2 bg-transparent px-2 py-1 text-center font-medium transition-colors focus:outline-none ${
                      submitted
                        ? "border-green-400 text-green-700 cursor-not-allowed"
                        : disabled
                        ? "border-gray-200 text-gray-400 cursor-not-allowed"
                        : answers[i].trim()
                        ? "border-blue-500 text-blue-700"
                        : "border-gray-300 text-gray-700 focus:border-blue-500"
                    }`}
                  />
                </span>
              )}
            </React.Fragment>
          ))}
        </p>
      </div>

      {blankCount > 1 && (
        <div className="flex items-center gap-2 justify-center">
          {answers.map((answer, i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full transition-colors ${
                answer.trim()
                  ? "bg-blue-500"
                  : "bg-gray-200"
              }`}
            />
          ))}
          <span className="text-xs text-gray-400 ml-1">
            {answers.filter((a) => a.trim()).length}/{blankCount} filled
          </span>
        </div>
      )}

      {!submitted && !disabled && (
        <button
          type="submit"
          disabled={!allFilled}
          className="mx-auto flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="h-4 w-4" />
          Submit Answer
        </button>
      )}

      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 rounded-lg bg-green-50 py-3 text-sm font-medium text-green-600"
        >
          <Check className="h-4 w-4" />
          Answer submitted!
        </motion.div>
      )}
    </form>
  );
}
