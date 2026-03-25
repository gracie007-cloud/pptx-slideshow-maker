// Re-export all shared types
export type {
  User,
  Presentation,
  Slide,
  SlideShape,
  KenBurnsConfig,
  QuizType,
  Quiz,
  QuizOption,
  SessionStatus,
  Session,
  Participant,
  QuizResponse,
  LeaderboardEntry,
  StarAward,
  AnnotationTool,
  AnnotationConfig,
  TimerConfig,
  SpeechConfig,
  TTSConfig,
  AIProvider,
  BloomLevel,
  AIQuizRequest,
  AIQuizResult,
  GeneratedQuestion,
  PptxProcessResult,
  ProcessedSlide,
  SessionAnalytics,
  QuizAnalytics,
} from "@slideshow/shared";

export type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  QuizResultData,
  WordCloudItem,
} from "@slideshow/shared";

// ============================================================
// Web-specific types
// ============================================================

/** Authenticated user in the web app (extends shared User with auth fields) */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string;
}

/** Presentation list item returned from the API */
export interface PresentationListItem {
  id: string;
  title: string;
  slideCount: number;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
}

/** Upload progress tracking */
export interface UploadProgress {
  fileName: string;
  progress: number; // 0-100
  status: "pending" | "uploading" | "processing" | "complete" | "error";
  error?: string;
}

/** Session with participant count for list views */
export interface SessionListItem {
  id: string;
  presentationId: string;
  presentationTitle: string;
  joinCode: string;
  status: "WAITING" | "ACTIVE" | "PAUSED" | "ENDED";
  participantCount: number;
  createdAt: string;
}
