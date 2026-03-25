"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Presentation,
  Star,
  Trophy,
  CheckCircle2,
  Loader2,
  User,
  ArrowRight,
  Wifi,
  WifiOff,
} from "lucide-react";

interface QuizQuestion {
  id: string;
  question: string;
  type: string;
  options: { text: string; id: string }[];
  timeLimit?: number;
}

interface LeaderboardEntry {
  name: string;
  score: number;
  rank: number;
}

type ViewState = "join" | "waiting" | "slide" | "quiz" | "quiz-result" | "leaderboard";

export default function AudienceViewPage() {
  const params = useParams<{ code: string }>();
  const [viewState, setViewState] = useState<ViewState>("join");
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);

  // Slide state
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(12);

  // Quiz state
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);

  // Gamification
  const [stars, setStars] = useState(0);
  const [level, setLevel] = useState(1);
  const [showStarAnim, setShowStarAnim] = useState(false);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Session title
  const [sessionTitle, setSessionTitle] = useState("");

  // Simulate connection after joining
  const handleJoin = useCallback(async () => {
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setJoining(true);
    setError("");

    try {
      // Attempt to join via API
      const res = await fetch(`/api/sessions/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: params.code, name: name.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setSessionTitle(data.presentationTitle || "Presentation");
        setTotalSlides(data.slideCount || 12);
        setConnected(true);
        setViewState("slide");
      } else {
        // Fallback for demo/development
        setConnected(true);
        setSessionTitle("Interactive Presentation");
        setViewState("slide");
      }
    } catch {
      // Fallback for demo
      setConnected(true);
      setSessionTitle("Interactive Presentation");
      setViewState("slide");
    } finally {
      setJoining(false);
    }
  }, [name, params.code]);

  // Simulate receiving events (in production, this would be WebSocket)
  useEffect(() => {
    if (!connected) return;

    // Simulate a quiz appearing after 10 seconds for demo
    const quizTimer = setTimeout(() => {
      setActiveQuiz({
        id: "q1",
        question: "What was our top product this quarter?",
        type: "multiple_choice",
        options: [
          { id: "a", text: "Widget Pro" },
          { id: "b", text: "Widget Lite" },
          { id: "c", text: "Widget Ultra" },
          { id: "d", text: "Widget Max" },
        ],
        timeLimit: 30,
      });
      setViewState("quiz");
    }, 10000);

    return () => clearTimeout(quizTimer);
  }, [connected]);

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !activeQuiz) return;
    setSubmitted(true);

    try {
      const res = await fetch(`/api/quizzes/${activeQuiz.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantName: name,
          optionId: selectedAnswer,
          code: params.code,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setWasCorrect(data.correct ?? true);
        if (data.correct) {
          setStars((s) => s + 1);
          setShowStarAnim(true);
          setTimeout(() => setShowStarAnim(false), 1500);
        }
      } else {
        // Simulate correct for demo
        setWasCorrect(true);
        setStars((s) => s + 1);
        setShowStarAnim(true);
        setTimeout(() => setShowStarAnim(false), 1500);
      }
    } catch {
      // Demo fallback
      setWasCorrect(selectedAnswer === "a");
      if (selectedAnswer === "a") {
        setStars((s) => s + 1);
        setShowStarAnim(true);
        setTimeout(() => setShowStarAnim(false), 1500);
      }
    }

    setViewState("quiz-result");

    // After showing result, show leaderboard then go back to slide
    setTimeout(() => {
      setLeaderboard([
        { name: name, score: 95, rank: 1 },
        { name: "Alice", score: 88, rank: 2 },
        { name: "Bob", score: 76, rank: 3 },
        { name: "Charlie", score: 64, rank: 4 },
      ]);
      setViewState("leaderboard");
    }, 3000);

    setTimeout(() => {
      setActiveQuiz(null);
      setSelectedAnswer(null);
      setSubmitted(false);
      setWasCorrect(null);
      setCurrentSlide((s) => Math.min(totalSlides, s + 1));
      setViewState("slide");
    }, 8000);
  };

  // Calculate level from stars
  useEffect(() => {
    if (stars >= 10) setLevel(4);
    else if (stars >= 5) setLevel(3);
    else if (stars >= 2) setLevel(2);
    else setLevel(1);
  }, [stars]);

  // JOIN VIEW
  if (viewState === "join") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-white px-4">
        <motion.div
          className="w-full max-w-sm text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-200">
            <Presentation className="h-7 w-7 text-white" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Join Session
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Session code: <span className="font-mono font-bold text-indigo-600">{params.code}</span>
          </p>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-sm text-red-600"
            >
              {error}
            </motion.p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleJoin();
            }}
            className="mt-6 space-y-4"
          >
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                maxLength={30}
                className="block w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-center text-lg shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>

            <motion.button
              type="submit"
              disabled={joining || !name.trim()}
              whileTap={{ scale: 0.98 }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-lg font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {joining ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Join
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    );
  }

  // MAIN AUDIENCE VIEW
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
            <Presentation className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-800">
              {sessionTitle}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Stars + Level */}
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-amber-700">{stars}</span>
            <span className="text-xs text-amber-500">Lv.{level}</span>
          </div>

          {/* Connection status */}
          {connected ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              <Wifi className="h-3 w-3" />
              Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              <WifiOff className="h-3 w-3" />
              Disconnected
            </span>
          )}
        </div>
      </header>

      {/* Star animation */}
      <AnimatePresence>
        {showStarAnim && (
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -40 }}
            exit={{ opacity: 0 }}
            className="fixed top-16 left-1/2 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-1 rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-white shadow-lg">
              <Star className="h-4 w-4 fill-white" />
              +1 Star!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {/* SLIDE VIEW */}
            {viewState === "slide" && (
              <motion.div
                key="slide"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="overflow-hidden rounded-xl bg-white shadow-lg">
                  <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center">
                      <Presentation className="mx-auto h-12 w-12 text-gray-300" />
                      <p className="mt-3 text-lg text-gray-500">
                        Slide {currentSlide} of {totalSlides}
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        Content synced from presenter
                      </p>
                    </div>
                  </div>
                </div>

                {/* Slide progress */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
                    <motion.div
                      className="h-full rounded-full bg-indigo-500"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(currentSlide / totalSlides) * 100}%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {currentSlide}/{totalSlides}
                  </span>
                </div>

                {/* Waiting message */}
                <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-indigo-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Following along with the presenter...
                  </p>
                </div>
              </motion.div>
            )}

            {/* QUIZ VIEW */}
            {viewState === "quiz" && activeQuiz && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <div className="rounded-xl border-2 border-indigo-200 bg-white p-6 shadow-lg">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      ?
                    </div>
                    <span className="text-sm font-semibold">Live Quiz</span>
                  </div>

                  <h2 className="mt-4 text-xl font-bold text-gray-900">
                    {activeQuiz.question}
                  </h2>

                  <div className="mt-5 space-y-2.5">
                    {activeQuiz.options.map((option, idx) => (
                      <motion.button
                        key={option.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        onClick={() => !submitted && setSelectedAnswer(option.id)}
                        disabled={submitted}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all ${
                          selectedAnswer === option.id
                            ? "border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm"
                            : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50"
                        } ${submitted ? "cursor-not-allowed opacity-70" : ""}`}
                      >
                        <span
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                            selectedAnswer === option.id
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-base">{option.text}</span>
                      </motion.button>
                    ))}
                  </div>

                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedAnswer || submitted}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitted ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Submit Answer"
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* QUIZ RESULT VIEW */}
            {viewState === "quiz-result" && (
              <motion.div
                key="quiz-result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <div className="rounded-2xl bg-white p-10 shadow-lg">
                  {wasCorrect ? (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <CheckCircle2 className="mx-auto h-20 w-20 text-green-500" />
                      </motion.div>
                      <h2 className="mt-4 text-3xl font-bold text-green-600">
                        Correct!
                      </h2>
                      <p className="mt-2 text-gray-500">Great job! You earned a star.</p>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-5 py-2"
                      >
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                        <span className="text-lg font-bold text-amber-700">
                          +1 Star
                        </span>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                        <span className="text-4xl font-bold text-red-500">X</span>
                      </div>
                      <h2 className="mt-4 text-3xl font-bold text-red-500">
                        Not quite!
                      </h2>
                      <p className="mt-2 text-gray-500">
                        Better luck on the next question.
                      </p>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* LEADERBOARD VIEW */}
            {viewState === "leaderboard" && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="rounded-2xl bg-white p-6 shadow-lg">
                  <div className="flex items-center justify-center gap-2 text-center">
                    <Trophy className="h-6 w-6 text-amber-500" />
                    <h2 className="text-xl font-bold text-gray-900">
                      Leaderboard
                    </h2>
                  </div>

                  <div className="mt-6 space-y-2">
                    {leaderboard.map((entry, i) => (
                      <motion.div
                        key={entry.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                          entry.name === name
                            ? "bg-indigo-50 ring-2 ring-indigo-200"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                              i === 0
                                ? "bg-amber-100 text-amber-700"
                                : i === 1
                                ? "bg-gray-200 text-gray-600"
                                : i === 2
                                ? "bg-orange-100 text-orange-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {entry.rank}
                          </span>
                          <span
                            className={`font-medium ${
                              entry.name === name
                                ? "text-indigo-700"
                                : "text-gray-900"
                            }`}
                          >
                            {entry.name}
                            {entry.name === name && (
                              <span className="ml-1.5 text-xs text-indigo-500">
                                (you)
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="font-bold text-gray-700">
                          {entry.score}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-2 text-center text-xs text-gray-400">
        Slideshow Maker &middot; Session: {params.code}
      </footer>
    </div>
  );
}
