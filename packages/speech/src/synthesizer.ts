/**
 * Text-to-Speech using sherpa-onnx WASM via Web Worker.
 *
 * Stub implementation — full integration with sherpa-onnx WASM
 * will be implemented in Phase 3.
 */

import type { SpeechSynthesizerOptions } from "./types";

export class SpeechSynthesizer {
  private worker: Worker | null = null;
  private options: SpeechSynthesizerOptions;
  private audioContext: AudioContext | null = null;

  constructor(options: SpeechSynthesizerOptions) {
    this.options = options;
  }

  async initialize(): Promise<void> {
    // TODO: Load sherpa-onnx WASM TTS module in Web Worker
    this.audioContext = new AudioContext();
    console.log("[speech] Synthesizer initialized (stub)");
  }

  async speak(text: string): Promise<void> {
    this.options.onStart?.();

    // TODO: Send text to Web Worker, receive audio buffer, play via AudioContext
    console.log(`[speech] Speaking: "${text}" (stub)`);

    // Simulate speech duration
    await new Promise((resolve) =>
      setTimeout(resolve, text.length * 50)
    );

    this.options.onEnd?.();
  }

  stop(): void {
    // TODO: Stop current audio playback
    console.log("[speech] Speech stopped (stub)");
  }

  destroy(): void {
    this.stop();
    this.audioContext?.close();
    this.audioContext = null;
    this.worker?.terminate();
    this.worker = null;
  }
}
