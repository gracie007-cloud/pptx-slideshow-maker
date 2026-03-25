"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Cloud, MessageSquare, Check } from "lucide-react";
import type { QuizType } from "@slideshow/shared";
import type { QuizResultData, WordCloudItem } from "@slideshow/shared";

export interface ResponseVisualizerProps {
  results: QuizResultData;
  quizType: QuizType;
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
];

const BAR_COLORS = [
  "bg-red-400",
  "bg-blue-400",
  "bg-yellow-400",
  "bg-green-400",
  "bg-purple-400",
  "bg-pink-400",
];

export default function ResponseVisualizer({
  results,
  quizType,
}: ResponseVisualizerProps) {
  const { answerDistribution, totalResponses, correctAnswer, wordCloudData } =
    results;

  const sortedEntries = useMemo(() => {
    return Object.entries(answerDistribution).sort(
      ([, a], [, b]) => b - a
    );
  }, [answerDistribution]);

  const maxCount = useMemo(
    () => Math.max(...Object.values(answerDistribution), 1),
    [answerDistribution]
  );

  const renderMultipleChoice = () => (
    <div className="flex flex-col gap-3">
      {sortedEntries.map(([label, count], index) => {
        const percent =
          totalResponses > 0
            ? Math.round((count / totalResponses) * 100)
            : 0;
        const barWidth = (count / maxCount) * 100;
        const isCorrect = correctAnswer === label;

        return (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="w-32 flex items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold text-white ${
                  isCorrect ? "bg-green-500" : "bg-gray-400"
                }`}
              >
                {String.fromCharCode(65 + index)}
              </span>
              <span
                className={`text-sm truncate ${
                  isCorrect
                    ? "font-medium text-green-700"
                    : "text-gray-600"
                }`}
              >
                {label}
              </span>
              {isCorrect && <Check className="h-4 w-4 shrink-0 text-green-500" />}
            </div>
            <div className="flex-1 h-8 overflow-hidden rounded-lg bg-gray-100">
              <motion.div
                className={`h-full rounded-lg flex items-center justify-end pr-2 ${
                  isCorrect
                    ? "bg-green-400"
                    : BAR_COLORS[index % BAR_COLORS.length]
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                  delay: index * 0.1,
                }}
              >
                {barWidth > 15 && (
                  <span className="text-xs font-medium text-white">
                    {count}
                  </span>
                )}
              </motion.div>
            </div>
            <span className="w-12 text-right text-sm font-medium text-gray-600">
              {percent}%
            </span>
          </motion.div>
        );
      })}
    </div>
  );

  const renderWordCloud = () => {
    const words: WordCloudItem[] =
      wordCloudData ??
      sortedEntries.map(([text, value]) => ({ text, value }));
    const maxVal = Math.max(...words.map((w) => w.value), 1);

    return (
      <div className="flex min-h-[200px] flex-wrap items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6">
        <AnimatePresence>
          {words.map((word, index) => {
            const fontSize =
              0.875 + (word.value / maxVal) * 2.5;
            const colorClass = WORD_COLORS[index % WORD_COLORS.length];

            return (
              <motion.span
                key={word.text}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: index * 0.05,
                }}
                className={`inline-block font-bold select-none ${colorClass}`}
                style={{ fontSize: `${fontSize}rem` }}
              >
                {word.text}
              </motion.span>
            );
          })}
        </AnimatePresence>
        {words.length === 0 && (
          <p className="text-sm text-gray-400">No responses yet</p>
        )}
      </div>
    );
  };

  const renderShortAnswerList = () => (
    <div className="max-h-80 overflow-y-auto">
      <div className="space-y-2">
        {sortedEntries.map(([answer, count], index) => (
          <motion.div
            key={answer}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white p-3"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500">
              {count}
            </span>
            <p className="text-sm text-gray-700 leading-relaxed">{answer}</p>
          </motion.div>
        ))}
        {sortedEntries.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            No responses yet
          </p>
        )}
      </div>
    </div>
  );

  const getTypeIcon = () => {
    switch (quizType) {
      case "MULTIPLE_CHOICE":
        return <BarChart3 className="h-4 w-4" />;
      case "WORD_CLOUD":
        return <Cloud className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (quizType) {
      case "MULTIPLE_CHOICE":
        return "Answer Distribution";
      case "WORD_CLOUD":
        return "Word Cloud";
      case "SHORT_ANSWER":
        return "Responses";
      case "FILL_IN_BLANK":
        return "Answers";
      default:
        return "Submissions";
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getTypeIcon()}
          <h3 className="text-sm font-semibold text-gray-700">
            {getTypeLabel()}
          </h3>
        </div>
        <motion.span
          key={totalResponses}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
        >
          {totalResponses} response{totalResponses !== 1 ? "s" : ""}
        </motion.span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={quizType}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {quizType === "MULTIPLE_CHOICE" && renderMultipleChoice()}
          {quizType === "WORD_CLOUD" && renderWordCloud()}
          {(quizType === "SHORT_ANSWER" ||
            quizType === "FILL_IN_BLANK" ||
            quizType === "IMAGE_UPLOAD" ||
            quizType === "DRAWING") &&
            renderShortAnswerList()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
