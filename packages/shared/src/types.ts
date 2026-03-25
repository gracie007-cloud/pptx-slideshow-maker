// ============================================================
// Core Domain Types
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Presentation {
  id: string;
  title: string;
  userId: string;
  sourceFile: string;
  slideCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Slide {
  id: string;
  presentationId: string;
  index: number;
  imagePath: string;
  textContent: string | null;
  speakerNotes: string | null;
  shapes: SlideShape[] | null;
  kenBurnsConfig: KenBurnsConfig | null;
}

export interface SlideShape {
  type: "text" | "image" | "shape";
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
}

export interface KenBurnsConfig {
  startScale: number;
  endScale: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
}

// ============================================================
// Quiz Types
// ============================================================

export type QuizType =
  | "MULTIPLE_CHOICE"
  | "WORD_CLOUD"
  | "SHORT_ANSWER"
  | "FILL_IN_BLANK"
  | "IMAGE_UPLOAD"
  | "DRAWING";

export interface Quiz {
  id: string;
  presentationId: string;
  slideId: string | null;
  type: QuizType;
  question: string;
  options: QuizOption[] | null;
  correctAnswer: string | null;
  timeLimit: number;
  points: number;
  order: number;
}

export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

// ============================================================
// Session Types
// ============================================================

export type SessionStatus = "WAITING" | "ACTIVE" | "PAUSED" | "ENDED";

export interface Session {
  id: string;
  presentationId: string;
  joinCode: string;
  status: SessionStatus;
  currentSlide: number;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
}

export interface Participant {
  id: string;
  sessionId: string;
  name: string;
  stars: number;
  level: number;
  joinedAt: Date;
}

export interface QuizResponse {
  id: string;
  quizId: string;
  sessionId: string;
  participantId: string;
  answer: unknown;
  isCorrect: boolean | null;
  responseTime: number | null;
  pointsAwarded: number;
  createdAt: Date;
}

// ============================================================
// Gamification Types
// ============================================================

export interface LeaderboardEntry {
  participantId: string;
  name: string;
  stars: number;
  level: number;
  rank: number;
}

export interface StarAward {
  participantId: string;
  count: number;
  reason: string;
}

// ============================================================
// Presenter Tools Types
// ============================================================

export type AnnotationTool =
  | "pen"
  | "highlighter"
  | "eraser"
  | "text"
  | "shape"
  | "laser";

export interface AnnotationConfig {
  tool: AnnotationTool;
  color: string;
  size: number;
  opacity: number;
}

export interface TimerConfig {
  duration: number;
  isCountdown: boolean;
  autoStart: boolean;
}

// ============================================================
// Speech Types
// ============================================================

export interface SpeechConfig {
  language: string;
  sampleRate: number;
}

export interface TTSConfig {
  voice: string;
  speed: number;
  pitch: number;
}

// ============================================================
// AI Quiz Generation Types
// ============================================================

export type AIProvider = "anthropic" | "openai";

export type BloomLevel =
  | "remember"
  | "understand"
  | "apply"
  | "analyze"
  | "evaluate"
  | "create";

export interface AIQuizRequest {
  slideText: string;
  quizType: QuizType;
  difficulty: BloomLevel;
  count: number;
  provider: AIProvider;
}

export interface AIQuizResult {
  questions: GeneratedQuestion[];
  provider: AIProvider;
}

export interface GeneratedQuestion {
  question: string;
  type: QuizType;
  options?: QuizOption[];
  correctAnswer?: string;
  explanation?: string;
  difficulty: BloomLevel;
}

// ============================================================
// PPTX Pipeline Types
// ============================================================

export interface PptxProcessResult {
  presentationId: string;
  title: string;
  slideCount: number;
  slides: ProcessedSlide[];
}

export interface ProcessedSlide {
  index: number;
  imagePath: string;
  textContent: string;
  speakerNotes: string;
  shapes: SlideShape[];
}

// ============================================================
// Analytics Types
// ============================================================

export interface SessionAnalytics {
  sessionId: string;
  totalParticipants: number;
  totalResponses: number;
  averageResponseTime: number;
  quizResults: QuizAnalytics[];
}

export interface QuizAnalytics {
  quizId: string;
  question: string;
  type: QuizType;
  totalResponses: number;
  correctCount: number;
  averageTime: number;
  answerDistribution: Record<string, number>;
}
