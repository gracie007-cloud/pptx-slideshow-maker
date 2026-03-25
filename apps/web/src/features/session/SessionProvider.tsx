"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  Quiz,
  LeaderboardEntry,
} from "@slideshow/shared";
import type { QuizResultData } from "@slideshow/shared";
import { createSocket } from "@/lib/socket";

export interface Participant {
  id: string;
  name: string;
}

export interface SessionState {
  sessionId: string | null;
  sessionCode: string | null;
  currentSlideIndex: number;
  participants: Participant[];
  participantCount: number;
  connected: boolean;
  activeQuiz: Quiz | null;
  quizResults: QuizResultData | null;
  responseCount: number;
  leaderboard: LeaderboardEntry[];
  timerDuration: number | null;
  timerRemaining: number | null;
}

export interface SessionContextValue extends SessionState {
  joinSession: (code: string, name: string) => void;
  leaveSession: () => void;
  navigateToSlide: (index: number) => void;
  startQuiz: (quizId: string) => void;
  stopQuiz: (quizId: string) => void;
  submitQuizResponse: (quizId: string, answer: string | string[] | number) => void;
  awardStar: (participantId: string, count: number) => void;
  startTimer: (duration: number) => void;
  stopTimer: () => void;
  drawAnnotation: (objects: string) => void;
  clearAnnotations: () => void;
  moveSpotlight: (x: number, y: number, radius: number, active: boolean) => void;
  toggleWhiteboard: (active: boolean) => void;
  spinNamePicker: () => void;
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSessionContext(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return ctx;
}

export interface SessionProviderProps {
  children: React.ReactNode;
  role?: "presenter" | "participant";
}

export default function SessionProvider({ children, role = "participant" }: SessionProviderProps) {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [state, setState] = useState<SessionState>({
    sessionId: null,
    sessionCode: null,
    currentSlideIndex: 0,
    participants: [],
    participantCount: 0,
    connected: false,
    activeQuiz: null,
    quizResults: null,
    responseCount: 0,
    leaderboard: [],
    timerDuration: null,
    timerRemaining: null,
  });

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      setState((prev) => ({ ...prev, connected: true }));
    });

    socket.on("disconnect", () => {
      setState((prev) => ({ ...prev, connected: false }));
    });

    socket.on("slide:changed", ({ slideIndex }) => {
      setState((prev) => ({ ...prev, currentSlideIndex: slideIndex }));
    });

    socket.on("session:participant-joined", ({ participantId, name, count }) => {
      setState((prev) => ({
        ...prev,
        participants: [...prev.participants.filter((p) => p.id !== participantId), { id: participantId, name }],
        participantCount: count,
      }));
    });

    socket.on("session:participant-left", ({ participantId, count }) => {
      setState((prev) => ({
        ...prev,
        participants: prev.participants.filter((p) => p.id !== participantId),
        participantCount: count,
      }));
    });

    socket.on("quiz:started", ({ quiz, timeLimit }) => {
      setState((prev) => ({
        ...prev,
        activeQuiz: quiz,
        quizResults: null,
        responseCount: 0,
        timerDuration: timeLimit,
        timerRemaining: timeLimit,
      }));
    });

    socket.on("quiz:ended", ({ quizId, results }) => {
      setState((prev) => ({
        ...prev,
        activeQuiz: null,
        quizResults: results,
        timerRemaining: null,
      }));
    });

    socket.on("quiz:response-count", ({ count }) => {
      setState((prev) => ({ ...prev, responseCount: count }));
    });

    socket.on("leaderboard:update", ({ entries }) => {
      setState((prev) => ({ ...prev, leaderboard: entries }));
    });

    socket.on("timer:started", ({ duration }) => {
      setState((prev) => ({ ...prev, timerDuration: duration, timerRemaining: duration }));
    });

    socket.on("timer:tick", ({ remaining }) => {
      setState((prev) => ({ ...prev, timerRemaining: remaining }));
    });

    socket.on("timer:stopped", () => {
      setState((prev) => ({ ...prev, timerRemaining: null, timerDuration: null }));
    });

    socket.connect();

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const emit = useCallback(
    <E extends keyof ClientToServerEvents>(
      event: E,
      ...args: Parameters<ClientToServerEvents[E]>
    ) => {
      if (socketRef.current?.connected) {
        (socketRef.current.emit as Function)(event, ...args);
      }
    },
    []
  );

  const joinSession = useCallback(
    (code: string, name: string) => {
      emit("session:join", { code, name });
      setState((prev) => ({ ...prev, sessionCode: code }));
    },
    [emit]
  );

  const leaveSession = useCallback(() => {
    emit("session:leave");
    setState((prev) => ({
      ...prev,
      sessionId: null,
      sessionCode: null,
      connected: false,
      participants: [],
      participantCount: 0,
    }));
  }, [emit]);

  const navigateToSlide = useCallback(
    (index: number) => {
      emit("slide:change", { slideIndex: index });
      setState((prev) => ({ ...prev, currentSlideIndex: index }));
    },
    [emit]
  );

  const startQuiz = useCallback((quizId: string) => emit("quiz:start", { quizId }), [emit]);
  const stopQuiz = useCallback((quizId: string) => emit("quiz:stop", { quizId }), [emit]);
  const submitQuizResponse = useCallback(
    (quizId: string, answer: string | string[] | number) => emit("quiz:respond", { quizId, answer }),
    [emit]
  );
  const awardStar = useCallback(
    (participantId: string, count: number) => emit("star:award", { participantId, count }),
    [emit]
  );
  const startTimer = useCallback((duration: number) => emit("timer:start", { duration }), [emit]);
  const stopTimer = useCallback(() => emit("timer:stop"), [emit]);
  const drawAnnotation = useCallback((objects: string) => emit("annotation:draw", { objects }), [emit]);
  const clearAnnotations = useCallback(() => emit("annotation:clear"), [emit]);
  const moveSpotlight = useCallback(
    (x: number, y: number, radius: number, active: boolean) =>
      emit("spotlight:move", { x, y, radius, active }),
    [emit]
  );
  const toggleWhiteboard = useCallback((active: boolean) => emit("whiteboard:toggle", { active }), [emit]);
  const spinNamePicker = useCallback(() => emit("name-picker:spin"), [emit]);

  const value: SessionContextValue = {
    ...state,
    joinSession,
    leaveSession,
    navigateToSlide,
    startQuiz,
    stopQuiz,
    submitQuizResponse,
    awardStar,
    startTimer,
    stopTimer,
    drawAnnotation,
    clearAnnotations,
    moveSpotlight,
    toggleWhiteboard,
    spinNamePicker,
    socket: socketRef.current,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
