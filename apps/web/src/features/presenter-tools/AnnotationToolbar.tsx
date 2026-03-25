"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pen,
  Highlighter,
  Eraser,
  Type,
  Circle,
  MousePointer2,
  Palette,
  X,
  Minus,
  Plus,
} from "lucide-react";
import type { AnnotationTool } from "@slideshow/shared";
import {
  DEFAULT_PEN_COLOR,
  DEFAULT_PEN_SIZE,
  DEFAULT_HIGHLIGHTER_COLOR,
  DEFAULT_HIGHLIGHTER_SIZE,
  DEFAULT_HIGHLIGHTER_OPACITY,
} from "@slideshow/shared";

export interface AnnotationData {
  tool: AnnotationTool;
  color: string;
  size: number;
  opacity: number;
}

export interface AnnotationToolbarProps {
  onDraw: (data: AnnotationData) => void;
  onClear: () => void;
  active: boolean;
}

const TOOL_CONFIG: {
  id: AnnotationTool;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: "pen", label: "Pen", icon: <Pen className="h-4 w-4" /> },
  {
    id: "highlighter",
    label: "Highlighter",
    icon: <Highlighter className="h-4 w-4" />,
  },
  { id: "eraser", label: "Eraser", icon: <Eraser className="h-4 w-4" /> },
  { id: "text", label: "Text", icon: <Type className="h-4 w-4" /> },
  { id: "shape", label: "Shape", icon: <Circle className="h-4 w-4" /> },
  {
    id: "laser",
    label: "Laser",
    icon: <MousePointer2 className="h-4 w-4" />,
  },
];

const COLOR_PALETTE = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#000000",
  "#FFFFFF",
  "#6B7280",
];

export default function AnnotationToolbar({
  onDraw,
  onClear,
  active,
}: AnnotationToolbarProps) {
  const [activeTool, setActiveTool] = useState<AnnotationTool>("pen");
  const [color, setColor] = useState(DEFAULT_PEN_COLOR);
  const [size, setSize] = useState(DEFAULT_PEN_SIZE);
  const [opacity, setOpacity] = useState(1);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleToolChange = useCallback(
    (tool: AnnotationTool) => {
      setActiveTool(tool);
      if (tool === "highlighter") {
        setColor(DEFAULT_HIGHLIGHTER_COLOR);
        setSize(DEFAULT_HIGHLIGHTER_SIZE);
        setOpacity(DEFAULT_HIGHLIGHTER_OPACITY);
      } else if (tool === "pen") {
        setColor(DEFAULT_PEN_COLOR);
        setSize(DEFAULT_PEN_SIZE);
        setOpacity(1);
      }
      onDraw({ tool, color, size, opacity });
    },
    [color, size, opacity, onDraw]
  );

  const handleColorChange = useCallback(
    (newColor: string) => {
      setColor(newColor);
      setShowColorPicker(false);
      onDraw({ tool: activeTool, color: newColor, size, opacity });
    },
    [activeTool, size, opacity, onDraw]
  );

  const handleSizeChange = useCallback(
    (delta: number) => {
      const newSize = Math.max(1, Math.min(50, size + delta));
      setSize(newSize);
      onDraw({ tool: activeTool, color, size: newSize, opacity });
    },
    [activeTool, color, size, opacity, onDraw]
  );

  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
    >
      <div className="flex items-center gap-1 rounded-2xl border border-gray-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-sm">
        {/* Tool buttons */}
        {TOOL_CONFIG.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolChange(tool.id)}
            title={tool.label}
            className={`relative flex items-center justify-center rounded-xl p-2.5 transition-all ${
              activeTool === tool.id
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            {tool.icon}
            {activeTool === tool.id && (
              <motion.div
                layoutId="active-tool"
                className="absolute inset-0 rounded-xl bg-blue-500"
                style={{ zIndex: -1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            )}
          </button>
        ))}

        <div className="mx-1 h-8 w-px bg-gray-200" />

        {/* Color picker button */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center gap-1 rounded-xl p-2 hover:bg-gray-100 transition-colors"
            title="Color"
          >
            <Palette className="h-4 w-4 text-gray-500" />
            <div
              className="h-5 w-5 rounded-full border-2 border-gray-300 shadow-sm"
              style={{ backgroundColor: color }}
            />
          </button>

          <AnimatePresence>
            {showColorPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-1/2 mb-3 -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
              >
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleColorChange(c)}
                      className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        color === c
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-200"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mx-1 h-8 w-px bg-gray-200" />

        {/* Size slider */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleSizeChange(-2)}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
            title="Decrease size"
          >
            <Minus className="h-3 w-3" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center">
            <div
              className="rounded-full bg-gray-800"
              style={{
                width: `${Math.max(4, Math.min(size, 20))}px`,
                height: `${Math.max(4, Math.min(size, 20))}px`,
              }}
            />
          </div>
          <button
            onClick={() => handleSizeChange(2)}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
            title="Increase size"
          >
            <Plus className="h-3 w-3" />
          </button>
          <span className="ml-1 text-xs text-gray-400 tabular-nums w-6">
            {size}
          </span>
        </div>

        <div className="mx-1 h-8 w-px bg-gray-200" />

        {/* Clear button */}
        <button
          onClick={onClear}
          className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
          title="Clear all annotations"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      </div>
    </motion.div>
  );
}
