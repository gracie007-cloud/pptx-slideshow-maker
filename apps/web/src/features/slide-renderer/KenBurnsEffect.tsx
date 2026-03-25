"use client";

import React, { useMemo, useId } from "react";
import type { KenBurnsConfig } from "@slideshow/shared";

export interface KenBurnsEffectProps {
  imageSrc: string;
  config?: KenBurnsConfig;
  active?: boolean;
  className?: string;
}

const defaultConfig: KenBurnsConfig = {
  startScale: 1.0,
  endScale: 1.2,
  startX: 0,
  startY: 0,
  endX: -5,
  endY: -3,
  duration: 10,
};

export default function KenBurnsEffect({
  imageSrc,
  config = defaultConfig,
  active = true,
  className = "",
}: KenBurnsEffectProps) {
  const id = useId();
  const animName = `kb-${id.replace(/:/g, "")}`;

  const keyframes = useMemo(() => {
    return `
      @keyframes ${animName} {
        0% {
          transform: scale(${config.startScale}) translate(${config.startX}%, ${config.startY}%);
        }
        100% {
          transform: scale(${config.endScale}) translate(${config.endX}%, ${config.endY}%);
        }
      }
    `;
  }, [animName, config]);

  const animStyle: React.CSSProperties = active
    ? {
        animation: `${animName} ${config.duration}s ease-in-out infinite alternate`,
        transformOrigin: "center center",
      }
    : {
        transform: `scale(${config.startScale}) translate(${config.startX}%, ${config.startY}%)`,
      };

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />
      <img
        src={imageSrc}
        alt=""
        className="w-full h-full object-cover will-change-transform"
        style={animStyle}
        draggable={false}
      />
    </div>
  );
}
