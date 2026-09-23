"use client";

import { useEffect, useRef } from "react";

/** A pencil across the top of the viewport that grows as you read. */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = ref.current;
    const target = document.getElementById(targetId);
    if (!bar || !target) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = target.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress =
        total <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / total));
      bar.style.setProperty("--progress", progress.toFixed(4));
      bar.style.setProperty("--progress-visible", progress > 0.005 ? "1" : "0");
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetId]);

  return <div ref={ref} className="progress-pencil" aria-hidden="true" />;
}
