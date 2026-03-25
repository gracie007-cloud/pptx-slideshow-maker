"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Users,
  Timer,
  Pen,
  Star,
  Shuffle,
  QrCode,
  X,
  Maximize2,
  Minimize2,
  PanelRightOpen,
  PanelRightClose,
  LogOut,
  Loader2,
  Eye,
  Presentation,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface ParticipantInfo {
  id: string;
  name: string;
  stars: number;
}

export default function PresenterViewPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(12);
  const [joinCode, setJoinCode] = useState("ABC123");
  const [participants, setParticipants] = useState<ParticipantInfo[]>([
    { id: "1", name: "Alice", stars: 3 },
    { id: "2", name: "Bob", stars: 2 },
    { id: "3", name: "Charlie", stars: 5 },
  ]);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [spotlightActive, setSpotlightActive] = useState(false);
  const [quizActive, setQuizActive] = useState(false);
  const [pickedName, setPickedName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch session data
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/sessions/${params.sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setJoinCode(data.joinCode || "ABC123");
          setTotalSlides(data.slideCount || data.presentation?.slideCount || 12);
          if (data.participants) {
            setParticipants(data.participants);
          }
        }
      } catch {
        /* use defaults */
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [params.sessionId]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setCurrentSlide((s) => Math.min(totalSlides, s + 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setCurrentSlide((s) => Math.max(1, s - 1));
      } else if (e.key === "Escape") {
        if (isFullscreen) {
          document.exitFullscreen?.();
          setIsFullscreen(false);
        } else {
          router.push("/presentations");
        }
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "q" || e.key === "Q") {
        setShowQR((v) => !v);
      }
    },
    [totalSlides, isFullscreen, router]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const pickRandomName = () => {
    if (participants.length === 0) return;
    const random = participants[Math.floor(Math.random() * participants.length)];
    setPickedName(random.name);
    setTimeout(() => setPickedName(null), 3000);
  };

  const handleEndSession = async () => {
    if (!confirm("Are you sure you want to end this session?")) return;
    try {
      await fetch(`/api/sessions/${params.sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ENDED" }),
      });
    } catch {
      /* continue to redirect */
    }
    router.push("/presentations");
  };

  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/join/${joinCode}` : "";

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-white select-none">
      {/* Top toolbar */}
      <div className="flex items-center justify-between bg-gray-900/80 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/presentations"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Exit
          </Link>
          <div className="h-5 w-px bg-gray-700" />
          <span className="text-sm text-gray-500">
            Session: {params.sessionId.slice(0, 8)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-900/50 px-3 py-1 text-xs text-green-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            Live &middot; {participants.length} connected
          </span>

          {/* Join code */}
          <button
            onClick={() => setShowQR(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-1.5 font-mono text-sm text-gray-300 transition-colors hover:bg-gray-700"
          >
            <QrCode className="h-3.5 w-3.5" />
            {joinCode}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          {/* Side panel toggle */}
          <button
            onClick={() => setShowSidePanel(!showSidePanel)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            {showSidePanel ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Slide area */}
        <div className="flex flex-1 items-center justify-center p-6 relative">
          {/* Spotlight overlay */}
          {spotlightActive && (
            <div className="pointer-events-none absolute inset-0 z-10 bg-black/60" />
          )}

          {/* Annotation overlay */}
          {annotationMode && (
            <div className="absolute inset-0 z-10 cursor-crosshair" />
          )}

          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-xl bg-gray-800 shadow-2xl"
          >
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Presentation className="mx-auto h-16 w-16 text-gray-600" />
                <p className="mt-4 text-xl text-gray-500">Slide {currentSlide}</p>
                <p className="mt-1 text-sm text-gray-600">
                  Content rendered from your presentation
                </p>
              </div>
            </div>

            {/* Slide number badge */}
            <div className="absolute bottom-3 right-3 rounded-lg bg-black/50 px-2.5 py-1 text-xs text-gray-300 backdrop-blur-sm">
              {currentSlide} / {totalSlides}
            </div>
          </motion.div>

          {/* Picked name overlay */}
          <AnimatePresence>
            {pickedName && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              >
                <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 px-16 py-10 text-center shadow-2xl">
                  <p className="text-lg text-white/70">Selected:</p>
                  <p className="mt-2 text-5xl font-bold text-white">{pickedName}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* QR code overlay */}
          <AnimatePresence>
            {showQR && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                onClick={() => setShowQR(false)}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-2xl bg-white p-10 text-center shadow-2xl"
                >
                  <h3 className="text-lg font-bold text-gray-900">Join this session</h3>
                  <div className="mt-4">
                    <QRCodeSVG value={joinUrl} size={200} level="M" />
                  </div>
                  <p className="mt-4 font-mono text-3xl font-bold tracking-widest text-indigo-600">
                    {joinCode}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">{joinUrl}</p>
                  <button
                    onClick={() => setShowQR(false)}
                    className="mt-4 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Close
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Side panel */}
        <AnimatePresence>
          {showSidePanel && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col overflow-hidden border-l border-gray-800 bg-gray-900"
            >
              {/* Participants */}
              <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                  <Users className="h-4 w-4" />
                  Participants ({participants.length})
                </h3>
                <button
                  onClick={() => setShowSidePanel(false)}
                  className="rounded p-1 text-gray-500 hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3">
                <ul className="space-y-2">
                  {participants.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-medium text-indigo-300">
                          {p.name[0]}
                        </div>
                        <span className="text-sm text-gray-300">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: p.stars }, (_, i) => (
                          <Star
                            key={i}
                            className="h-3 w-3 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>

                {participants.length === 0 && (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Users className="h-8 w-8 text-gray-600" />
                    <p className="mt-2 text-sm text-gray-500">
                      Waiting for participants...
                    </p>
                  </div>
                )}
              </div>

              {/* Quiz controls in panel */}
              <div className="border-t border-gray-800 p-4 space-y-2">
                <button
                  onClick={() => setQuizActive(!quizActive)}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    quizActive
                      ? "bg-red-600 text-white hover:bg-red-500"
                      : "bg-amber-600 text-white hover:bg-amber-500"
                  }`}
                >
                  <Play className="h-4 w-4" />
                  {quizActive ? "Stop Quiz" : "Launch Quiz"}
                </button>
                <button
                  onClick={() => setShowQR(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700"
                >
                  <QrCode className="h-4 w-4" />
                  Show QR Code
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between bg-gray-900/80 px-4 py-2.5 backdrop-blur-sm">
        {/* Left: navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentSlide((s) => Math.max(1, s - 1))}
            disabled={currentSlide <= 1}
            className="rounded-lg bg-gray-800 p-2 text-gray-300 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[60px] text-center font-mono text-sm text-gray-400">
            {currentSlide} / {totalSlides}
          </span>
          <button
            onClick={() => setCurrentSlide((s) => Math.min(totalSlides, s + 1))}
            disabled={currentSlide >= totalSlides}
            className="rounded-lg bg-gray-800 p-2 text-gray-300 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Center: tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setQuizActive(!quizActive)}
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              quizActive
                ? "bg-amber-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
            title="Launch Quiz"
          >
            <Play className="h-4 w-4" />
          </button>
          <button
            onClick={() => setAnnotationMode(!annotationMode)}
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              annotationMode
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
            title="Annotations"
          >
            <Pen className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setTimerActive(!timerActive);
              if (!timerActive) setTimerSeconds(0);
            }}
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              timerActive
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
            title="Timer"
          >
            <Timer className="h-4 w-4" />
          </button>
          {timerActive && (
            <span className="rounded-lg bg-gray-800 px-2.5 py-1.5 font-mono text-sm text-purple-300">
              {formatTimer(timerSeconds)}
            </span>
          )}
          <button
            onClick={() => setSpotlightActive(!spotlightActive)}
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              spotlightActive
                ? "bg-yellow-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
            title="Spotlight"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={pickRandomName}
            className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700"
            title="Pick Random Name"
          >
            <Shuffle className="h-4 w-4" />
          </button>
        </div>

        {/* Right: slide thumbnails + end session */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {Array.from({ length: Math.min(7, totalSlides) }, (_, i) => {
              const start = Math.max(0, Math.min(currentSlide - 4, totalSlides - 7));
              const slideNum = start + i + 1;
              if (slideNum > totalSlides) return null;
              return (
                <button
                  key={slideNum}
                  onClick={() => setCurrentSlide(slideNum)}
                  className={`flex h-8 w-12 flex-shrink-0 items-center justify-center rounded text-xs transition-all ${
                    slideNum === currentSlide
                      ? "border border-indigo-500 bg-indigo-500/20 text-indigo-300"
                      : "border border-gray-700 bg-gray-800 text-gray-500 hover:border-gray-600"
                  }`}
                >
                  {slideNum}
                </button>
              );
            })}
          </div>
          <div className="h-5 w-px bg-gray-700" />
          <button
            onClick={handleEndSession}
            className="rounded-lg bg-red-600/80 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
          >
            End
          </button>
        </div>
      </div>
    </div>
  );
}
