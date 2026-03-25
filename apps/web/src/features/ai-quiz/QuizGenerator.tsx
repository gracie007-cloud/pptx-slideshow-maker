"use client";

import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import type { QuizType, BloomLevel, AIProvider, GeneratedQuestion } from "@slideshow/shared";

export interface QuizGeneratorProps {
  slideText: string;
  presentationId: string;
  slideId?: string;
  onQuestionsGenerated: (questions: GeneratedQuestion[]) => void;
}

const quizTypes: { value: QuizType; label: string }[] = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "FILL_IN_BLANK", label: "Fill in the Blank" },
  { value: "WORD_CLOUD", label: "Word Cloud" },
];

const difficulties: { value: BloomLevel; label: string; description: string }[] = [
  { value: "remember", label: "Remember", description: "Recall facts and basic concepts" },
  { value: "understand", label: "Understand", description: "Explain ideas or concepts" },
  { value: "apply", label: "Apply", description: "Use information in new situations" },
  { value: "analyze", label: "Analyze", description: "Draw connections among ideas" },
  { value: "evaluate", label: "Evaluate", description: "Justify a decision" },
  { value: "create", label: "Create", description: "Produce new or original work" },
];

export default function QuizGenerator({
  slideText,
  presentationId,
  slideId,
  onQuestionsGenerated,
}: QuizGeneratorProps) {
  const [quizType, setQuizType] = useState<QuizType>("MULTIPLE_CHOICE");
  const [difficulty, setDifficulty] = useState<BloomLevel>("understand");
  const [count, setCount] = useState(3);
  const [provider, setProvider] = useState<AIProvider>("anthropic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!slideText.trim()) {
      setError("No slide content available to generate questions from.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slideText,
          quizType,
          difficulty,
          count,
          provider,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate quiz");
      }

      const data = await res.json();
      onQuestionsGenerated(data.questions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-800">AI Quiz Generator</h3>
      </div>

      {slideText ? (
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-400 mb-1">Slide content preview</p>
          <p className="text-sm text-gray-600 line-clamp-3">{slideText}</p>
        </div>
      ) : (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
          <p className="text-sm text-yellow-700">Select a slide with text content to generate questions.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Quiz Type</label>
          <select
            value={quizType}
            onChange={(e) => setQuizType(e.target.value as QuizType)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {quizTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Questions</label>
          <select
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {[1, 2, 3, 5, 10].map((n) => (
              <option key={n} value={n}>{n} question{n !== 1 ? "s" : ""}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Difficulty (Bloom&apos;s Taxonomy)</label>
        <div className="grid grid-cols-3 gap-1.5">
          {difficulties.map((d) => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              className={`rounded-lg px-2 py-1.5 text-xs text-left transition-colors ${
                difficulty === d.value
                  ? "bg-purple-100 border border-purple-300 text-purple-700"
                  : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="font-medium block">{d.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">AI Provider</label>
        <div className="flex gap-2">
          <button
            onClick={() => setProvider("anthropic")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              provider === "anthropic"
                ? "bg-orange-100 border border-orange-300 text-orange-700"
                : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            Claude
          </button>
          <button
            onClick={() => setProvider("openai")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              provider === "openai"
                ? "bg-green-100 border border-green-300 text-green-700"
                : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            GPT-4o
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading || !slideText.trim()}
        className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate Quiz
          </>
        )}
      </button>
    </div>
  );
}
