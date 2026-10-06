"use client";

import { useEffect, useRef, useState } from "react";
import type { HeroPost } from "../themed-hero";
import { CoverArt } from "./cover";
import { Interior } from "./interior";

/*
 * The Marauder's Map. It rests folded, showing its cover. Tapping it (after
 * the incantation) swings the gatefold open, and the inside inks itself
 * outward from the centre while footprints start to wander. "Mischief
 * managed." folds it shut again.
 */

type Phase = "closed" | "open" | "closing";

const INCANTATION = "I solemnly swear that I am up to no good.";

export function MaraudersMap({ posts }: { posts: HeroPost[] }) {
  const [reduceMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [phase, setPhase] = useState<Phase>("closed");
  const [tick, setTick] = useState(0);
  // Each opening remounts the inside so the ink spreads afresh.
  const [opened, setOpened] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Footprints only walk while the map is open, once the ink has spread.
  useEffect(() => {
    if (phase !== "open" || reduceMotion) return;
    let id: number | undefined;
    const start = window.setTimeout(() => {
      id = window.setInterval(() => setTick((n) => n + 1), 340);
    }, 2600);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(id);
    };
  }, [phase, reduceMotion]);

  // On narrow screens the map pans; keep it centred under the folded cover.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, []);

  useEffect(() => {
    if (phase !== "closing") return;
    const id = window.setTimeout(() => setPhase("closed"), reduceMotion ? 0 : 1100);
    return () => window.clearTimeout(id);
  }, [phase, reduceMotion]);

  const open = () => {
    setOpened((n) => n + 1);
    setPhase("open");
  };

  return (
    <section className={`mm mm-${phase} ${reduceMotion ? "is-static" : ""}`} aria-label="The Marauder's Map">
      <div className="mm-frame">
        <div ref={scrollRef} className="mm-scroll">
          <div className="mm-interior" inert={phase !== "open"}>
            <Interior key={opened} posts={posts} tick={tick} animate={!reduceMotion} />
          </div>
        </div>

        <button
          type="button"
          className="mm-cover"
          onClick={open}
          disabled={phase !== "closed"}
          aria-label="Open the Marauder's Map"
        >
          <span className="mm-cover-half mm-cover-left">
            <CoverArt prefix="mmc-l" half="left" />
          </span>
          <span className="mm-cover-half mm-cover-right">
            <CoverArt prefix="mmc-r" half="right" />
          </span>
        </button>
      </div>

      <div className="mm-footer">
        {phase === "open" ? (
          <>
            <p className="mm-hint">← drag to explore →</p>
            <button type="button" className="mm-managed" onClick={() => setPhase("closing")}>
              Mischief managed.
            </button>
          </>
        ) : (
          <p className="mm-incantation" aria-label={`${INCANTATION} Tap the map to open it.`}>
            <span className="mm-words" aria-hidden="true">
              {INCANTATION.split("").map((ch, i) => (
                <span key={i} style={{ animationDelay: `${0.4 + i * 0.04}s` }}>
                  {ch}
                </span>
              ))}
            </span>
            <span className="mm-tap" aria-hidden="true">
              tap the map
            </span>
          </p>
        )}
      </div>
    </section>
  );
}
