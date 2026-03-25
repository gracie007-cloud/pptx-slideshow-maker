"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";

export interface SpotlightProps {
  active: boolean;
  onMove: (data: { x: number; y: number; radius: number }) => void;
}

export default function Spotlight({ active, onMove }: SpotlightProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [radius, setRadius] = useState(150);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const newPos = { x: e.clientX, y: e.clientY };
      setPosition(newPos);
      onMove({ ...newPos, radius });
    },
    [radius, onMove]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      setRadius((prev) => {
        const newRadius = Math.max(50, Math.min(400, prev - e.deltaY * 0.5));
        onMove({ x: position.x, y: position.y, radius: newRadius });
        return newRadius;
      });
    },
    [position, onMove]
  );

  useEffect(() => {
    if (!active) return;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [active, handleMouseMove, handleWheel]);

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 cursor-none"
      style={{
        background: `radial-gradient(circle ${radius}px at ${position.x}px ${position.y}px, transparent 0%, transparent 80%, rgba(0,0,0,0.85) 100%)`,
      }}
    >
      {/* Spotlight ring indicator */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: position.x - radius,
          top: position.y - radius,
          width: radius * 2,
          height: radius * 2,
        }}
      >
        <div className="h-full w-full rounded-full border border-white/20" />
      </div>

      {/* Hint text */}
      <div className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/60 px-4 py-2 text-xs text-white/60">
        Scroll to resize | ESC to exit
      </div>
    </div>
  );
}
