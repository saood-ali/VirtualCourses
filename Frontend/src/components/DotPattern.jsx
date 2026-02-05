"use client";

import React, { useEffect, useId, useRef, useState, useMemo } from "react";
import { motion } from "motion/react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function DotPattern({
  width = 16,
  height = 16,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  glow = false,
  ...props
}) {
  const id = useId();
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const dots = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return [];

    const numCols = Math.ceil(dimensions.width / width);
    const totalDots = numCols * Math.ceil(dimensions.height / height);

    return Array.from({ length: totalDots }, (_, i) => {
      const col = i % numCols;
      const row = Math.floor(i / numCols);
      
      // deterministic randomness to satisfy linter "pure function" rules
      const pseudoRandomDelay = Math.abs(Math.sin(i * 132.45)) * 5; 
      const pseudoRandomDuration = Math.abs(Math.cos(i * 54.32)) * 3 + 2;

      return {
        x: col * width + cx,
        y: row * height + cy,
        delay: pseudoRandomDelay,
        duration: pseudoRandomDuration,
      };
    });
  }, [dimensions, width, height, cx, cy]); // FIX 2: Removed x, y from dependencies

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-neutral-400/80",
        className
      )}
      {...props}
    >
      <defs>
        <radialGradient id={`${id}-gradient`}>
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      {dots.map((dot) => (
        <motion.circle
          key={`${dot.x}-${dot.y}`}
          cx={dot.x}
          cy={dot.y}
          r={cr}
          fill={glow ? `url(#${id}-gradient)` : "currentColor"}
          className="text-neutral-400/80"
          initial={glow ? { opacity: 0.4, scale: 1 } : {}}
          animate={
            glow
              ? {
                  opacity: [0.4, 1, 0.4],
                  scale: [1, 1.5, 1],
                }
              : {}
          }
          transition={
            glow
              ? {
                  duration: dot.duration,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: dot.delay,
                  ease: "easeInOut",
                }
              : {}
          }
        />
      ))}
    </svg>
  );
}