"use client";

import { useEffect, useState } from "react";

const CELLS = 20;

/** Reading progress as a segmented XP bar pinned to the bottom of the screen. */
export function ReadingProgress() {
  const [p, setP] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const filled = Math.round(p * CELLS);
  return (
    <div
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 px-window !shadow-none flex items-center gap-2 px-2 py-1"
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p * 100)}
    >
      <span className="d-xs" aria-hidden="true">XP</span>
      <span className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: CELLS }, (_, i) => (
          <span key={i} className={`w-1.5 sm:w-2 h-2.5 ${i < filled ? "bg-koi" : "bg-accent-light"}`} />
        ))}
      </span>
      <span className="d-xs w-9 text-right tabular-nums" aria-hidden="true">{Math.round(p * 100)}%</span>
    </div>
  );
}
