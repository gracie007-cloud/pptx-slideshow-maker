import type {
  Quiz,
  LeaderboardEntry,
  QuizType,
  QuizOption,
} from "./types";

// ============================================================
// Socket.io Event Types
// ============================================================

export interface ServerToClientEvents {
  // Slide navigation
  "slide:changed": (data: { slideIndex: number }) => void;

  // Quiz events
  "quiz:started": (data: {
    quiz: Quiz;
    timeLimit: number;
  }) => void;
  "quiz:ended": (data: {
    quizId: string;
    results: QuizResultData;
  }) => void;
  "quiz:response-count": (data: {
    quizId: string;
    count: number;
  }) => void;

  // Timer
  "timer:tick": (data: { remaining: number }) => void;
  "timer:started": (data: { duration: number }) => void;
  "timer:stopped": () => void;

  // Annotations
  "annotation:update": (data: {
    objects: string; // serialized Fabric.js objects
  }) => void;
  "annotation:clear": () => void;

  // Gamification
  "leaderboard:update": (data: {
    entries: LeaderboardEntry[];
  }) => void;
  "star:awarded": (data: {
    participantId: string;
    participantName: string;
    count: number;
    totalStars: number;
  }) => void;

  // Session management
  "session:participant-joined": (data: {
    participantId: string;
    name: string;
    count: number;
  }) => void;
  "session:participant-left": (data: {
    participantId: string;
    count: number;
  }) => void;
  "session:status-changed": (data: {
    status: "WAITING" | "ACTIVE" | "PAUSED" | "ENDED";
  }) => void;

  // Presenter tools
  "spotlight:update": (data: {
    x: number;
    y: number;
    radius: number;
    active: boolean;
  }) => void;
  "whiteboard:toggle": (data: { active: boolean }) => void;
  "name-picker:result": (data: {
    participantId: string;
    name: string;
  }) => void;

  // Speech
  "caption:update": (data: { text: string; isFinal: boolean }) => void;
}

export interface ClientToServerEvents {
  // Session
  "session:join": (data: {
    code: string;
    name: string;
  }) => void;
  "session:leave": () => void;

  // Slide navigation (presenter only)
  "slide:change": (data: { slideIndex: number }) => void;

  // Quiz (presenter triggers, audience responds)
  "quiz:start": (data: { quizId: string }) => void;
  "quiz:stop": (data: { quizId: string }) => void;
  "quiz:respond": (data: {
    quizId: string;
    answer: string | string[] | number;
  }) => void;

  // Annotations (presenter only)
  "annotation:draw": (data: { objects: string }) => void;
  "annotation:clear": () => void;

  // Gamification (presenter only)
  "star:award": (data: {
    participantId: string;
    count: number;
  }) => void;

  // Presenter tools
  "spotlight:move": (data: {
    x: number;
    y: number;
    radius: number;
    active: boolean;
  }) => void;
  "whiteboard:toggle": (data: { active: boolean }) => void;
  "name-picker:spin": () => void;

  // Timer (presenter only)
  "timer:start": (data: { duration: number }) => void;
  "timer:stop": () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  sessionId: string;
  participantId: string;
  role: "presenter" | "participant";
  name: string;
}

// ============================================================
// Quiz Result Types (used in events)
// ============================================================

export interface QuizResultData {
  quizId: string;
  type: QuizType;
  totalResponses: number;
  answerDistribution: Record<string, number>;
  correctAnswer?: string;
  wordCloudData?: WordCloudItem[];
}

export interface WordCloudItem {
  text: string;
  value: number;
}
