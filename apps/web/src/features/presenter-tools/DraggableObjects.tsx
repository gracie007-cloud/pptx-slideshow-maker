"use client";

import React, { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";

export interface DraggableObject {
  id: string;
  content: React.ReactNode;
  x: number;
  y: number;
}

export interface DraggableObjectsProps {
  objects: DraggableObject[];
  onDrag: (id: string, x: number, y: number) => void;
  onDrop: (id: string, x: number, y: number) => void;
}

interface DragState {
  id: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

export default function DraggableObjects({
  objects,
  onDrag,
  onDrop,
}: DraggableObjectsProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const dragState = useRef<DragState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getObjPos = (obj: DraggableObject) => {
    return positions[obj.id] ?? { x: obj.x, y: obj.y };
  };

  const handlePointerDown = useCallback(
    (obj: DraggableObject, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const pos = getObjPos(obj);
      dragState.current = {
        id: obj.id,
        startX: pos.x,
        startY: pos.y,
        offsetX: e.clientX - pos.x,
        offsetY: e.clientY - pos.y,
      };
      setDraggingId(obj.id);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [positions]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.current) return;

      const { id, offsetX, offsetY } = dragState.current;
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;

      setPositions((prev) => ({
        ...prev,
        [id]: { x: newX, y: newY },
      }));

      onDrag(id, newX, newY);
    },
    [onDrag]
  );

  const handlePointerUp = useCallback(() => {
    if (!dragState.current) return;

    const { id } = dragState.current;
    const pos = positions[id];
    if (pos) {
      onDrop(id, pos.x, pos.y);
    }

    setDraggingId(null);
    dragState.current = null;
  }, [positions, onDrop]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {objects.map((obj) => {
        const pos = getObjPos(obj);
        const isDragging = draggingId === obj.id;

        return (
          <motion.div
            key={obj.id}
            className={`absolute cursor-grab select-none rounded-lg border bg-white/90 p-3 shadow-sm transition-shadow ${
              isDragging
                ? "border-blue-400 shadow-lg cursor-grabbing z-50"
                : "border-gray-200 hover:border-blue-300 hover:shadow-md z-10"
            }`}
            style={{ left: pos.x, top: pos.y }}
            animate={
              isDragging
                ? { scale: 1.05 }
                : { scale: 1 }
            }
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="flex items-start gap-2">
              <div
                className="flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
                onPointerDown={(e) => handlePointerDown(obj, e)}
              >
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="min-w-0">{obj.content}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
