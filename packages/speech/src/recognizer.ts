/**
 * Speech-to-Text using sherpa-onnx WASM via Web Worker.
 *
 * Stub implementation — full integration with sherpa-onnx WASM
 * will be implemented in Phase 3.
 */

import type { SpeechRecognizerOptions } from "./types";

export class SpeechRecognizer {
  private worker: Worker | null = null;
  private options: SpeechRecognizerOptions;
  private mediaStream: MediaStream | null = null;
  private isListening = false;

  constructor(options: SpeechRecognizerOptions) {
    this.options = options;
  }

  async initialize(): Promise<void> {
    // TODO: Load sherpa-onnx WASM module in Web Worker
    // this.worker = new Worker(new URL("./worker.ts", import.meta.url));
    console.log("[speech] Recognizer initialized (stub)");
  }

  async startListening(): Promise<void> {
    if (this.isListening) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.options.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      this.isListening = true;

      // TODO: Create AudioWorklet to process audio chunks
      // and send them to the Web Worker for recognition
      console.log("[speech] Listening started (stub)");
    } catch (err) {
      this.options.onError?.(err as Error);
    }
  }

  stopListening(): void {
    if (!this.isListening) return;

    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
    this.isListening = false;
    console.log("[speech] Listening stopped (stub)");
  }

  destroy(): void {
    this.stopListening();
    this.worker?.terminate();
    this.worker = null;
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}
