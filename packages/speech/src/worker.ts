/**
 * Web Worker for sherpa-onnx WASM speech processing.
 *
 * Runs speech recognition and synthesis off the main thread
 * to avoid blocking the UI.
 *
 * Stub implementation — Phase 3.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx = self as any;

interface WorkerMessage {
  type: "init" | "audio-chunk" | "synthesize" | "stop";
  payload?: unknown;
}

ctx.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case "init":
      // TODO: Initialize sherpa-onnx WASM module
      // Load model files from IndexedDB cache or fetch from server
      ctx.postMessage({ type: "ready" });
      break;

    case "audio-chunk":
      // TODO: Process audio chunk through recognizer
      // Return partial/final transcription results
      break;

    case "synthesize":
      // TODO: Convert text to audio buffer
      // Return audio samples to main thread
      break;

    case "stop":
      // TODO: Clean up recognizer/synthesizer state
      break;

    default:
      console.warn(`[speech-worker] Unknown message type: ${type}`);
  }
};
