"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Eraser, Trash2, Send, Check, Minus, Plus } from "lucide-react";
import type { Quiz } from "@slideshow/shared";

export interface DrawingCanvasProps {
  quiz: Quiz;
  onSubmit: (dataUrl: string) => void;
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
  "#FFFFFF",
];

const BRUSH_SIZES = [2, 4, 8, 12, 20];

export default function DrawingCanvas({ quiz, onSubmit }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const width = 600;
  const height = 400;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
  }, []);

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      let clientX: number, clientY: number;
      if ("touches" in e) {
        clientX = e.touches[0]?.clientX ?? 0;
        clientY = e.touches[0]?.clientY ?? 0;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (submitted) return;
      e.preventDefault();
      const pos = getCanvasCoords(e);
      setIsDrawing(true);
      lastPos.current = pos;
      setHasDrawn(true);
    },
    [submitted, getCanvasCoords]
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || submitted) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !lastPos.current) return;

      const pos = getCanvasCoords(e);

      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = isEraser ? "#FFFFFF" : color;
      ctx.lineWidth = isEraser ? brushSize * 3 : brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      lastPos.current = pos;
    },
    [isDrawing, submitted, color, brushSize, isEraser, getCanvasCoords]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }, []);

  const handleSubmit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || submitted) return;
    const dataUrl = canvas.toDataURL("image/png");
    setSubmitted(true);
    onSubmit(dataUrl);
  }, [submitted, onSubmit]);

  const currentSizeIndex = BRUSH_SIZES.indexOf(brushSize);

  const decreaseSize = () => {
    if (currentSizeIndex > 0) {
      setBrushSize(BRUSH_SIZES[currentSizeIndex - 1]);
    }
  };

  const increaseSize = () => {
    if (currentSizeIndex < BRUSH_SIZES.length - 1) {
      setBrushSize(BRUSH_SIZES[currentSizeIndex + 1]);
    }
  };

  return (
    <div className="mx-auto flex flex-col items-center gap-4 p-4">
      <h2 className="text-xl font-bold text-gray-900 text-center">
        {quiz.question}
      </h2>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        {/* Color picker */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setIsEraser(false);
              }}
              className={`h-7 w-7 rounded-full border-2 transition-transform ${
                color === c && !isEraser
                  ? "border-gray-800 scale-110"
                  : "border-gray-200 hover:scale-105"
              }`}
              style={{ backgroundColor: c }}
              disabled={submitted}
            />
          ))}
        </div>

        <div className="h-6 w-px bg-gray-200" />

        {/* Brush size */}
        <div className="flex items-center gap-1">
          <button
            onClick={decreaseSize}
            disabled={currentSizeIndex <= 0 || submitted}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center">
            <div
              className="rounded-full bg-gray-800"
              style={{
                width: `${Math.max(brushSize, 4)}px`,
                height: `${Math.max(brushSize, 4)}px`,
              }}
            />
          </div>
          <button
            onClick={increaseSize}
            disabled={
              currentSizeIndex >= BRUSH_SIZES.length - 1 || submitted
            }
            className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-gray-200" />

        {/* Eraser */}
        <button
          onClick={() => setIsEraser(!isEraser)}
          disabled={submitted}
          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            isEraser
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Eraser className="h-4 w-4" />
          Eraser
        </button>

        {/* Clear */}
        <button
          onClick={handleClear}
          disabled={submitted}
          className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
          Clear
        </button>
      </div>

      {/* Canvas */}
      <div
        className={`overflow-hidden rounded-2xl border-2 shadow-sm ${
          submitted ? "border-green-300" : "border-gray-200"
        }`}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="block max-w-full cursor-crosshair bg-white"
          style={{ touchAction: "none" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Submit button */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!hasDrawn}
          className="flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="h-4 w-4" />
          Submit Drawing
        </button>
      )}

      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm font-medium text-green-600"
        >
          <Check className="h-4 w-4" />
          Drawing submitted!
        </motion.div>
      )}
    </div>
  );
}
