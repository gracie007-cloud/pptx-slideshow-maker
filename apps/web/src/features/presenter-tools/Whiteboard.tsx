"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Pen,
  Eraser,
  Trash2,
  X,
  Minus,
  Plus,
} from "lucide-react";

export interface WhiteboardProps {
  active: boolean;
  onToggle: () => void;
}

const COLORS = [
  "#000000",
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
];

export default function Whiteboard({ active, onToggle }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();

      // Save current drawing
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx?.drawImage(canvas, 0, 0);

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [active]);

  const getCanvasCoords = useCallback(
    (e: React.PointerEvent): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const pos = getCanvasCoords(e);
      setIsDrawing(true);
      lastPos.current = pos;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [getCanvasCoords]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !lastPos.current) return;

      const pos = getCanvasCoords(e);

      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = isEraser ? "#FFFFFF" : color;
      ctx.lineWidth = isEraser ? brushSize * 4 : brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = 1;
      ctx.stroke();

      lastPos.current = pos;
    },
    [isDrawing, color, brushSize, isEraser, getCanvasCoords]
  );

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-white"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-gray-700">
            Whiteboard
          </span>

          <div className="h-6 w-px bg-gray-200" />

          {/* Drawing tool */}
          <button
            onClick={() => setIsEraser(false)}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              !isEraser
                ? "bg-blue-100 text-blue-700"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Pen className="h-4 w-4" />
            Pen
          </button>

          {/* Eraser */}
          <button
            onClick={() => setIsEraser(true)}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              isEraser
                ? "bg-blue-100 text-blue-700"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Eraser className="h-4 w-4" />
            Eraser
          </button>

          <div className="h-6 w-px bg-gray-200" />

          {/* Colors */}
          <div className="flex items-center gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setIsEraser(false);
                }}
                className={`h-6 w-6 rounded-full border-2 transition-transform ${
                  color === c && !isEraser
                    ? "border-gray-800 scale-110"
                    : "border-gray-200 hover:scale-105"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="h-6 w-px bg-gray-200" />

          {/* Brush size */}
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setBrushSize((s) => Math.max(1, s - 2))
              }
              className="rounded p-1 text-gray-500 hover:bg-gray-100"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-xs text-gray-500 tabular-nums">
              {brushSize}px
            </span>
            <button
              onClick={() =>
                setBrushSize((s) => Math.min(30, s + 2))
              }
              className="rounded p-1 text-gray-500 hover:bg-gray-100"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-200" />

          {/* Clear */}
          <button
            onClick={handleClear}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        </div>

        <button
          onClick={onToggle}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <X className="h-4 w-4" />
          Close
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 ${
            isEraser ? "cursor-cell" : "cursor-crosshair"
          }`}
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
    </motion.div>
  );
}
