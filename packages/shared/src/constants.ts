// Slide dimensions (16:9 at 1920x1080)
export const SLIDE_WIDTH = 1920;
export const SLIDE_HEIGHT = 1080;
export const SLIDE_ASPECT_RATIO = 16 / 9;

// Session join code
export const JOIN_CODE_LENGTH = 6;
export const JOIN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

// Quiz defaults
export const DEFAULT_QUIZ_TIME_LIMIT = 30; // seconds
export const DEFAULT_QUIZ_POINTS = 1;
export const MAX_QUIZ_TIME_LIMIT = 300; // 5 minutes

// Gamification
export const LEVEL_THRESHOLDS = [0, 5, 15, 30, 50, 80, 120, 170, 230, 300];
export const STAR_VALUES = { easy: 1, medium: 2, hard: 3 };

// Ken Burns defaults
export const DEFAULT_KEN_BURNS: {
  startScale: number;
  endScale: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
} = {
  startScale: 1.0,
  endScale: 1.2,
  startX: 0,
  startY: 0,
  endX: -5,
  endY: -3,
  duration: 10,
};

// Annotation defaults
export const DEFAULT_PEN_COLOR = "#FF0000";
export const DEFAULT_PEN_SIZE = 3;
export const DEFAULT_HIGHLIGHTER_COLOR = "#FFFF00";
export const DEFAULT_HIGHLIGHTER_SIZE = 20;
export const DEFAULT_HIGHLIGHTER_OPACITY = 0.4;

// API endpoints
export const PPTX_PIPELINE_ENDPOINTS = {
  process: "/process",
  extractText: "/extract-text",
  health: "/health",
} as const;

// Socket.io namespaces
export const SOCKET_NAMESPACE = {
  session: "/session",
} as const;

// File upload limits
export const MAX_PPTX_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_IMAGE_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_PPTX_TYPES = [
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
];
