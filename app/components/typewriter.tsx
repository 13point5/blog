"use client";

import { useEffect, useState } from "react";

/** Types `text` out once, then leaves a blinking caret. */
export function Typewriter({ text, speed = 55, delay = 0 }: { text: string; speed?: number; delay?: number }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    const still =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "off";
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      i = still ? text.length : i + 1;
      setN(i);
      if (i < text.length) timer = setTimeout(tick, speed);
    };
    timer = setTimeout(tick, still ? 0 : delay);
    return () => clearTimeout(timer);
  }, [text, speed, delay]);

  return (
    <span className="px-caret" aria-label={text}>
      <span aria-hidden="true">{text.slice(0, n)}</span>
    </span>
  );
}
