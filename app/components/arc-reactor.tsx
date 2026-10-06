"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { HeroPost } from "./themed-hero";

/*
 * A JARVIS-style HUD built around an arc reactor. The reactor boots up
 * (rings trace in, coils light one by one, the core flares), tilts toward the
 * pointer, and clicking it "synthesizes a new element" — swapping the Mark I
 * ring core for the Mark VI triangle. Four callouts wire the reactor to the
 * rest of the site: bio, research, blog and comms.
 */

const COILS = 10;

const PROFILE: [string, string][] = [
  ["NAME", "SRIRAAM RAJA"],
  ["ROLE", "APPLIED RESEARCHER"],
  ["UNIT", "POST-TRAINING // CHAKRA LABS"],
  ["BUILDS", "RL ENVIRONMENTS, TASKS, EVALS"],
  ["ORIGIN", "LEARNING SCIENCE // HARVARD"],
  ["OFF-DUTY", "HOGWARTS, ANIME, K-DRAMAS"],
];

const SUBSYSTEMS = [
  "Sample efficiency",
  "Continual learning",
  "Human simulation",
  "Mech interp + RL",
  "World models & neural RL envs",
  "Sycophancy & adaptive reasoning",
];

const SOCIALS = [
  { label: "TWITTER", href: "https://x.com/27upon2" },
  { label: "GITHUB", href: "https://github.com/13point5" },
  { label: "LINKEDIN", href: "https://www.linkedin.com/in/13point5" },
];

function delay(s: number): CSSProperties {
  return { "--d": `${s}s` } as CSSProperties;
}

function Reactor({ mark }: { mark: 1 | 6 }) {
  return (
    <svg viewBox="-210 -210 420 420" className="ar-svg" aria-hidden="true">
      <defs>
        <radialGradient id="ar-core">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.3" stopColor="#d6fdff" />
          <stop offset="0.62" stopColor="#38e1ff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#0a3d55" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ar-metal">
          <stop offset="0.55" stopColor="#0d141b" />
          <stop offset="0.86" stopColor="#2b3846" />
          <stop offset="1" stopColor="#11181f" />
        </radialGradient>
        <filter id="ar-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="ar-bloom" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>

      <circle r={150} className="ar-bloom" filter="url(#ar-bloom)" />

      {/* housing */}
      <circle r={198} fill="url(#ar-metal)" className="ar-housing" />
      <circle r={198} pathLength={1} className="ar-trace ar-rim" style={delay(0)} />
      <circle r={186} pathLength={1} className="ar-trace ar-rim-inner" style={delay(0.25)} />
      {Array.from({ length: COILS }, (_, i) => (
        <circle
          key={i}
          r={3.4}
          cx={Math.cos(((i + 0.5) * 2 * Math.PI) / COILS) * 192}
          cy={Math.sin(((i + 0.5) * 2 * Math.PI) / COILS) * 192}
          className="ar-bolt"
          style={delay(0.4 + i * 0.05)}
        />
      ))}

      {/* rotating tick ring */}
      <g className="ar-spin">
        {Array.from({ length: 72 }, (_, i) => (
          <line
            key={i}
            y1={-178}
            y2={i % 6 === 0 ? -168 : -173}
            transform={`rotate(${i * 5})`}
            className="ar-tick"
            style={delay(0.5 + i * 0.008)}
          />
        ))}
      </g>
      <g className="ar-spin-rev">
        <circle r={162} className="ar-dash" filter="url(#ar-glow)" />
      </g>

      {/* coils */}
      {Array.from({ length: COILS }, (_, i) => (
        <g key={i} transform={`rotate(${(i * 360) / COILS})`}>
          <rect x={-16} y={-154} width={32} height={46} rx={4} className="ar-coil" />
          {Array.from({ length: 5 }, (_, k) => (
            <line key={k} x1={-15} x2={15} y1={-147 + k * 8} y2={-147 + k * 8} className="ar-wire" />
          ))}
          <rect
            x={-16}
            y={-154}
            width={32}
            height={46}
            rx={4}
            className="ar-coil-glow"
            filter="url(#ar-glow)"
            style={delay(0.9 + i * 0.11)}
          />
        </g>
      ))}

      {/* inner rings */}
      <circle r={104} className="ar-inner-ring" />
      <circle r={94} pathLength={1} className="ar-trace ar-cyan" filter="url(#ar-glow)" style={delay(1.6)} />
      {Array.from({ length: COILS }, (_, i) => (
        <line
          key={i}
          y1={-104}
          y2={-110}
          transform={`rotate(${(i * 360) / COILS})`}
          className="ar-spoke"
        />
      ))}

      {/* element: Mark I ring or Mark VI triangle */}
      <g className={`ar-element ${mark === 6 ? "is-vi" : ""}`}>
        <circle r={74} className="ar-ring-i" filter="url(#ar-glow)" />
        <polygon points="0,78 -67.5,-39 67.5,-39" className="ar-tri" filter="url(#ar-glow)" />
      </g>

      {/* core */}
      <circle r={66} fill="url(#ar-core)" className="ar-core" />
      <circle r={22} className="ar-core-hot" filter="url(#ar-glow)" />
    </svg>
  );
}

function Callout({
  n,
  title,
  side,
  children,
  style,
}: {
  n: string;
  title: string;
  side: "left" | "right";
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`ar-callout ar-callout-${side}`}
      style={{ ...style, "--o": Number(n) } as CSSProperties}
    >
      <div className="ar-callout-head">
        <span className="ar-n">{n}</span>
        <span>{title}</span>
      </div>
      <div className="ar-callout-body">{children}</div>
    </div>
  );
}

function Panel({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <div className="ar-panel" id={id}>
      <div className="ar-panel-title">
        <span className="ar-dot" />
        {title}
      </div>
      {children}
    </div>
  );
}

const PROFILE_CHARS = PROFILE.reduce((n, [, v]) => n + v.length, 0);
// Where each profile value starts in the typed-out character stream.
const PROFILE_STARTS = PROFILE.map((_, i) =>
  PROFILE.slice(0, i).reduce((n, [, v]) => n + v.length, 0)
);

export function ArcReactor({ posts }: { posts: HeroPost[] }) {
  const [reduceMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [mark, setMark] = useState<1 | 6>(1);
  const [pulses, setPulses] = useState<number[]>([]);
  const [typed, setTyped] = useState(reduceMotion ? PROFILE_CHARS : 0);
  const [now, setNow] = useState(() => new Date());
  const tiltRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Type the profile out once the reactor has spun up.
  useEffect(() => {
    if (reduceMotion) return;
    const start = window.setTimeout(() => {
      typingRef.current = window.setInterval(
        () => setTyped((n) => Math.min(n + 2, PROFILE_CHARS)),
        28
      );
    }, 1800);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(typingRef.current);
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (typed >= PROFILE_CHARS) window.clearInterval(typingRef.current);
  }, [typed]);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || e.pointerType !== "mouse") return;
    const el = tiltRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--tilt-x", `${(-y * 14).toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${(x * 14).toFixed(2)}deg`);
  };

  const onPointerLeave = () => {
    tiltRef.current?.style.setProperty("--tilt-x", "0deg");
    tiltRef.current?.style.setProperty("--tilt-y", "0deg");
  };

  const synthesize = () => {
    setMark((m) => (m === 1 ? 6 : 1));
    const id = Date.now();
    setPulses((p) => [...p.slice(-2), id]);
    window.setTimeout(() => setPulses((p) => p.filter((x) => x !== id)), 1200);
  };

  const latest = posts[0];

  return (
    <section className={`ar ${reduceMotion ? "is-static" : ""}`} aria-label="Arc reactor HUD">
      <div className="ar-statusbar">
        <span>J.A.R.V.I.S. // SRIRAAM.ME</span>
        <span className="ar-clock">{now.toLocaleTimeString("en-GB")}</span>
        <span className="ar-power">
          PWR <i /> 100%
        </span>
      </div>

      <div className="ar-stage">
        <div className="ar-col">
          <Callout n="01" title="BIO" side="left" style={delay(2.2)}>
            <a href="#bio">Applied Researcher on post-training →</a>
          </Callout>
          <Callout n="03" title="FLIGHT LOGS" side="left" style={delay(2.5)}>
            {latest ? (
              <Link href={`/blog/${latest.slug}`}>{latest.title} →</Link>
            ) : (
              <Link href="/blog">All entries →</Link>
            )}
          </Callout>
        </div>

        <div
          ref={tiltRef}
          className="ar-reactor-wrap"
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
        >
          <button
            type="button"
            className="ar-reactor"
            onClick={synthesize}
            aria-label={`Arc reactor, Mark ${mark === 1 ? "I" : "VI"}. Click to swap the core element.`}
          >
            <Reactor mark={mark} />
            {pulses.map((id) => (
              <span key={id} className="ar-pulse" />
            ))}
          </button>
          <p className="ar-caption">
            MARK {mark === 1 ? "I" : "VI"} <span>·</span> click core to synthesize new element
          </p>
        </div>

        <div className="ar-col">
          <Callout n="02" title="RESEARCH" side="right" style={delay(2.35)}>
            <a href="#ar-research">{SUBSYSTEMS.length} subsystems online →</a>
          </Callout>
          <Callout n="04" title="COMMS" side="right" style={delay(2.65)}>
            <span className="ar-socials">
              {SOCIALS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              ))}
            </span>
          </Callout>
        </div>
      </div>

      <div className="ar-panels">
        <Panel title="SUBJECT PROFILE">
          <dl className="ar-profile">
            {PROFILE.map(([k, v], i) => {
              const count = typed - PROFILE_STARTS[i];
              const shown = v.slice(0, Math.max(0, count));
              // The caret sits on the line being typed, then rests on the last one.
              const typing =
                (count > 0 && count < v.length) ||
                (i === PROFILE.length - 1 && count >= v.length);
              return (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>
                    {shown}
                    {typing && <span className="ar-caret" />}
                  </dd>
                </div>
              );
            })}
          </dl>
        </Panel>

        <Panel title="RESEARCH SUBSYSTEMS" id="ar-research">
          <ul className="ar-systems">
            {SUBSYSTEMS.map((s, i) => (
              <li key={s} style={delay(2.4 + i * 0.18)}>
                <span className="ar-sys-name">{s}</span>
                <span className="ar-bar">
                  {Array.from({ length: 12 }, (_, k) => (
                    <i key={k} style={delay(2.5 + i * 0.18 + k * 0.04)} />
                  ))}
                </span>
                <span className="ar-sys-status">ONLINE</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </section>
  );
}
