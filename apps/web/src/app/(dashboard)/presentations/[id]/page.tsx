"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Play,
  Plus,
  Loader2,
  Presentation,
  Trash2,
  Sparkles,
  FileText,
  Calendar,
  HardDrive,
  AlertCircle,
  X,
} from "lucide-react";

interface SlideData {
  number: number;
  thumbnailUrl?: string;
  hasQuiz: boolean;
}

interface QuizData {
  id: string;
  slideNumber: number;
  type: string;
  question: string;
}

interface PresentationDetail {
  id: string;
  title: string;
  slideCount: number;
  createdAt: string;
  fileSize?: number;
  slides: SlideData[];
  quizzes: QuizData[];
}

interface SessionData {
  id: string;
  joinCode: string;
  status: string;
  participantCount: number;
}

export default function PresentationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [presentation, setPresentation] = useState<PresentationDetail | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [selectedSlide, setSelectedSlide] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [newQuiz, setNewQuiz] = useState({ question: "", type: "multiple_choice" });

  const fetchPresentation = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/presentations/${params.id}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setPresentation(data);
    } catch {
      setError("Failed to load presentation.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions?presentationId=${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || data || []);
      }
    } catch {
      /* sessions are non-critical */
    }
  }, [params.id]);

  useEffect(() => {
    fetchPresentation();
    fetchSessions();
  }, [fetchPresentation, fetchSessions]);

  const handleStartSession = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presentationId: params.id }),
      });
      if (!res.ok) throw new Error("Failed to create session");
      const data = await res.json();
      router.push(`/present/${data.id || data.session?.id}`);
    } catch {
      setError("Failed to start session.");
      setCreating(false);
    }
  };

  const handleAddQuiz = async () => {
    if (!newQuiz.question.trim()) return;
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presentationId: params.id,
          slideNumber: selectedSlide,
          type: newQuiz.type,
          question: newQuiz.question,
          options: [
            { text: "Option A", isCorrect: true },
            { text: "Option B", isCorrect: false },
            { text: "Option C", isCorrect: false },
            { text: "Option D", isCorrect: false },
          ],
        }),
      });
      if (res.ok) {
        setNewQuiz({ question: "", type: "multiple_choice" });
        setShowQuizEditor(false);
        fetchPresentation();
      }
    } catch {
      setError("Failed to add quiz.");
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      await fetch(`/api/quizzes/${quizId}`, { method: "DELETE" });
      fetchPresentation();
    } catch {
      setError("Failed to delete quiz.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="flex flex-col items-center py-24">
        <AlertCircle className="h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-500">Presentation not found</p>
        <Link
          href="/presentations"
          className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to Presentations
        </Link>
      </div>
    );
  }

  const slides: SlideData[] =
    presentation.slides?.length > 0
      ? presentation.slides
      : Array.from({ length: presentation.slideCount || 6 }, (_, i) => ({
          number: i + 1,
          hasQuiz: (presentation.quizzes || []).some((q) => q.slideNumber === i + 1),
        }));

  const quizzes = presentation.quizzes || [];
  const selectedSlideQuizzes = quizzes.filter((q) => q.slideNumber === selectedSlide);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/presentations"
            className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Presentations
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {presentation.title}
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleStartSession}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-60"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Start Session
          </button>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")}>
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main: slides */}
        <div className="lg:col-span-2 space-y-4">
          {/* Selected slide preview */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              {slides[selectedSlide - 1]?.thumbnailUrl ? (
                <img
                  src={slides[selectedSlide - 1].thumbnailUrl}
                  alt={`Slide ${selectedSlide}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <Presentation className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-400">Slide {selectedSlide}</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2">
              <span className="text-sm font-medium text-gray-700">
                Slide {selectedSlide} of {slides.length}
              </span>
              {selectedSlideQuizzes.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  {selectedSlideQuizzes.length} quiz{selectedSlideQuizzes.length > 1 ? "zes" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Slide thumbnails grid */}
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
            {slides.map((slide) => (
              <button
                key={slide.number}
                onClick={() => setSelectedSlide(slide.number)}
                className={`relative overflow-hidden rounded-lg border transition-all ${
                  slide.number === selectedSlide
                    ? "border-indigo-500 ring-2 ring-indigo-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex aspect-video items-center justify-center bg-gray-50 text-xs text-gray-400">
                  {slide.thumbnailUrl ? (
                    <img
                      src={slide.thumbnailUrl}
                      alt={`Slide ${slide.number}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    slide.number
                  )}
                </div>
                {slide.hasQuiz && (
                  <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-amber-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Quiz panel */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Quizzes on Slide {selectedSlide}
              </h3>
              <button
                onClick={() => setShowQuizEditor(!showQuizEditor)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {selectedSlideQuizzes.length === 0 && !showQuizEditor && (
              <p className="mt-3 text-xs text-gray-500">
                No quizzes on this slide yet.
              </p>
            )}

            <ul className="mt-3 space-y-2">
              {selectedSlideQuizzes.map((quiz) => (
                <li
                  key={quiz.id}
                  className="group flex items-start justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {quiz.question}
                    </p>
                    <p className="mt-0.5 text-xs capitalize text-gray-500">
                      {quiz.type.replace(/_/g, " ")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="ml-2 rounded p-1 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>

            {/* Quiz editor inline */}
            <AnimatePresence>
              {showQuizEditor && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <div className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                    <input
                      type="text"
                      value={newQuiz.question}
                      onChange={(e) => setNewQuiz({ ...newQuiz, question: e.target.value })}
                      placeholder="Enter quiz question..."
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <select
                      value={newQuiz.type}
                      onChange={(e) => setNewQuiz({ ...newQuiz, type: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="poll">Poll</option>
                      <option value="short_answer">Short Answer</option>
                      <option value="word_cloud">Word Cloud</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddQuiz}
                        className="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                      >
                        Add Quiz
                      </button>
                      <button
                        onClick={() => setShowQuizEditor(false)}
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setShowQuizEditor(true)}
              className="mt-3 w-full rounded-lg border border-dashed border-gray-300 py-2.5 text-sm text-gray-500 transition-colors hover:border-indigo-400 hover:text-indigo-600"
            >
              + Add quiz question
            </button>
          </div>

          {/* Sessions */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">Sessions</h3>
            <p className="mt-1 text-xs text-gray-500">
              Create a live session for your audience
            </p>

            {sessions.length > 0 && (
              <div className="mt-3 space-y-2">
                {sessions
                  .filter((s) => s.status === "ACTIVE" || s.status === "WAITING")
                  .map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-lg bg-green-50 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          {session.status === "ACTIVE" ? "Active" : "Waiting"}
                        </p>
                        <p className="text-xs text-green-600">
                          Code: {session.joinCode} &middot;{" "}
                          {session.participantCount} participants
                        </p>
                      </div>
                      <Link
                        href={`/present/${session.id}`}
                        className="text-xs font-medium text-green-700 hover:text-green-900"
                      >
                        Open &rarr;
                      </Link>
                    </div>
                  ))}
              </div>
            )}

            <button
              onClick={handleStartSession}
              disabled={creating}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Create New Session
            </button>
          </div>

          {/* Details */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">Details</h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-gray-500">
                  <FileText className="h-3.5 w-3.5" />
                  Slides
                </dt>
                <dd className="font-medium text-gray-900">{slides.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-gray-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  Quizzes
                </dt>
                <dd className="font-medium text-gray-900">{quizzes.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  Created
                </dt>
                <dd className="font-medium text-gray-900">
                  {new Date(presentation.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-gray-500">
                  <HardDrive className="h-3.5 w-3.5" />
                  File size
                </dt>
                <dd className="font-medium text-gray-900">
                  {formatFileSize(presentation.fileSize)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
