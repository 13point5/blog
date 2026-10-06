"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { HeroPost } from "./themed-hero";

/*
 * A hand-inked Marauder's Map of the site. Every room is a section of
 * sriraam.me: the Great Hall is the bio, the Library is the blog, the Room of
 * Requirement holds the research interests, and so on. Strokes draw themselves
 * in (pathLength=1 + stroke-dashoffset), labels bleed in like ink, and two sets
 * of footprints wander the corridors.
 */

type Pt = [number, number];

const VIEW_W = 1200;
const VIEW_H = 840;

// Animation timing helpers: `--d` is the delay, `--dur` the draw duration.
function t(delay: number, dur = 1.4): CSSProperties {
  return { "--d": `${delay}s`, "--dur": `${dur}s` } as CSSProperties;
}

/* ---------- geometry ---------- */

type Door = { side: "t" | "r" | "b" | "l"; at: number; w?: number };

// Rectangle walls with gaps cut where corridors meet them.
function roomPath(x: number, y: number, w: number, h: number, doors: Door[] = []) {
  const sides = {
    t: { len: w, pt: (s: number): Pt => [x + s, y], param: (a: number) => a - x },
    r: { len: h, pt: (s: number): Pt => [x + w, y + s], param: (a: number) => a - y },
    b: { len: w, pt: (s: number): Pt => [x + w - s, y + h], param: (a: number) => x + w - a },
    l: { len: h, pt: (s: number): Pt => [x, y + h - s], param: (a: number) => y + h - a },
  };
  let path = "";
  (Object.keys(sides) as Door["side"][]).forEach((key) => {
    const side = sides[key];
    const gaps = doors
      .filter((door) => door.side === key)
      .map((door) => {
        const c = side.param(door.at);
        const half = (door.w ?? 24) / 2;
        return [c - half, c + half] as const;
      })
      .sort((a, b) => a[0] - b[0]);
    let start = 0;
    for (const [g0, g1] of [...gaps, [side.len, side.len] as const]) {
      if (g0 > start) {
        const [ax, ay] = side.pt(start);
        const [bx, by] = side.pt(g0);
        path += `M${ax} ${ay}L${bx} ${by}`;
      }
      start = g1;
    }
  });
  return path;
}

// Square-wave battlements along a horizontal wall.
function battlements(x0: number, x1: number, y: number, dir: 1 | -1) {
  let p = `M${x0} ${y}`;
  for (let x = x0; x + 24 <= x1; x += 24) {
    p += `v${-8 * dir}h12v${8 * dir}h12`;
  }
  return p;
}

type Step = { x: number; y: number; angle: number; left: boolean };

function buildSteps(route: Pt[], spacing = 19): Step[] {
  const steps: Step[] = [];
  let carry = 0;
  let left = true;
  const loop = [...route, route[0]];
  for (let i = 0; i < loop.length - 1; i++) {
    const [ax, ay] = loop[i];
    const [bx, by] = loop[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    const ux = (bx - ax) / len;
    const uy = (by - ay) / len;
    const angle = (Math.atan2(uy, ux) * 180) / Math.PI;
    let s = carry;
    for (; s < len; s += spacing) {
      const side = left ? -1 : 1;
      steps.push({
        x: ax + ux * s - uy * 4.5 * side,
        y: ay + uy * s + ux * 4.5 * side,
        angle,
        left,
      });
      left = !left;
    }
    carry = s - len;
  }
  return steps;
}

/* ---------- pieces ---------- */

function Ink({
  d,
  delay,
  dur,
  className = "",
  ...rest
}: { d: string; delay: number; dur?: number; className?: string } & React.SVGProps<SVGPathElement>) {
  return (
    <path
      d={d}
      pathLength={1}
      className={`mm-draw ${className}`}
      style={t(delay, dur)}
      {...rest}
    />
  );
}

function Write({
  x,
  y,
  delay,
  children,
  className = "",
  size = 15,
  anchor = "middle",
}: {
  x: number;
  y: number;
  delay: number;
  children: ReactNode;
  className?: string;
  size?: number;
  anchor?: "start" | "middle" | "end";
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      textAnchor={anchor}
      className={`mm-write ${className}`}
      style={t(delay)}
    >
      {children}
    </text>
  );
}

// A ribbon banner label, the way the map names its rooms.
function Banner({
  x,
  y,
  w,
  text,
  delay,
  size = 17,
}: {
  x: number;
  y: number;
  w: number;
  text: string;
  delay: number;
  size?: number;
}) {
  const h = 26;
  const l = x - w / 2;
  const r = x + w / 2;
  const top = y - h / 2;
  const bot = y + h / 2;
  const ty1 = top + 7;
  const ty2 = bot + 7;
  const tail = 16;
  const leftTail = `M${l + 10} ${ty1}L${l - tail} ${ty1}L${l - tail + 7} ${(ty1 + ty2) / 2}L${l - tail} ${ty2}L${l + 10} ${ty2}Z`;
  const rightTail = `M${r - 10} ${ty1}L${r + tail} ${ty1}L${r + tail - 7} ${(ty1 + ty2) / 2}L${r + tail} ${ty2}L${r - 10} ${ty2}Z`;
  const band = `M${l} ${top}Q${x} ${top - 5} ${r} ${top}L${r} ${bot}Q${x} ${bot - 5} ${l} ${bot}Z`;
  return (
    <g className="mm-banner">
      {[leftTail, rightTail, band].map((p, i) => (
        <path
          key={i}
          d={p}
          pathLength={1}
          className="mm-draw mm-paper"
          style={t(delay + i * 0.08, 0.9)}
        />
      ))}
      <Write x={x} y={y + size * 0.34} delay={delay + 0.5} size={size} className="mm-sc">
        {text}
      </Write>
    </g>
  );
}

function Footprints({
  steps,
  tick,
  name,
  offset,
}: {
  steps: Step[];
  tick: number;
  name: string;
  offset: number;
}) {
  const TRAIL = 9;
  const head = (tick + offset) % steps.length;
  const trail = Array.from({ length: TRAIL }, (_, k) => {
    const i = (head - k + steps.length) % steps.length;
    return { step: steps[i], k };
  });
  const lead = steps[head];
  const tagW = name.length * 7.6 + 16;
  return (
    <g className="mm-walker" aria-hidden="true">
      {trail.map(({ step, k }) => (
        <g
          key={`${head}-${k}`}
          transform={`translate(${step.x} ${step.y}) rotate(${step.angle})`}
          opacity={1 - k / TRAIL}
        >
          <ellipse cx={2.2} cy={0} rx={4.4} ry={2.7} />
          <ellipse cx={-4.6} cy={0} rx={2.3} ry={2.1} />
        </g>
      ))}
      <g transform={`translate(${lead.x} ${lead.y - 20})`} className="mm-nametag">
        <path
          d={`M${-tagW / 2} -9H${tagW / 2}V9H6L0 15L-6 9H${-tagW / 2}Z`}
        />
        <text y={4} textAnchor="middle" fontSize={12.5}>
          {name}
        </text>
      </g>
    </g>
  );
}

/* ---------- the map ---------- */

const INTERESTS: [string, string][] = [
  ["Sample", "efficiency"],
  ["Continual", "learning"],
  ["Human", "simulation"],
  ["Mech interp", "+ RL"],
  ["World models &", "neural RL envs"],
  ["Sycophancy &", "adaptive reasoning"],
];

const SOCIALS = [
  { label: "twitter", href: "https://x.com/27upon2" },
  { label: "github", href: "https://github.com/13point5" },
  { label: "linkedin", href: "https://www.linkedin.com/in/13point5" },
];

// Walkers' routes run along corridor centre lines.
const ROUTE_SRIRAAM: Pt[] = [
  [600, 398],
  [560, 372],
  [425, 360],
  [330, 372],
  [250, 440],
  [245, 525],
  [250, 615],
  [330, 632],
  [425, 630],
  [540, 648],
  [600, 610],
  [600, 520],
  [600, 440],
];

const ROUTE_QWEN: Pt[] = [
  [955, 455],
  [955, 525],
  [940, 600],
  [870, 640],
  [775, 630],
  [680, 650],
  [600, 600],
  [600, 500],
  [630, 420],
  [700, 372],
  [775, 360],
  [880, 365],
  [930, 410],
];

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
}

function MapDrawing({ posts, animate }: { posts: HeroPost[]; animate: boolean }) {
  const stepsA = useMemo(() => buildSteps(ROUTE_SRIRAAM), []);
  const stepsB = useMemo(() => buildSteps(ROUTE_QWEN), []);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!animate) return;
    let id: number | undefined;
    // Let the ink settle before anyone starts walking about.
    const start = window.setTimeout(() => {
      id = window.setInterval(() => setTick((n) => n + 1), 330);
    }, 3200);
    return () => {
      window.clearTimeout(start);
      if (id) window.clearInterval(id);
    };
  }, [animate]);

  const shown = posts.slice(0, 3);

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="mm-svg"
      role="group"
      aria-label="The Marauder's Map of sriraam.me"
    >
      <defs>
        <filter id="mm-rough" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="1.5" />
        </filter>
      </defs>

      <g filter="url(#mm-rough)">
        {/* ---- title cartouche ---- */}
        <g>
          <Ink d="M410 22H790V178H410Z" delay={0.1} dur={1.6} />
          <Ink d="M420 32H780V168H420Z" delay={0.3} dur={1.6} className="mm-faint" />
          {[
            [410, 22, 1, 1],
            [790, 22, -1, 1],
            [410, 178, 1, -1],
            [790, 178, -1, -1],
          ].map(([cx, cy, sx, sy], i) => (
            <Ink
              key={i}
              d={`M${cx} ${cy + 26 * sy}c${-14 * sx} 0 ${-20 * sx} ${-14 * sy} ${-10 * sx} ${-22 * sy}s${22 * sx} ${-6 * sy} ${22 * sx} ${-14 * sy}c${10 * sx} ${-8 * sy} ${22 * sx} ${-2 * sy} ${12 * sx} ${8 * sy}`}
              delay={0.9 + i * 0.1}
              dur={0.8}
            />
          ))}
          <Write x={600} y={56} delay={0.6} size={15} className="mm-it">
            Messrs. Reward, Policy, Rollout &amp; Gradient
          </Write>
          <Write x={600} y={76} delay={0.8} size={13} className="mm-it">
            Purveyors of Aids to Magical Model-Makers
          </Write>
          <Write x={600} y={96} delay={1.0} size={13} className="mm-it">
            are proud to present
          </Write>
          <Write x={600} y={138} delay={1.3} size={31} className="mm-sc mm-title">
            The Marauder&apos;s Map
          </Write>
          <Write x={600} y={160} delay={1.6} size={14} className="mm-it">
            of sriraam.me
          </Write>
        </g>

        {/* ---- outer castle wall ---- */}
        <Ink d="M60 200H1140V740H60Z" delay={0} dur={2.6} className="mm-thick" />
        <Ink d="M70 210H1130V730H70Z" delay={0.3} dur={2.6} className="mm-faint" />
        <Ink d={battlements(84, 400, 200, 1)} delay={0.8} dur={1.6} />
        <Ink d={battlements(804, 1120, 200, 1)} delay={0.8} dur={1.6} />
        <Ink d={battlements(84, 1120, 740, -1)} delay={1.0} dur={2} />
        {[
          [60, 200],
          [1140, 200],
          [60, 740],
          [1140, 740],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r={24} pathLength={1} className="mm-draw mm-paper" style={t(0.5 + i * 0.15, 1)} />
            <circle cx={cx} cy={cy} r={15} pathLength={1} className="mm-draw mm-faint" style={t(0.7 + i * 0.15, 1)} />
          </g>
        ))}

        {/* ---- corridors ---- */}
        <g>
          {/* upper east-west */}
          <Ink d="M390 350H460M390 370H460" delay={1.8} dur={0.7} />
          <Ink d="M740 350H810M740 370H810" delay={1.9} dur={0.7} />
          {/* lower east-west */}
          <Ink d="M390 620H460M390 640H460" delay={2.0} dur={0.7} />
          <Ink d="M740 620H810M740 640H810" delay={2.1} dur={0.7} />
          {/* north-south */}
          <Ink d="M235 490V560M255 490V560" delay={2.0} dur={0.7} />
          <Ink d="M945 490V560M965 490V560" delay={2.1} dur={0.7} />
          {/* the staircase that likes to change */}
          <Ink d="M584 420V560M616 420V560" delay={2.2} dur={0.9} />
          <Ink
            d={Array.from({ length: 13 }, (_, i) => `M584 ${428 + i * 10.5}H616`).join("")}
            delay={2.6}
            dur={1}
            className="mm-faint"
          />
          <Write x={630} y={500} delay={3.0} size={11.5} anchor="start" className="mm-it mm-note">
            staircase
          </Write>
          <Write x={630} y={514} delay={3.1} size={11.5} anchor="start" className="mm-it mm-note">
            (moves on Fridays)
          </Write>
          {/* tower bridges */}
          <Ink d="M180 178V200M200 178V200" delay={2.3} dur={0.5} />
          <Ink d="M1000 178V200M1020 178V200" delay={2.3} dur={0.5} />
        </g>

        {/* ---- The Great Hall: bio ---- */}
        <a href="#bio" className="mm-room" aria-label="The Great Hall: about Sriraam">
          <rect x={460} y={240} width={280} height={180} className="mm-floor" />
          <Ink
            d={roomPath(460, 240, 280, 180, [
              { side: "l", at: 360 },
              { side: "r", at: 360 },
              { side: "b", at: 600, w: 32 },
            ])}
            delay={0.8}
            dur={1.6}
            className="mm-thick"
          />
          <Ink d="M500 258H700" delay={1.6} dur={0.7} />
          <Ink
            d={[518, 568, 632, 682].map((x) => `M${x} 368V408M${x + 8} 368V408`).join("")}
            delay={1.8}
            dur={0.9}
            className="mm-faint"
          />
          <Banner x={600} y={284} w={200} text="The Great Hall" delay={2.0} />
          <Write x={600} y={322} delay={2.6} size={17} className="mm-it">
            hey — I&apos;m Sriraam
          </Write>
          <Write x={600} y={342} delay={2.8} size={13.5}>
            Applied Researcher, post-training
          </Write>
          <Write x={600} y={359} delay={2.9} size={13.5}>
            @ Chakra Labs
          </Write>
        </a>

        {/* ---- The Library: blog ---- */}
        <g>
          <Link href="/blog" className="mm-room" aria-label="The Library: all blog posts">
            <rect x={100} y={240} width={290} height={250} className="mm-floor" />
            <Ink
              d={roomPath(100, 240, 290, 250, [
                { side: "r", at: 360 },
                { side: "b", at: 245 },
              ])}
              delay={1.0}
              dur={1.6}
              className="mm-thick"
            />
            {/* shelves */}
            <Ink
              d={[0, 1, 2, 3].map((i) => `M${116 + i * 28} 420V476`).join("")}
              delay={2.2}
              dur={0.8}
            />
            <Ink
              d={[0, 1, 2, 3].map((i) => `M${122 + i * 28} 420V476`).join("")}
              delay={2.3}
              dur={0.8}
              className="mm-faint"
            />
            <Banner x={245} y={268} w={160} text="The Library" delay={2.1} />
            <Write x={245} y={298} delay={2.6} size={14} className="mm-it">
              ~ where the blog is kept ~
            </Write>
          </Link>
          {shown.map((post, i) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="mm-room mm-book"
              aria-label={`Read: ${post.title}`}
            >
              <rect x={112} y={312 + i * 32} width={266} height={28} className="mm-floor" />
              <Ink d={`M122 ${320 + i * 32}h9v14h-9z`} delay={2.7 + i * 0.2} dur={0.5} />
              <Write x={140} y={331 + i * 32} delay={2.8 + i * 0.2} size={14.5} anchor="start">
                {truncate(post.title, 30)}
              </Write>
            </Link>
          ))}
          <Link href="/blog" className="mm-room" aria-label="The Restricted Section: every post">
            <rect x={262} y={418} width={116} height={60} className="mm-floor mm-restricted" />
            <Ink d="M262 418H378V478H262Z" delay={2.4} dur={0.9} className="mm-dashed" />
            <Write x={320} y={443} delay={3.0} size={12} className="mm-sc">
              Restricted
            </Write>
            <Write x={320} y={461} delay={3.1} size={12} className="mm-sc">
              Section →
            </Write>
          </Link>
        </g>

        {/* ---- Room of Requirement: research interests ---- */}
        <g>
          <rect x={810} y={240} width={290} height={250} className="mm-floor" />
          <Ink
            d={roomPath(810, 240, 290, 250, [
              { side: "l", at: 360 },
              { side: "b", at: 955 },
            ])}
            delay={1.2}
            dur={1.6}
            className="mm-thick"
          />
          <Banner x={955} y={268} w={226} text="Room of Requirement" delay={2.2} size={16} />
          <Write x={955} y={298} delay={2.7} size={14} className="mm-it">
            appears to those who think about…
          </Write>
          {INTERESTS.map(([a, b], i) => {
            const cx = i % 2 === 0 ? 825 : 960;
            const cy = 310 + Math.floor(i / 2) * 58;
            return (
              <a key={a} href="#bio" className="mm-room mm-chamber" aria-label={`${a} ${b}`}>
                <rect x={cx} y={cy} width={125} height={50} className="mm-floor" />
                <Ink
                  d={roomPath(cx, cy, 125, 50, [{ side: i % 2 === 0 ? "r" : "l", at: cy + 25, w: 14 }])}
                  delay={1.9 + i * 0.12}
                  dur={0.9}
                />
                <Write x={cx + 62.5} y={cy + 21} delay={2.9 + i * 0.15} size={13.5}>
                  {a}
                </Write>
                <Write x={cx + 62.5} y={cy + 38} delay={3.0 + i * 0.15} size={13.5}>
                  {b}
                </Write>
              </a>
            );
          })}
        </g>

        {/* ---- Potions Dungeon: the day job ---- */}
        <a href="https://www.chakra.dev/" target="_blank" rel="noopener noreferrer" className="mm-room" aria-label="The Potions Dungeon: Chakra Labs">
          <rect x={460} y={560} width={280} height={150} className="mm-floor" />
          <Ink
            d={roomPath(460, 560, 280, 150, [
              { side: "t", at: 600, w: 32 },
              { side: "l", at: 630 },
              { side: "r", at: 630 },
            ])}
            delay={1.4}
            dur={1.6}
            className="mm-thick"
          />
          <Banner x={600} y={588} w={198} text="Potions Dungeon" delay={2.4} />
          <Write x={600} y={620} delay={2.9} size={13.5} className="mm-it">
            where RL environments are brewed
          </Write>
          <Write x={600} y={638} delay={3.0} size={12.5}>
            training tasks · benchmarks · Chakra Labs
          </Write>
          {[530, 600, 670].map((cx, i) => (
            <g key={cx}>
              <circle cx={cx} cy={676} r={15} pathLength={1} className="mm-draw" style={t(2.5 + i * 0.15, 0.8)} />
              <circle cx={cx} cy={676} r={9} pathLength={1} className="mm-draw mm-faint" style={t(2.7 + i * 0.15, 0.6)} />
              <circle cx={cx - 4} cy={662} r={2.5} className="mm-bubble" style={t(3.2 + i * 0.3)} />
              <circle cx={cx + 3} cy={655} r={1.8} className="mm-bubble" style={t(3.5 + i * 0.3)} />
            </g>
          ))}
        </a>

        {/* ---- Common Room: everything else ---- */}
        <a href="#bio" className="mm-room" aria-label="The Common Room: Hogwarts, anime and K-dramas">
          <rect x={100} y={560} width={290} height={150} className="mm-floor" />
          <Ink
            d={roomPath(100, 560, 290, 150, [
              { side: "t", at: 245 },
              { side: "r", at: 630 },
            ])}
            delay={1.5}
            dur={1.6}
            className="mm-thick"
          />
          <Banner x={245} y={590} w={196} text="The Common Room" delay={2.5} />
          <Write x={245} y={622} delay={3.0} size={14} className="mm-it">
            Hogwarts · Anime · K-dramas
          </Write>
          {/* fireplace and armchairs */}
          <Ink d="M215 710V684H275V710M225 710V694H265V710" delay={2.6} dur={0.8} />
          <Ink d="M236 706c-4-8 4-10 2-16c6 4 8 10 4 16M248 706c-4-10 6-12 4-20c7 6 8 14 4 20" delay={3.0} dur={0.9} className="mm-flame" />
          <Ink d="M150 660h26v24h-26zM154 664h18v16h-18z" delay={2.7} dur={0.7} />
          <Ink d="M314 660h26v24h-26zM318 664h18v16h-18z" delay={2.8} dur={0.7} />
        </a>

        {/* ---- Courtyard: say hi ---- */}
        <a href="https://x.com/27upon2" target="_blank" rel="noopener noreferrer" className="mm-room" aria-label="The Courtyard: say hi on Twitter">
          <rect x={810} y={560} width={290} height={150} className="mm-floor" />
          <Ink
            d={roomPath(810, 560, 290, 150, [
              { side: "t", at: 955 },
              { side: "l", at: 630 },
            ])}
            delay={1.6}
            dur={1.6}
            className="mm-dashed"
          />
          <Banner x={955} y={590} w={170} text="The Courtyard" delay={2.6} />
          <Write x={955} y={620} delay={3.1} size={14} className="mm-it">
            come say hi →
          </Write>
          <circle cx={955} cy={670} r={24} pathLength={1} className="mm-draw" style={t(2.7, 1)} />
          <circle cx={955} cy={670} r={9} pathLength={1} className="mm-draw mm-faint" style={t(2.9, 0.8)} />
          {[
            [845, 600],
            [1065, 600],
            [850, 682],
            [1062, 684],
          ].map(([cx, cy], i) => (
            <Ink
              key={i}
              d={`M${cx - 10} ${cy}c0-8 6-12 10-10c4-6 12-2 10 4c6 2 4 12-2 12c-2 6-12 6-14 0c-6 0-8-8-4-6z`}
              delay={2.8 + i * 0.12}
              dur={0.7}
              className="mm-faint"
            />
          ))}
        </a>

        {/* ---- Ravenclaw Tower: learning science ---- */}
        <a href="https://www.gse.harvard.edu/" target="_blank" rel="noopener noreferrer" className="mm-room" aria-label="Ravenclaw Tower: Learning Science at Harvard">
          <circle cx={190} cy={120} r={58} className="mm-floor" />
          <circle cx={190} cy={120} r={58} pathLength={1} className="mm-draw mm-thick" style={t(1.7, 1.2)} />
          <circle cx={190} cy={120} r={48} pathLength={1} className="mm-draw mm-faint" style={t(1.9, 1.2)} />
          <Ink
            d={Array.from({ length: 12 }, (_, i) => {
              const a = (i * Math.PI) / 6;
              return `M${190 + Math.cos(a) * 48} ${120 + Math.sin(a) * 48}L${190 + Math.cos(a) * 58} ${120 + Math.sin(a) * 58}`;
            }).join("")}
            delay={2.2}
            dur={0.8}
            className="mm-faint"
          />
          <Banner x={190} y={104} w={176} text="Ravenclaw Tower" delay={2.6} size={15} />
          <Write x={190} y={138} delay={3.1} size={13} className="mm-it">
            Learning Science
          </Write>
          <Write x={190} y={154} delay={3.2} size={12.5}>
            Harvard
          </Write>
        </a>

        {/* ---- The Owlery: socials ---- */}
        <g>
          <circle cx={1010} cy={120} r={58} className="mm-floor" />
          <circle cx={1010} cy={120} r={58} pathLength={1} className="mm-draw mm-thick" style={t(1.8, 1.2)} />
          <circle cx={1010} cy={120} r={48} pathLength={1} className="mm-draw mm-faint" style={t(2.0, 1.2)} />
          <Banner x={1010} y={92} w={140} text="The Owlery" delay={2.7} size={15} />
          {SOCIALS.map((s, i) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mm-room mm-perch"
              aria-label={`Send an owl: ${s.label}`}
            >
              <rect x={968} y={110 + i * 17} width={84} height={16} className="mm-floor" />
              <Write x={1010} y={123 + i * 17} delay={3.2 + i * 0.15} size={13} className="mm-it">
                {s.label}
              </Write>
            </a>
          ))}
        </g>

        {/* ---- the grounds ---- */}
        <g>
          <Ink
            d="M360 790c40-14 80 14 120 0s80 14 120 0 80 14 120 0 80 14 120 0M400 812c40-14 80 14 120 0s80 14 120 0 80 14 120 0"
            delay={2.4}
            dur={2}
            className="mm-faint"
          />
          <Write x={600} y={772} delay={3.2} size={14} className="mm-sc">
            The Black Lake
          </Write>
          <Write x={600} y={832} delay={3.3} size={12} className="mm-it">
            of unexplored loss landscapes
          </Write>

          {/* compass rose */}
          <g transform="translate(118 788)">
            <Ink d="M0 -38L7 -7L38 0L7 7L0 38L-7 7L-38 0L-7 -7Z" delay={2.5} dur={1.2} />
            <Ink d="M0 -38L0 38M-38 0L38 0" delay={2.9} dur={0.8} className="mm-faint" />
            <circle r={12} pathLength={1} className="mm-draw mm-faint" style={t(3.0, 0.8)} />
            <path d="M0 -38L7 -7L0 0Z M38 0L7 7L0 0Z M0 38L-7 7L0 0Z M-38 0L-7 -7L0 0Z" className="mm-solid" style={t(3.3)} />
            <Write x={0} y={-44} delay={3.4} size={12} className="mm-sc">
              N
            </Write>
          </g>

          {/* scale */}
          <Ink d="M960 800H1120M960 794V806M1000 796V804M1040 794V806M1080 796V804M1120 794V806" delay={2.6} dur={1} />
          <Write x={1040} y={824} delay={3.3} size={12} className="mm-it">
            1 inch = 1 epoch
          </Write>
        </g>
      </g>

      {/* footprints walk on top, un-roughened so they stay crisp */}
      <Footprints steps={stepsA} tick={tick} name="Sriraam" offset={0} />
      <Footprints steps={stepsB} tick={tick} name="Qwen3-4B" offset={11} />
    </svg>
  );
}

const INCANTATION = "I solemnly swear that I am up to no good.";

export function MaraudersMap({ posts }: { posts: HeroPost[] }) {
  const [reduceMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [revealed, setRevealed] = useState(reduceMotion);
  const [runs, setRuns] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // The first time, the map reveals itself if nobody taps it.
  useEffect(() => {
    if (revealed || runs > 0) return;
    const id = window.setTimeout(() => setRevealed(true), 4200);
    return () => window.clearTimeout(id);
  }, [revealed, runs]);

  // On narrow screens the map pans; start it centred on the Great Hall.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, []);

  const reveal = () => {
    setRuns((n) => n + 1);
    setRevealed(true);
  };

  const manage = () => {
    setRevealed(false);
    setRuns((n) => n + 1);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    frame.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    frame.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <section className="mm" aria-label="Marauder's Map">
      <div ref={frameRef} className="mm-frame" onPointerMove={onPointerMove}>
        <div ref={scrollRef} className="mm-scroll">
          <div className={`mm-canvas ${revealed ? "is-revealed" : ""} ${reduceMotion ? "is-static" : ""}`}>
            {revealed && (
              <MapDrawing key={runs} posts={posts} animate={!reduceMotion} />
            )}
          </div>
        </div>
        <div className="mm-creases" aria-hidden="true" />
        <div className="mm-lumos" aria-hidden="true" />

        {!revealed && (
          <div className="mm-seal" key={`seal-${runs}`}>
            <p className="mm-incantation" aria-label={INCANTATION}>
              {INCANTATION.split("").map((ch, i) => (
                <span key={i} style={{ animationDelay: `${0.25 + i * 0.045}s` }} aria-hidden="true">
                  {ch}
                </span>
              ))}
            </p>
            <button type="button" className="mm-wand" onClick={reveal}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 21L14 10" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M17 3v3M17 11v3M12.5 8.5h-3M24 8.5h-3M14 5.5l1.5 1.5M18.5 10l1.5 1.5M20 5.5L18.5 7" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              tap with your wand
            </button>
          </div>
        )}

      </div>
      <div className="mm-footer">
        <p className="mm-hint">← drag to explore the castle →</p>
        {revealed && (
          <button type="button" className="mm-managed" onClick={manage}>
            Mischief managed.
          </button>
        )}
      </div>
    </section>
  );
}
