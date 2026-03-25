"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";

export interface TimerProps {
  duration: number;
  onComplete?: () => void;
  onStart?: () => void;
  onStop?: () => void;
}

export default function Timer({
  duration,
  onComplete,
  onStart,
  onStop,
}: TimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const [running, setRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalSeconds = duration;
  const progress = remaining / totalSeconds;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  // Circle SVG dimensions
  const circleSize = 200;
  const strokeWidth = 8;
  const circleRadius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference * (1 - progress);

  const getColor = () => {
    if (progress > 0.5) return "#22C55E";
    if (progress > 0.25) return "#F97316";
    return "#EF4444";
  };

  useEffect(() => {
    setRemaining(duration);
  }, [duration]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setRunning(false);
          onComplete?.();
          if (soundEnabled) {
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 800;
              gain.gain.setValueAtTime(0.3, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.5);
            } catch {
              // Audio not available
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, soundEnabled, onComplete]);

  const handleStart = useCallback(() => {
    if (remaining <= 0) setRemaining(duration);
    setRunning(true);
    onStart?.();
  }, [remaining, duration, onStart]);

  const handleStop = useCallback(() => {
    setRunning(false);
    onStop?.();
  }, [onStop]);

  const handleReset = useCallback(() => {
    setRunning(false);
    setRemaining(duration);
    onStop?.();
  }, [duration, onStop]);

  const isWarning = progress <= 0.25 && progress > 0;
  const isComplete = remaining === 0;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Circular progress */}
      <div className="relative" style={{ width: circleSize, height: circleSize }}>
        <svg
          width={circleSize}
          height={circleSize}
          className="-rotate-90 transform"
        >
          {/* Background circle */}
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={circleRadius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <motion.circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={circleRadius}
            fill="none"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: "linear" }}
          />
        </svg>

        {/* Center time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`font-mono text-5xl font-bold tabular-nums ${
              isComplete
                ? "text-gray-300"
                : isWarning
                ? "text-red-500"
                : "text-gray-900"
            }`}
            animate={
              isWarning && running
                ? { scale: [1, 1.05, 1] }
                : { scale: 1 }
            }
            transition={
              isWarning ? { repeat: Infinity, duration: 1 } : {}
            }
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </motion.span>
          {isComplete && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-medium text-gray-400"
            >
              Time's up!
            </motion.span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {running ? (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 rounded-xl bg-yellow-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-yellow-600 transition-colors shadow-sm"
          >
            <Pause className="h-4 w-4" />
            Pause
          </button>
        ) : (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 rounded-xl bg-green-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-600 transition-colors shadow-sm"
          >
            <Play className="h-4 w-4" />
            {isComplete ? "Restart" : remaining < duration ? "Resume" : "Start"}
          </button>
        )}

        <button
          onClick={handleReset}
          className="flex items-center gap-2 rounded-xl bg-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-300 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`rounded-xl p-2.5 transition-colors ${
            soundEnabled
              ? "bg-blue-100 text-blue-600"
              : "bg-gray-100 text-gray-400"
          }`}
          title={soundEnabled ? "Sound on" : "Sound off"}
        >
          {soundEnabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
