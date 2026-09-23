"use client";

import { useRef, useState } from "react";
import Image from "next/image";

/**
 * Hero cartridge. The avatar is the label art; its background matches the
 * label paper so the character looks printed on. Tilts toward the pointer,
 * blinks every few seconds, and blinks on demand when poked.
 */
export function Cartridge() {
  const ref = useRef<HTMLButtonElement>(null);
  const [poked, setPoked] = useState(false);
  const [tilting, setTilting] = useState(false);

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    setTilting(false);
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
    el.style.setProperty("--lift", "0px");
    el.style.setProperty("--glare", "0");
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilting(true);
    el.style.setProperty("--tilt-x", `${(-y * 14).toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${(x * 16).toFixed(2)}deg`);
    el.style.setProperty("--lift", "-6px");
    el.style.setProperty("--glare", "1");
    el.style.setProperty("--glare-x", `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--glare-y", `${((y + 0.5) * 100).toFixed(1)}%`);
  };

  const poke = () => {
    setPoked(false);
    requestAnimationFrame(() => setPoked(true));
  };

  return (
    <div className="cart-stage">
      <button
        ref={ref}
        type="button"
        className="cart"
        data-poked={poked}
        data-tilting={tilting}
        onPointerMove={onPointerMove}
        onPointerLeave={reset}
        onClick={poke}
        onAnimationEnd={(e) => {
          if (e.animationName === "blink-once") setPoked(false);
        }}
        aria-label="Sriraam's avatar printed on a game cartridge label. Press to make the avatar blink."
      >
        <span className="cart-shell" aria-hidden="true">
          <span className="cart-plate">
            13point5 <em>POCKET</em>
          </span>
          <span className="cart-grip" />
          <span className="cart-recess">
            <span className="cart-label">
              <span className="cart-avatar">
                <Image
                  src="/avatar.png"
                  alt=""
                  width={1000}
                  height={1000}
                  priority
                  sizes="(min-width: 768px) 320px, 70vw"
                />
                <span className="eyelid eyelid-l" />
                <span className="eyelid eyelid-r" />
              </span>
              <span className="cart-badge">RL-ENV</span>
              <span className="cart-side cart-side-r">THIS SIDE OUT</span>
              <span className="cart-title">
                sri
                <br />
                raam
                <small>vol. 13.5</small>
              </span>
            </span>
          </span>
          <span className="cart-arrow" />
        </span>
        <span className="cart-glare" aria-hidden="true" />
      </button>
    </div>
  );
}
