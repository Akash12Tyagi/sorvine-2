"use client";

import type { HTMLAttributes, PointerEvent } from "react";

/** Glass card whose border and surface light up around the cursor. */
export function SpotlightCard({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div onPointerMove={onMove} className={`glass spotlight ${className}`} {...rest}>
      {children}
    </div>
  );
}
