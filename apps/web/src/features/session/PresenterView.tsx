"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  MessageSquare,
  Timer as TimerIcon,
  Pen,
  Target,
  Shuffle,
  Maximize,
  Minimize,
  X,
  QrCode,
  Play,
  Square,
  Star,
  BarChart3,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Slide, Quiz } from "@slideshow/shared";
import { useSessionContext } from "./SessionProvider";
import SlideCanvas from "../slide-renderer/SlideCanvas";
import TransitionEngine from "../slide-renderer/TransitionEngine";
import QuizManager from "../quiz/QuizManager";
import AnnotationToolbar from "../presenter-tools/AnnotationToolbar";
import TimerComponent from "../presenter-tools/Timer";
import Spotlight from "../presenter-tools/Spotlight";
import NamePicker from "../presenter-tools/NamePicker";
import Leaderboard from "../gamification/Leaderboard";

export interface PresenterViewProps {
  sessionId: string;
  joinCode: string;
  slides: Slide[];
  quizzes: Quiz[];
  presentationTitle: string;
}

export default function PresenterView({
  sessionId,
  joinCode,
  slides,
  quizzes,
  presentationTitle,
}: PresenterViewProps) {
  const {
    currentSlideIndex,
    navigateToSlide,
    participants,
    participantCount,
    connected,
    activeQuiz,
    responseCount,
    startQuiz,
    stopQuiz,
    awardStar,
    startTimer,
    stopTimer,
    timerRemaining,
    leaderboard,
    spinNamePicker,
    drawAnnotation,
    clearAnnotations,
    moveSpotlight,
  } = useSessionContext();

  const [sidePanel, setSidePanel] = useState<"participants" | "quizzes" | "notes" | "leaderboard" | null>("participants");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showNamePicker, setShowNamePicker] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [transitionDir, setTransitionDir] = useState<"left" | "right">("right");

  const currentSlide = slides[currentSlideIndex] ?? null;

  const goToSlide = useCallback(
    (index: number) => {
      if (index < 0 || index >= slides.length) return;
      setTransitionDir(index > currentSlideIndex ? "right" : "left");
      navigateToSlide(index);
    },
    [currentSlideIndex, navigateToSlide, slides.length]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        goToSlide(currentSlideIndex + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goToSlide(currentSlideIndex - 1);
      } else if (e.key === "Escape") {
        if (isFullscreen) {
          document.exitFullscreen?.();
          setIsFullscreen(false);
        }
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentSlideIndex, goToSlide, isFullscreen]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  const joinUrl = typeof window !== "undefined"
    ? `${window.location.origin}/join/${joinCode}`
    : `/join/${joinCode}`;

  return (
    <div className="flex h-screen w-screen flex-col bg-gray-950 text-white overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold truncate max-w-[200px]">{presentationTitle}</h1>
          <span className="text-xs text-gray-500">Session: {sessionId.slice(0, 8)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrCode(!showQrCode)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium hover:bg-primary-700 transition-colors"
          >
            <QrCode className="h-3.5 w-3.5" />
            {joinCode}
          </button>

          <div className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-1.5 text-xs">
            <Users className="h-3.5 w-3.5 text-green-400" />
            <span>{participantCount}</span>
          </div>

          <div className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main slide area */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="relative flex-1 bg-black">
            <TransitionEngine
              slideKey={currentSlideIndex}
              transitionType="fade"
              direction={transitionDir}
            >
              <SlideCanvas
                slide={currentSlide}
                slideIndex={currentSlideIndex}
                totalSlides={slides.length}
                onNavigate={goToSlide}
                showControls={false}
              />
            </TransitionEngine>

            {showAnnotations && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
                <AnnotationToolbar
                  onDraw={drawAnnotation}
                  onClear={clearAnnotations}
                  active={showAnnotations}
                />
              </div>
            )}

            {showSpotlight && (
              <Spotlight active={showSpotlight} onMove={moveSpotlight} />
            )}

            {showTimer && timerRemaining !== null && (
              <div className="absolute top-4 right-4 z-20">
                <TimerComponent
                  duration={timerRemaining}
                  onComplete={() => setShowTimer(false)}
                  onStart={startTimer}
                  onStop={() => { stopTimer(); setShowTimer(false); }}
                />
              </div>
            )}

            {showNamePicker && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
                <div className="relative">
                  <button
                    onClick={() => setShowNamePicker(false)}
                    className="absolute -top-3 -right-3 z-10 rounded-full bg-gray-800 p-1 hover:bg-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <NamePicker
                    participants={participants.map((p) => ({ id: p.id, name: p.name }))}
                    onSpin={spinNamePicker}
                    selectedName={null}
                  />
                </div>
              </div>
            )}

            {showQrCode && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80" onClick={() => setShowQrCode(false)}>
                <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8" onClick={(e) => e.stopPropagation()}>
                  <QRCodeSVG value={joinUrl} size={256} level="M" />
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Join at</p>
                    <p className="text-lg font-bold text-gray-900 tracking-widest">{joinCode}</p>
                    <p className="text-xs text-gray-400 mt-1">{joinUrl}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between border-t border-gray-800 bg-gray-900 px-4 py-2 shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToSlide(currentSlideIndex - 1)}
                disabled={currentSlideIndex === 0}
                className="rounded-lg p-2 hover:bg-gray-800 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="min-w-[60px] text-center text-sm font-medium">
                {currentSlideIndex + 1} / {slides.length}
              </span>
              <button
                onClick={() => goToSlide(currentSlideIndex + 1)}
                disabled={currentSlideIndex >= slides.length - 1}
                className="rounded-lg p-2 hover:bg-gray-800 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <ToolButton icon={Pen} label="Annotate" active={showAnnotations} onClick={() => setShowAnnotations(!showAnnotations)} />
              <ToolButton icon={Target} label="Spotlight" active={showSpotlight} onClick={() => setShowSpotlight(!showSpotlight)} />
              <ToolButton
                icon={TimerIcon}
                label="Timer"
                active={showTimer}
                onClick={() => {
                  if (!showTimer) {
                    setShowTimer(true);
                    startTimer(60);
                  } else {
                    stopTimer();
                    setShowTimer(false);
                  }
                }}
              />
              <ToolButton icon={Shuffle} label="Name Picker" active={showNamePicker} onClick={() => setShowNamePicker(!showNamePicker)} />
              <ToolButton icon={isFullscreen ? Minimize : Maximize} label="Fullscreen" active={isFullscreen} onClick={toggleFullscreen} />
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSidePanel(sidePanel === "participants" ? null : "participants")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  sidePanel === "participants" ? "bg-primary-600" : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                <Users className="h-4 w-4 inline mr-1" />Participants
              </button>
              <button
                onClick={() => setSidePanel(sidePanel === "quizzes" ? null : "quizzes")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  sidePanel === "quizzes" ? "bg-primary-600" : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-1" />Quizzes
              </button>
              <button
                onClick={() => setSidePanel(sidePanel === "leaderboard" ? null : "leaderboard")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  sidePanel === "leaderboard" ? "bg-primary-600" : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-1" />Board
              </button>
            </div>
          </div>
        </main>

        {/* Side panel */}
        {sidePanel && (
          <aside className="w-80 shrink-0 overflow-y-auto border-l border-gray-800 bg-gray-900">
            <div className="p-4">
              {sidePanel === "participants" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Participants ({participantCount})</h3>
                  {participants.length === 0 ? (
                    <p className="text-xs text-gray-500">Waiting for participants to join...</p>
                  ) : (
                    <ul className="space-y-1">
                      {participants.map((p) => (
                        <li key={p.id} className="flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2">
                          <span className="text-sm">{p.name}</span>
                          <button
                            onClick={() => awardStar(p.id, 1)}
                            className="rounded p-1 hover:bg-gray-700 transition-colors"
                            title="Award star"
                          >
                            <Star className="h-4 w-4 text-yellow-400" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {sidePanel === "quizzes" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Quiz Controls</h3>
                  {activeQuiz ? (
                    <div className="space-y-2">
                      <div className="rounded-lg bg-primary-600/20 border border-primary-600/40 p-3">
                        <p className="text-xs text-primary-300 mb-1">Active Quiz</p>
                        <p className="text-sm font-medium">{activeQuiz.question}</p>
                        <p className="text-xs text-gray-400 mt-2">{responseCount} responses</p>
                      </div>
                      <button
                        onClick={() => stopQuiz(activeQuiz.id)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        <Square className="h-4 w-4" />
                        End Quiz
                      </button>
                    </div>
                  ) : (
                    <QuizManager
                      quizzes={quizzes}
                      onStart={(quizId) => startQuiz(quizId)}
                      onStop={(quizId) => stopQuiz(quizId)}
                      isPresenter={true}
                    />
                  )}
                </div>
              )}

              {sidePanel === "leaderboard" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Leaderboard</h3>
                  <Leaderboard entries={leaderboard} />
                </div>
              )}

              {sidePanel === "notes" && currentSlide?.speakerNotes && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Speaker Notes</h3>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {currentSlide.speakerNotes}
                  </p>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg p-2 transition-colors ${
        active ? "bg-primary-600 text-white" : "hover:bg-gray-800 text-gray-400"
      }`}
      title={label}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
