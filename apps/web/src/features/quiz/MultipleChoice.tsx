"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import type { Quiz, QuizOption } from "@slideshow/shared";

export interface MultipleChoiceProps {
  quiz: Quiz;
  onSubmit: (answer: string) => void;
  disabled: boolean;
  showResults: boolean;
  answerDistribution?: Record<string, number>;
  timeRemaining?: number;
  totalTime?: number;
}

const OPTION_COLORS = [
  { bg: "bg-red-500", hover: "hover:bg-red-600", light: "bg-red-100", text: "text-red-700", bar: "bg-red-400" },
  { bg: "bg-blue-500", hover: "hover:bg-blue-600", light: "bg-blue-100", text: "text-blue-700", bar: "bg-blue-400" },
  { bg: "bg-yellow-500", hover: "hover:bg-yellow-600", light: "bg-yellow-100", text: "text-yellow-700", bar: "bg-yellow-400" },
  { bg: "bg-green-500", hover: "hover:bg-green-600", light: "bg-green-100", text: "text-green-700", bar: "bg-green-400" },
  { bg: "bg-purple-500", hover: "hover:bg-purple-600", light: "bg-purple-100", text: "text-purple-700", bar: "bg-purple-400" },
  { bg: "bg-pink-500", hover: "hover:bg-pink-600", light: "bg-pink-100", text: "text-pink-700", bar: "bg-pink-400" },
];

export default function MultipleChoice({
  quiz,
  onSubmit,
  disabled,
  showResults,
  answerDistribution,
  timeRemaining,
  totalTime,
}: MultipleChoiceProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const options: QuizOption[] = quiz.options ?? [];
  const timerPercent =
    totalTime && timeRemaining !== undefined
      ? (timeRemaining / totalTime) * 100
      : 100;

  const totalResponses = useMemo(() => {
    if (!answerDistribution) return 0;
    return Object.values(answerDistribution).reduce((a, b) => a + b, 0);
  }, [answerDistribution]);

  const maxCount = useMemo(() => {
    if (!answerDistribution) return 1;
    return Math.max(...Object.values(answerDistribution), 1);
  }, [answerDistribution]);

  const handleSelect = (optionText: string) => {
    if (submitted || disabled) return;
    setSelectedOption(optionText);
    setSubmitted(true);
    onSubmit(optionText);
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      {/* Timer bar */}
      {timeRemaining !== undefined && (
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full ${
              timerPercent > 25 ? "bg-blue-500" : timerPercent > 10 ? "bg-orange-500" : "bg-red-500"
            }`}
            initial={false}
            animate={{ width: `${timerPercent}%` }}
            transition={{ duration: 0.5, ease: "linear" }}
          />
        </div>
      )}

      {/* Question */}
      <h2 className="text-xl font-bold text-gray-900 text-center">
        {quiz.question}
      </h2>

      {/* Options or Results */}
      <AnimatePresence mode="wait">
        {showResults && answerDistribution ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-3"
          >
            <p className="text-center text-sm text-gray-500">
              {totalResponses} response{totalResponses !== 1 ? "s" : ""}
            </p>
            {options.map((option, index) => {
              const count = answerDistribution[option.text] ?? 0;
              const percent =
                totalResponses > 0
                  ? Math.round((count / totalResponses) * 100)
                  : 0;
              const barWidth =
                maxCount > 0 ? (count / maxCount) * 100 : 0;
              const isCorrect = option.isCorrect;
              const color = OPTION_COLORS[index % OPTION_COLORS.length];

              return (
                <div key={index} className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white ${
                      isCorrect ? "bg-green-500" : "bg-gray-400"
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-sm font-medium ${
                          isCorrect
                            ? "text-green-700"
                            : "text-gray-700"
                        }`}
                      >
                        {option.text}
                        {isCorrect && (
                          <Check className="ml-1 inline h-4 w-4 text-green-500" />
                        )}
                      </span>
                      <span className="text-xs text-gray-500">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="h-6 w-full overflow-hidden rounded bg-gray-100">
                      <motion.div
                        className={`h-full rounded ${
                          isCorrect ? "bg-green-400" : color.bar
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{
                          duration: 0.8,
                          ease: "easeOut",
                          delay: index * 0.1,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="options"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {options.map((option, index) => {
              const color = OPTION_COLORS[index % OPTION_COLORS.length];
              const isSelected = selectedOption === option.text;

              return (
                <motion.button
                  key={index}
                  onClick={() => handleSelect(option.text)}
                  disabled={submitted || disabled}
                  whileHover={
                    !submitted && !disabled ? { scale: 1.02 } : undefined
                  }
                  whileTap={
                    !submitted && !disabled ? { scale: 0.98 } : undefined
                  }
                  className={`relative flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : submitted || disabled
                      ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                      : `border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm cursor-pointer`
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white ${color.bg}`}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {option.text}
                  </span>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-3"
                    >
                      <Check className="h-5 w-5 text-blue-500" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {submitted && !showResults && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-green-600 font-medium"
        >
          Answer submitted! Waiting for results...
        </motion.p>
      )}
    </div>
  );
}
