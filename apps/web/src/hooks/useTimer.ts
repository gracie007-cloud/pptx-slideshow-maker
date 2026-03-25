"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseTimerReturn {
  timeRemaining: number;
  isRunning: boolean;
  start: (durationSeconds?: number) => void;
  stop: () => void;
  reset: (durationSeconds?: number) => void;
}

/**
 * Timer hook supporting both countdown and countup modes.
 * @param initialDuration - Initial duration in seconds (0 for countup)
 * @param isCountdown - If true, counts down from duration. If false, counts up.
 * @param onComplete - Callback fired when countdown reaches 0.
 */
export function useTimer(
  initialDuration = 30,
  isCountdown = true,
  onComplete?: () => void
): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref fresh
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (durationSeconds?: number) => {
      clearTimer();

      if (durationSeconds !== undefined) {
        setTimeRemaining(durationSeconds);
      }

      setIsRunning(true);

      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (isCountdown) {
            const next = prev - 1;
            if (next <= 0) {
              clearTimer();
              setIsRunning(false);
              onCompleteRef.current?.();
              return 0;
            }
            return next;
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    },
    [isCountdown, clearTimer]
  );

  const stop = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const reset = useCallback(
    (durationSeconds?: number) => {
      clearTimer();
      setIsRunning(false);
      setTimeRemaining(durationSeconds ?? initialDuration);
    },
    [initialDuration, clearTimer]
  );

  return {
    timeRemaining,
    isRunning,
    start,
    stop,
    reset,
  };
}
