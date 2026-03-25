"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Trophy, Wifi, WifiOff } from "lucide-react";
import type { Slide, Quiz } from "@slideshow/shared";
import { useSessionContext } from "./SessionProvider";
import SlideCanvas from "../slide-renderer/SlideCanvas";
import TransitionEngine from "../slide-renderer/TransitionEngine";
import MultipleChoice from "../quiz/MultipleChoice";
import ShortAnswer from "../quiz/ShortAnswer";
import FillInBlank from "../quiz/FillInBlank";
import WordCloud from "../quiz/WordCloud";
import ResponseVisualizer from "../quiz/ResponseVisualizer";
import LevelBadge from "../gamification/LevelBadge";

export interface AudienceViewProps {
  sessionCode: string;
  participantId: string;
  participantName: string;
  slides: Slide[];
}

export default function AudienceView({
  sessionCode,
  participantId,
  participantName,
  slides,
}: AudienceViewProps) {
  const {
    currentSlideIndex,
    connected,
    activeQuiz,
    quizResults,
    submitQuizResponse,
    timerRemaining,
  } = useSessionContext();

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [stars, setStars] = useState(0);
  const [level, setLevel] = useState(1);
  const [showStarAnimation, setShowStarAnimation] = useState(false);
  const [transitionDir, setTransitionDir] = useState<"left" | "right">("right");
  const [prevSlideIndex, setPrevSlideIndex] = useState(0);

  const currentSlide = slides[currentSlideIndex] ?? null;

  useEffect(() => {
    setTransitionDir(currentSlideIndex > prevSlideIndex ? "right" : "left");
    setPrevSlideIndex(currentSlideIndex);
  }, [currentSlideIndex, prevSlideIndex]);

  useEffect(() => {
    if (activeQuiz) {
      setHasSubmitted(false);
    }
  }, [activeQuiz?.id]);

  const handleSubmitResponse = (quizId: string, answer: string | string[] | number) => {
    submitQuizResponse(quizId, answer);
    setHasSubmitted(true);
  };

  const renderQuizUI = () => {
    if (!activeQuiz) return null;

    if (hasSubmitted) {
      return (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4 p-8"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-800">Answer Submitted!</p>
          <p className="text-sm text-gray-500">Waiting for results...</p>
        </motion.div>
      );
    }

    const commonProps = {
      quiz: activeQuiz,
      disabled: hasSubmitted,
    };

    switch (activeQuiz.type) {
      case "MULTIPLE_CHOICE":
        return (
          <MultipleChoice
            {...commonProps}
            onSubmit={(answer) => handleSubmitResponse(activeQuiz.id, answer)}
            showResults={false}
          />
        );
      case "SHORT_ANSWER":
        return (
          <ShortAnswer
            {...commonProps}
            onSubmit={(answer) => handleSubmitResponse(activeQuiz.id, answer)}
          />
        );
      case "FILL_IN_BLANK":
        return (
          <FillInBlank
            {...commonProps}
            onSubmit={(answer) => handleSubmitResponse(activeQuiz.id, answer)}
          />
        );
      case "WORD_CLOUD":
        return (
          <WordCloud
            {...commonProps}
            onSubmit={(answer) => handleSubmitResponse(activeQuiz.id, answer)}
            words={[]}
          />
        );
      default:
        return (
          <div className="p-4 text-center text-gray-500">
            <p>Unsupported quiz type: {activeQuiz.type}</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-800">{participantName}</span>
          <LevelBadge level={level} stars={stars} showProgress />
        </div>

        <div className="flex items-center gap-3">
          {timerRemaining !== null && (
            <div className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-600">
              {Math.floor(timerRemaining / 60)}:{(timerRemaining % 60).toString().padStart(2, "0")}
            </div>
          )}

          <div className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
            {connected ? (
              <>
                <Wifi className="h-3 w-3" />
                <span>Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-red-500" />
                <span className="text-red-600">Disconnected</span>
              </>
            )}
          </div>

          <div className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
            {sessionCode}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {activeQuiz ? (
            <motion.div
              key="quiz"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flex flex-1 flex-col items-center justify-center p-4"
            >
              <div className="w-full max-w-lg">
                <div className="mb-4 text-center">
                  <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                    {activeQuiz.type.replace(/_/g, " ")}
                  </span>
                </div>
                {renderQuizUI()}
              </div>
            </motion.div>
          ) : quizResults ? (
            <motion.div
              key="results"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flex flex-1 flex-col items-center justify-center p-4"
            >
              <div className="w-full max-w-lg">
                <h3 className="mb-4 text-center text-lg font-bold text-gray-800">Results</h3>
                <ResponseVisualizer results={quizResults} quizType={quizResults.type} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="slide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1"
            >
              <TransitionEngine
                slideKey={currentSlideIndex}
                transitionType="fade"
                direction={transitionDir}
              >
                <SlideCanvas
                  slide={currentSlide}
                  slideIndex={currentSlideIndex}
                  totalSlides={slides.length}
                  showControls={false}
                />
              </TransitionEngine>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Star animation overlay */}
      <AnimatePresence>
        {showStarAnimation && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="flex flex-col items-center gap-2">
              <Star className="h-24 w-24 text-yellow-400 fill-yellow-400" />
              <span className="text-2xl font-bold text-yellow-500">+1 Star!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
