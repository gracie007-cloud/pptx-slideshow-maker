"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Play,
  Square,
  Clock,
  Users,
  MessageSquare,
  PenTool,
  Image,
  Type,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Quiz, QuizType } from "@slideshow/shared";

export interface QuizManagerProps {
  quizzes: Quiz[];
  onStart: (quizId: string) => void;
  onStop: (quizId: string) => void;
  isPresenter: boolean;
  responseCount?: number;
  timeRemaining?: number;
}

const QUIZ_TYPE_ICONS: Record<QuizType, React.ReactNode> = {
  MULTIPLE_CHOICE: <MessageSquare className="h-4 w-4" />,
  WORD_CLOUD: <Type className="h-4 w-4" />,
  SHORT_ANSWER: <PenTool className="h-4 w-4" />,
  FILL_IN_BLANK: <Type className="h-4 w-4" />,
  IMAGE_UPLOAD: <Image className="h-4 w-4" />,
  DRAWING: <PenTool className="h-4 w-4" />,
};

const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  WORD_CLOUD: "Word Cloud",
  SHORT_ANSWER: "Short Answer",
  FILL_IN_BLANK: "Fill in Blank",
  IMAGE_UPLOAD: "Image Upload",
  DRAWING: "Drawing",
};

export default function QuizManager({
  quizzes,
  onStart,
  onStop,
  isPresenter,
  responseCount = 0,
  timeRemaining,
}: QuizManagerProps) {
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [localTime, setLocalTime] = useState<number>(0);

  useEffect(() => {
    if (timeRemaining !== undefined) {
      setLocalTime(timeRemaining);
    }
  }, [timeRemaining]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStart = useCallback(
    (quizId: string) => {
      setActiveQuizId(quizId);
      const quiz = quizzes.find((q) => q.id === quizId);
      if (quiz) {
        setLocalTime(quiz.timeLimit);
        timerRef.current = setInterval(() => {
          setLocalTime((prev) => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              timerRef.current = null;
              setActiveQuizId(null);
              onStop(quizId);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      onStart(quizId);
    },
    [quizzes, onStart, onStop]
  );

  const handleStop = useCallback(
    (quizId: string) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setActiveQuizId(null);
      setLocalTime(0);
      onStop(quizId);
    },
    [onStop]
  );

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (!isPresenter) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Quiz Manager</h3>
        {activeQuizId && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm text-orange-600">
              <Clock className="h-4 w-4" />
              <span className="font-mono font-bold tabular-nums">
                {formatTime(localTime)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-blue-600">
              <Users className="h-4 w-4" />
              <span className="font-medium">{responseCount}</span>
            </div>
          </div>
        )}
      </div>

      {quizzes.length === 0 ? (
        <p className="text-sm text-gray-500">
          No quizzes available. Use the AI Quiz Generator to create some.
        </p>
      ) : (
        <ul className="space-y-2">
          {quizzes.map((quiz) => {
            const isActive = activeQuizId === quiz.id;
            const isExpanded = expandedId === quiz.id;

            return (
              <li
                key={quiz.id}
                className={`rounded-lg border transition-colors ${
                  isActive
                    ? "border-green-300 bg-green-50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3 p-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      isActive
                        ? "bg-green-200 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {QUIZ_TYPE_ICONS[quiz.type]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {quiz.question}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {QUIZ_TYPE_LABELS[quiz.type]}
                      </span>
                      <span className="text-xs text-gray-300">|</span>
                      <span className="text-xs text-gray-400">
                        {quiz.timeLimit}s
                      </span>
                      <span className="text-xs text-gray-300">|</span>
                      <span className="text-xs text-gray-400">
                        {quiz.points} pts
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : quiz.id)
                      }
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {isActive ? (
                      <button
                        onClick={() => handleStop(quiz.id)}
                        className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors"
                      >
                        <Square className="h-3 w-3" />
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStart(quiz.id)}
                        disabled={activeQuizId !== null}
                        className="flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Play className="h-3 w-3" />
                        Start
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-3 py-2">
                    <p className="text-sm text-gray-600 mb-2">
                      {quiz.question}
                    </p>
                    {quiz.options && quiz.options.length > 0 && (
                      <div className="space-y-1">
                        {quiz.options.map((opt, i) => (
                          <div
                            key={i}
                            className={`flex items-center gap-2 rounded px-2 py-1 text-xs ${
                              opt.isCorrect
                                ? "bg-green-50 text-green-700 font-medium"
                                : "text-gray-500"
                            }`}
                          >
                            <span className="font-bold">
                              {String.fromCharCode(65 + i)}.
                            </span>
                            <span>{opt.text}</span>
                            {opt.isCorrect && (
                              <span className="ml-auto text-green-500 text-[10px]">
                                CORRECT
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {quiz.correctAnswer && (
                      <p className="mt-1 text-xs text-green-600">
                        Answer: {quiz.correctAnswer}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
