import React, { useId } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function to merge Tailwind classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function StripedPattern({
  width = 40,
  height = 40,
  x = 0, // Added default value
  y = 0, // Added default value
  className,
  ...props
}) {
  const id = useId();

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-neutral-100 stroke-neutral-200",
        className
      )}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          {/* This path draws a diagonal line from bottom-left to top-right */}
          <path
            d={`M0 ${height}L${width} 0`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
    </svg>
  );
}

export default StripedPattern;