"use client";

import React, { useState } from "react";
import { Trash2, Plus, GripVertical, Save, X } from "lucide-react";
import type { QuizType, GeneratedQuestion, QuizOption } from "@slideshow/shared";

export interface QuizEditorProps {
  questions: GeneratedQuestion[];
  onChange: (questions: GeneratedQuestion[]) => void;
  onSave: (questions: GeneratedQuestion[]) => void;
  onCancel?: () => void;
  saving?: boolean;
}

export default function QuizEditor({
  questions,
  onChange,
  onSave,
  onCancel,
  saving = false,
}: QuizEditorProps) {
  const updateQuestion = (index: number, updates: Partial<GeneratedQuestion>) => {
    const updated = questions.map((q, i) => (i === index ? { ...q, ...updates } : q));
    onChange(updated);
  };

  const deleteQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  const updateOption = (qIndex: number, oIndex: number, text: string) => {
    const q = questions[qIndex];
    if (!q.options) return;
    const newOptions = q.options.map((opt, i) =>
      i === oIndex ? { ...opt, text } : opt
    );
    updateQuestion(qIndex, { options: newOptions });
  };

  const toggleCorrectOption = (qIndex: number, oIndex: number) => {
    const q = questions[qIndex];
    if (!q.options) return;
    const newOptions = q.options.map((opt, i) => ({
      ...opt,
      isCorrect: i === oIndex,
    }));
    const correctText = newOptions[oIndex].text;
    updateQuestion(qIndex, { options: newOptions, correctAnswer: correctText });
  };

  const addOption = (qIndex: number) => {
    const q = questions[qIndex];
    const options = q.options ?? [];
    updateQuestion(qIndex, {
      options: [...options, { text: "", isCorrect: false }],
    });
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const q = questions[qIndex];
    if (!q.options) return;
    updateQuestion(qIndex, {
      options: q.options.filter((_, i) => i !== oIndex),
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Edit Questions ({questions.length})
        </h3>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => onSave(questions)}
            disabled={questions.length === 0 || saving}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save All"}
          </button>
        </div>
      </div>

      {questions.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          No questions to edit. Generate some first.
        </p>
      ) : (
        <div className="space-y-4">
          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3"
            >
              <div className="flex items-start gap-2">
                <GripVertical className="h-5 w-5 text-gray-300 mt-1 shrink-0 cursor-grab" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                      {qIndex + 1}
                    </span>
                    <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 uppercase">
                      {q.type.replace(/_/g, " ")}
                    </span>
                    {q.difficulty && (
                      <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-600">
                        {q.difficulty}
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="Question text..."
                  />

                  {q.type === "MULTIPLE_CHOICE" && q.options && (
                    <div className="space-y-1.5 ml-2">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <button
                            onClick={() => toggleCorrectOption(qIndex, oIndex)}
                            className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                              opt.isCorrect
                                ? "border-green-500 bg-green-500 text-white"
                                : "border-gray-300 text-gray-400 hover:border-green-400"
                            }`}
                          >
                            {String.fromCharCode(65 + oIndex)}
                          </button>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            className={`flex-1 rounded border px-2 py-1 text-sm focus:outline-none focus:ring-1 ${
                              opt.isCorrect
                                ? "border-green-300 bg-green-50 focus:ring-green-500"
                                : "border-gray-200 bg-white focus:ring-primary-500"
                            }`}
                            placeholder={`Option ${String.fromCharCode(65 + oIndex)}...`}
                          />
                          <button
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {(q.options?.length ?? 0) < 6 && (
                        <button
                          onClick={() => addOption(qIndex)}
                          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          Add option
                        </button>
                      )}
                    </div>
                  )}

                  {(q.type === "SHORT_ANSWER" || q.type === "FILL_IN_BLANK") && (
                    <div>
                      <label className="text-xs text-gray-500">Correct answer</label>
                      <input
                        type="text"
                        value={q.correctAnswer ?? ""}
                        onChange={(e) => updateQuestion(qIndex, { correctAnswer: e.target.value })}
                        className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="Expected answer..."
                      />
                    </div>
                  )}

                  {q.explanation && (
                    <div>
                      <label className="text-xs text-gray-500">Explanation</label>
                      <input
                        type="text"
                        value={q.explanation}
                        onChange={(e) => updateQuestion(qIndex, { explanation: e.target.value })}
                        className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="Why this is the answer..."
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => deleteQuestion(qIndex)}
                  className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  title="Delete question"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
