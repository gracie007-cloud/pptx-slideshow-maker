"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// TODO: Import from @slideshow/speech once package is properly bundled for client use
// import { SpeechRecognizer, SpeechSynthesizer } from "@slideshow/speech";

interface UseSpeechReturn {
  transcript: string;
  isListening: boolean;
  startListening: (language?: string) => void;
  stopListening: () => void;
  speak: (text: string) => void;
  isSpeaking: boolean;
}

/**
 * Speech hook wrapping @slideshow/speech package.
 * Provides speech-to-text and text-to-speech functionality.
 */
export function useSpeech(): UseSpeechReturn {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // TODO: Replace with SpeechRecognizer / SpeechSynthesizer instances
  const recognizerRef = useRef<unknown>(null);
  const synthesizerRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Initialize browser SpeechSynthesis as a fallback
    if (typeof window !== "undefined") {
      synthesizerRef.current = window.speechSynthesis;
    }

    return () => {
      // Clean up any active speech
      synthesizerRef.current?.cancel();
    };
  }, []);

  const startListening = useCallback((language = "en-US") => {
    // TODO: Initialize SpeechRecognizer from @slideshow/speech
    // For now, use the Web Speech API as fallback
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognizerRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (recognizerRef.current) {
      (recognizerRef.current as any).stop();
      setIsListening(false);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!synthesizerRef.current) return;

    // Cancel any ongoing speech
    synthesizerRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // TODO: Configure voice, speed, pitch from TTSConfig

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesizerRef.current.speak(utterance);
  }, []);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    speak,
    isSpeaking,
  };
}
