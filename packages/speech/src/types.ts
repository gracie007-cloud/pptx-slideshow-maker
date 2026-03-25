export interface SpeechRecognizerOptions {
  language: string;
  sampleRate: number;
  onPartialResult?: (text: string) => void;
  onFinalResult?: (text: string) => void;
  onError?: (error: Error) => void;
}

export interface SpeechSynthesizerOptions {
  voice: string;
  speed: number;
  pitch: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export interface SpeechWorkerMessage {
  type: "init" | "audio-chunk" | "synthesize" | "stop";
  payload?: unknown;
}

export interface SpeechWorkerResponse {
  type: "ready" | "partial-result" | "final-result" | "audio-output" | "error";
  payload?: unknown;
}
