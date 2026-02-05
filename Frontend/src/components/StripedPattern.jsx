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
  direction = "left",
  className,
  ...props
}) {
  const id = useId();
  const w = Number(width);
  const h = Number(height);

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-0 h-full w-full stroke-neutral-200/50 stroke-[1]",
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <pattern id={id} width={w} height={h} patternUnits="userSpaceOnUse">
          {direction === "left" ? (
            <>
              <line x1="0" y1={h} x2={w} y2="0" stroke="currentColor" />
              <line x1={-w} y1={h} x2="0" y2="0" stroke="currentColor" />
              <line x1={w} y1={h} x2={w * 2} y2="0" stroke="currentColor" />
            </>
          ) : (
            <>
              <line x1="0" y1="0" x2={w} y2={h} stroke="currentColor" />
              <line x1={-w} y1="0" x2="0" y2={h} stroke="currentColor" />
              <line x1={w} y1="0" x2={w * 2} y2={h} stroke="currentColor" />
            </>
          )}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}