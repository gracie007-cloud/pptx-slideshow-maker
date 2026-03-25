"use client";

import { useState, useCallback, useEffect } from "react";
import type { Quiz, QuizResponse } from "@slideshow/shared";
import { useSocket } from "./useSocket";

interface UseQuizReturn {
  activeQuiz: Quiz | null;
  responses: QuizResponse[];
  startQuiz: (quizId: string) => void;
  stopQuiz: (quizId: string) => void;
  submitResponse: (quizId: string, answer: string | string[] | number) => void;
}

/**
 * Manages quiz state via socket events.
 * Listens for quiz:started and quiz:ended events, and provides
 * methods to start, stop, and respond to quizzes.
 */
export function useQuiz(sessionId?: string): UseQuizReturn {
  const { emit, on, isConnected } = useSocket(sessionId);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [responses, setResponses] = useState<QuizResponse[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    on("quiz:started", (data) => {
      setActiveQuiz(data.quiz);
      setResponses([]);
    });

    on("quiz:ended", () => {
      setActiveQuiz(null);
      // TODO: Fetch final responses from API for analytics
    });

    // TODO: Listen for quiz:response-count to update response tracking
  }, [isConnected, on]);

  const startQuiz = useCallback(
    (quizId: string) => {
      emit("quiz:start", { quizId });
    },
    [emit]
  );

  const stopQuiz = useCallback(
    (quizId: string) => {
      emit("quiz:stop", { quizId });
    },
    [emit]
  );

  const submitResponse = useCallback(
    (quizId: string, answer: string | string[] | number) => {
      emit("quiz:respond", { quizId, answer });
      // TODO: Optimistically add response to local state
    },
    [emit]
  );

  return {
    activeQuiz,
    responses,
    startQuiz,
    stopQuiz,
    submitResponse,
  };
}
