import Link from "next/link";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import type { HeroPost } from "../themed-hero";
import { Footprints, buildSteps } from "./footprints";
import {
  ArcBand,
  Band,
  Cross,
  Foxing,
  It,
  Label,
  Room,
  SC,
  Tower,
  Wheel,
  arcPath,
  cover,
  polar,
  type Pt,
} from "./primitives";

/*
 * The inside of the map. Places are the parts of a researcher's site:
 *   Turris Investigationis (research interests) · the Library (writing) ·
 *   Laboratorium (experiments) · the Idea Garden · the corridor of Random
 *   Thoughts · the Unexplored Loss Landscape · Ravenclaw · the Owlery ·
 *   the Common Room.
 */

export const MAP_W = 1600;
export const MAP_H = 900;

const MOTTO = "OMNIBVS DISCENTIBVS BONVM AVDERE EST EXPERIRI · ";
const LATIN =
  "NVLLIVS IN VERBA · SAPERE AVDE · EXPERIENTIA DOCET · OMNIA PROBATE QVOD BONVM EST TENETE · DVBITANDO AD VERITATEM PERVENIMVS · ";

const INTERESTS: [string, string][] = [
  ["SAMPLE", "efficiency"],
  ["CONTINUAL", "learning"],
  ["HUMAN", "simulation"],
  ["MECH INTERP", "+ RL"],
  ["WORLD MODELS", "& neural RL envs"],
  ["SYCOPHANCY", "& adaptive reasoning"],
];

const SOCIALS = [
  { label: "twitter", href: "https://x.com/27upon2" },
  { label: "github", href: "https://github.com/13point5" },
  { label: "linkedin", href: "https://www.linkedin.com/in/13point5" },
];

const TWITTER = "https://x.com/27upon2";

// Research tower and the curved wing of interest chambers around it.
const TOWER: Pt = [330, 600];
const WING = { r1: 175, r2: 244, a1: 192, a2: 348 };

// Ink rays fan out from here, like the lines converging on the castle.
const STAR: Pt = [1168, 290];

const BLOB =
  "M860 200C870 150 950 138 1010 160C1062 128 1132 150 1150 210C1176 258 1162 322 1122 346C1082 382 1012 360 972 376C920 396 860 372 850 322C832 280 846 236 860 200Z";

const THOUGHTS =
  "M922 640C916 600 966 588 996 596C1036 588 1076 610 1069 645C1073 680 1031 694 996 688C956 696 923 678 922 640Z";

const ROUTE_SRIRAAM: Pt[] = [
  [600, 330],
  [560, 455],
  [600, 560],
  [650, 690],
  [780, 726],
  [900, 738],
  [1000, 738],
  [1100, 748],
  [1220, 758],
  [1320, 700],
  [1330, 560],
  [1385, 345],
  [1240, 420],
  [1100, 428],
  [960, 420],
  [820, 416],
  [700, 370],
];

const ROUTE_QWEN: Pt[] = Array.from({ length: 24 }, (_, i) => polar(TOWER[0], TOWER[1], 140, 180 + i * 15));

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
}

// Anything on the map can be a door to somewhere.
function Place({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="mm-place" aria-label={label}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className="mm-place" aria-label={label}>
      {children}
    </Link>
  );
}

function Border() {
  const seg = 64;
  const top = [];
  for (let x = 40, k = 0; x < 1560; x += seg, k++) {
    if (k % 2 === 0) {
      const w = Math.min(seg, 1560 - x);
      top.push(<rect key={`t${k}`} x={x} y={70} width={w} height={9} className="mm-bar" />);
      top.push(<rect key={`b${k}`} x={1600 - x - w} y={841} width={w} height={9} className="mm-bar" />);
    }
  }
  for (let y = 79, k = 0; y < 841; y += seg, k++) {
    if (k % 2 === 1) {
      const h = Math.min(seg, 841 - y);
      top.push(<rect key={`l${k}`} x={40} y={y} width={9} height={h} className="mm-bar" />);
      top.push(<rect key={`r${k}`} x={1551} y={900 - y - h} width={9} height={h} className="mm-bar" />);
    }
  }
  const motto = cover(MOTTO, 1470, 11.5).slice(0, 128);
  return (
    <g>
      <rect x={40} y={70} width={1520} height={780} className="mm-frame-line" />
      <rect x={49} y={79} width={1502} height={762} className="mm-frame-line" />
      {top}
      <text x={800} y={96} className="mm-l sc mm-motto" fontSize={17} textAnchor="middle" dominantBaseline="central" textLength={1480} lengthAdjust="spacing">
        {motto}
      </text>
      <text
        x={800}
        y={824}
        className="mm-l sc mm-motto"
        fontSize={17}
        textAnchor="middle"
        dominantBaseline="central"
        textLength={1480}
        lengthAdjust="spacing"
        transform="rotate(180 800 824)"
      >
        {motto}
      </text>
      {/* folio numbers, as on the original's margins */}
      {Array.from({ length: 16 }, (_, i) => {
        const x = 75 + i * 97;
        return (
          <g key={i}>
            <text x={x} y={52} className="mm-l it mm-folio" fontSize={17} textAnchor="middle">
              {291 + (i % 4) + Math.floor(i / 4) * 4}
            </text>
            <text x={x} y={872} className="mm-l it mm-folio" fontSize={17} textAnchor="middle" transform={`rotate(180 ${x} 866)`}>
              {291 + (i % 4) + Math.floor(i / 4) * 4}
            </text>
          </g>
        );
      })}
      {[260, 460, 660].map((y, i) => (
        <g key={y}>
          <text x={24} y={y} className="mm-l it mm-folio" fontSize={16} textAnchor="middle" transform={`rotate(-90 24 ${y})`}>
            {112 + i}
          </text>
          <text x={1578} y={y} className="mm-l it mm-folio" fontSize={16} textAnchor="middle" transform={`rotate(90 1578 ${y})`}>
            {119 - i}
          </text>
        </g>
      ))}
    </g>
  );
}

function Rays() {
  return (
    <g clipPath="url(#mmi-panel3)">
      <path
        d={Array.from({ length: 22 }, (_, i) => {
          const [x, y] = polar(STAR[0], STAR[1], 1300, 96 + i * 8);
          return `M${STAR[0]} ${STAR[1]}L${x.toFixed(0)} ${y.toFixed(0)}`;
        }).join("")}
        className="mm-ray"
      />
    </g>
  );
}

function Alchemy() {
  return (
    <g className="mm-symbols">
      {/* mercury */}
      <g transform="translate(880 178)">
        <circle r={7} className="mm-line" />
        <path d="M-7 -13A7 7 0 0 0 7 -13M0 7V22M-6 15H6" className="mm-line" />
      </g>
      <path id="mmi-gradus" d="M896 186C960 200 1010 222 1060 262" fill="none" />
      <text className="mm-l sc" fontSize={11}>
        <textPath href="#mmi-gradus">GRADVS DESCENDIT, ET DISCIT</textPath>
      </text>
      {/* hourglass */}
      <g transform="translate(858 622)">
        <path d="M-9 -12H9L-9 12H9Z" className="mm-line" />
      </g>
      {/* sun */}
      <g transform="translate(1150 616)">
        <circle r={10} className="mm-line" />
        <circle r={1.8} className="mm-red-dot" />
      </g>
      {/* the star the rays converge on */}
      <path
        d={`M${STAR[0]} ${STAR[1] - 13}L${STAR[0] + 3} ${STAR[1] - 3}L${STAR[0] + 13} ${STAR[1]}L${STAR[0] + 3} ${STAR[1] + 3}L${STAR[0]} ${STAR[1] + 13}L${STAR[0] - 3} ${STAR[1] + 3}L${STAR[0] - 13} ${STAR[1]}L${STAR[0] - 3} ${STAR[1] - 3}Z`}
        className="mm-solid"
      />
    </g>
  );
}

function LatinFlow() {
  return (
    <g>
      {Array.from({ length: 5 }, (_, i) => {
        const y = 462 + i * 24;
        return (
          <g key={i}>
            <path id={`mmi-latin-${i}`} d={`M826 ${y}C896 ${y - 28} 956 ${y + 28} 1026 ${y}S1136 ${y - 24} 1192 ${y + 6}`} fill="none" />
            <text className="mm-l sc" fontSize={12.5}>
              <textPath href={`#mmi-latin-${i}`} startOffset={-i * 37}>
                {LATIN.repeat(2)}
              </textPath>
            </text>
          </g>
        );
      })}
    </g>
  );
}

function LossLandscape() {
  const rows = Array.from({ length: 10 }, (_, i) => i);
  return (
    <g>
      <clipPath id="mmi-blob">
        <path d={BLOB} />
      </clipPath>
      <path d={BLOB} className="mm-blob" />
      <g clipPath="url(#mmi-blob)">
        <text className="mm-l mm-knock" fontSize={23}>
          {rows.map((i) => (
            <tspan key={i} x={828 - (i % 2) * 70} y={160 + i * 25}>
              The Unexplored <tspan className="sc">LOSS LANDSCAPE</tspan> The Unexplored{" "}
              <tspan className="sc">LOSS</tspan>
            </tspan>
          ))}
        </text>
      </g>
      <Label x={905} y={414} r={-6} size={12.5} lines={[<><It>here be</It> <SC>REWARD HACKERS</SC></>]} />
    </g>
  );
}

function ResearchTower() {
  const [cx, cy] = TOWER;
  const { r1, r2, a1, a2 } = WING;
  const step = (a2 - a1) / INTERESTS.length;
  return (
    <g>
      <ArcBand id="mmi-wing-in" cx={cx} cy={cy} r={r1} a1={a1} a2={a2} t={12} />
      <ArcBand id="mmi-wing-out" cx={cx} cy={cy} r={r2} a1={a1} a2={a2} t={12} caps />
      {INTERESTS.map(([sc, it], i) => {
        const a = a1 + i * step;
        const mid = a + step / 2;
        const [lx, ly] = polar(cx, cy, (r1 + r2) / 2, mid);
        const sector = `${arcPath(cx, cy, r2, a, a + step)}L${polar(cx, cy, r1, a + step).join(" ")}${arcPath(cx, cy, r1, a + step, a).replace("M", "L")}Z`;
        return (
          <Place key={sc} href="#bio" label={`${sc} ${it}`}>
            <path d={sector} className="mm-hit" />
            <Label x={lx} y={ly} r={mid + 90} size={11} lh={14} lines={[<SC key="s">{sc}</SC>, <It key="i">{it}</It>]} />
          </Place>
        );
      })}
      {Array.from({ length: INTERESTS.length - 1 }, (_, i) => {
        const a = a1 + (i + 1) * step;
        return <Band key={a} id={`mmi-wall-${i}`} a={polar(cx, cy, r1 + 6, a)} b={polar(cx, cy, r2 - 6, a)} t={9} />;
      })}
      <Wheel cx={polar(cx, cy, r2, a1)[0]} cy={polar(cx, cy, r2, a1)[1]} r={14} />
      <Wheel cx={polar(cx, cy, r2, a2)[0]} cy={polar(cx, cy, r2, a2)[1]} r={14} />

      {/* the corridor that rings the tower */}
      <path id="mmi-curriculum" d={arcPath(cx, cy, 141, 203, 337)} fill="none" />
      <text className="mm-l" fontSize={13} dominantBaseline="central">
        <textPath href="#mmi-curriculum" startOffset="50%" textAnchor="middle">
          <tspan className="it">the</tspan> <tspan className="sc">CURRICULUM</tspan> <tspan className="it">corridor</tspan>
        </textPath>
      </text>

      <Place href="#bio" label="Turris Investigationis: the research tower">
        <Tower id="mmi-tower" cx={cx} cy={cy} R={96}>
          <circle cx={cx} cy={cy} r={60} className="mm-hit" />
          <Label
            x={cx}
            y={cy}
            size={11}
            lh={15}
            lines={[<SC key="a">TVRRIS</SC>, <SC key="b">INVESTIGATIONIS</SC>, <It key="c">the research tower</It>]}
          />
        </Tower>
      </Place>
    </g>
  );
}

function Library({ posts }: { posts: HeroPost[] }) {
  return (
    <g transform="translate(625 272) rotate(-22)">
      <Room id="mmi-lib" x={-150} y={-90} w={300} h={180} doors={[{ side: "l", at: 40 }, { side: "b", at: -100 }]} />
      <Band id="mmi-lib-a" a={[70, -76]} b={[70, 21]} t={10} caps />
      <Band id="mmi-lib-b" a={[70, 43]} b={[70, 76]} t={10} caps />
      <Place href="/blog" label="The Library: all writing">
        <rect x={-136} y={-76} width={200} height={34} className="mm-hit" />
        <Label x={-36} y={-58} size={20} lines={[<><It>The</It> <SC>LIBRARY</SC></>]} />
        <Label x={-36} y={-38} size={11.5} lines={[<><It>of</It> <SC>WRITINGS</SC></>]} />
      </Place>
      {posts.slice(0, 3).map((post, i) => (
        <Place key={post.slug} href={`/blog/${post.slug}`} label={`Read: ${post.title}`}>
          <rect x={-132} y={-18 + i * 22} width={196} height={20} className="mm-hit" />
          <rect x={-128} y={-14 + i * 22} width={7} height={11} className="mm-hair" />
          <Label x={-114} y={-8 + i * 22} size={12.5} anchor="start" lines={[<It key="t">{truncate(post.title, 27)}</It>]} />
        </Place>
      ))}
      {/* shelves */}
      <path
        d={[50, 62].map((y) => `M-128 ${y}H56M-128 ${y + 7}H56`).join("")}
        className="mm-hair"
      />
      <path
        d={Array.from({ length: 36 }, (_, i) => `M${-126 + i * 5} 51V56M${-125 + i * 5} 63V68`).join("")}
        className="mm-red-line"
      />
      <Place href="/blog" label="The Restricted Section: every post">
        <rect x={76} y={-76} width={60} height={152} className="mm-hit" />
        <Label x={104} y={0} r={-90} size={11} lh={14} lines={[<SC key="r">RESTRICTED</SC>, <It key="s">section</It>]} />
      </Place>
      <Wheel cx={-150} cy={-90} />
      <Wheel cx={150} cy={90} />
    </g>
  );
}

function CommonRoom() {
  return (
    <Place href="#bio" label="The Common Room: anime, K-dramas and Hogwarts">
      <g transform="translate(655 690) rotate(14)">
        <Room id="mmi-common" x={-115} y={-62} w={230} h={124} t={13} doors={[{ side: "l", at: 0 }, { side: "r", at: 10 }]} caps />
        <rect x={-102} y={-49} width={204} height={98} className="mm-hit" />
        <Label x={0} y={-12} size={15} lines={[<><It>The</It> <SC>COMMON ROOM</SC></>]} />
        <Label x={0} y={14} size={11} lines={[<><It>anime,</It> <SC>K-DRAMAS</SC> <It>&</It> <SC>HOGWARTS</SC></>]} />
        <Wheel cx={-115} cy={62} r={13} />
      </g>
    </Place>
  );
}

function Laboratorium({ href }: { href: string }) {
  return (
    <g transform="translate(1385 340) rotate(28)">
      <Place href={href} label="Laboratorium: the experiments wing">
        <Room id="mmi-lab" x={-130} y={-85} w={260} h={170} t={12} doors={[{ side: "l", at: 30 }, { side: "b", at: -80 }]} caps />
        <rect x={-118} y={-73} width={236} height={146} className="mm-hit" />
        <Band id="mmi-lab-1" a={[-40, -73]} b={[-40, -32]} t={9} />
        <Band id="mmi-lab-2" a={[-40, -12]} b={[-40, 73]} t={9} />
        <Band id="mmi-lab-3" a={[48, -73]} b={[48, 12]} t={9} />
        <Band id="mmi-lab-4" a={[48, 32]} b={[48, 73]} t={9} />
        <Band id="mmi-lab-5" a={[-118, 0]} b={[-96, 0]} t={9} />
        <Band id="mmi-lab-6" a={[-74, 0]} b={[-40, 0]} t={9} />
        <Band id="mmi-lab-7" a={[-40, 0]} b={[-12, 0]} t={9} />
        <Band id="mmi-lab-8" a={[12, 0]} b={[48, 0]} t={9} />
        <Label x={-79} y={-36} size={12} lh={14} lines={[<SC key="a">RUN 0</SC>, <It key="b">the first try</It>]} />
        <Label x={-79} y={37} size={12} lh={14} lines={[<SC key="a">α = 16</SC>, <It key="b">collapsed</It>]} />
        <Label x={4} y={-36} size={12} lh={14} lines={[<SC key="a">α = 64</SC>, <It key="b">also collapsed</It>]} />
        <Label x={4} y={37} size={9.5} lh={13} lines={[<><It>the</It> <SC>GOOD RUN</SC></>, <It key="b">2× GPT-4.1 mini</It>]} />
        <Label
          x={84}
          y={0}
          r={-90}
          size={10.5}
          lh={13}
          lines={[<SC key="a">BEWARE—</SC>, <><It>Reward</It> <SC>HACKER</SC></>, <><It>in</It> <SC>THIS CLOSET!</SC></>]}
        />
        <Label x={0} y={-103} size={15} lines={[<SC key="l">LABORATORIVM</SC>]} />
        <Label x={0} y={104} size={12.5} lines={[<><It>the</It> <SC>EXPERIMENTS</SC> <It>wing</It></>]} />
      </Place>
      <Place href="https://www.chakra.dev/" label="Chakra Labs">
        <Label x={0} y={121} size={10} lines={[<><It>where RL environments are brewed ·</It> <SC>CHAKRA LABS</SC></>]} />
      </Place>
      <Wheel cx={-130} cy={-85} r={13} />
      <Wheel cx={130} cy={85} r={13} />
    </g>
  );
}

const SEEDS = "IDEASGROWWHERECURIOSITYISWATERED";

function IdeaGarden() {
  const [gx, gy] = [1385, 690];
  const rot = 28;
  const crosses = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    const c = Math.cos((rot * Math.PI) / 180);
    const s = Math.sin((rot * Math.PI) / 180);
    for (let j = -3; j <= 3; j++) {
      for (let i = -4; i <= 4; i++) {
        if (Math.abs(i) <= 1 && Math.abs(j) <= 1) continue;
        if (i === -4) continue; // the garden's name runs down this row
        const lx = i * 40;
        const ly = j * 40;
        const x = gx + lx * c - ly * s;
        const y = gy + lx * s + ly * c;
        if (x < 1232 || x > 1536 || y < 520 || y > 812) continue;
        out.push({ x, y });
      }
    }
    return out;
  }, [gx, gy]);
  return (
    <Place href={TWITTER} label="The Idea Garden: plant one with me">
      <path d="M1222 512H1545V830H1222Z" className="mm-hit" />
      {crosses.map((p, i) => (
        <Cross key={i} x={p.x} y={p.y} r={rot} letter={SEEDS[i % SEEDS.length]} />
      ))}
      {/* fountain */}
      <g transform={`translate(${gx} ${gy}) rotate(${rot})`}>
        <rect x={-20} y={-20} width={40} height={40} className="mm-wall mm-paper" />
        <rect x={-11} y={-11} width={22} height={22} className="mm-hair" />
        {(
          [
            ["N", 0, -30],
            ["E", 30, 0],
            ["S", 0, 30],
            ["W", -30, 0],
          ] as const
        ).map(([l, x, y]) => (
          <g key={l}>
            <rect x={x - 7} y={y - 7} width={14} height={14} className="mm-wall mm-paper" />
            <text x={x} y={y} className="mm-l sc" fontSize={9} textAnchor="middle" dominantBaseline="central">
              {l}
            </text>
          </g>
        ))}
      </g>
      <ArcBand id="mmi-arch" cx={1262} cy={545} r={15} a1={150} a2={390} t={9} caps />
      {[
        [1300, 530],
        [1520, 600],
        [1470, 535],
        [1240, 640],
        [1505, 790],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={4.5} className="mm-line" />
      ))}
      <Label x={1246} y={622} r={-62} size={17} lines={[<SC key="g">IDEA GARDEN</SC>]} className="mm-spaced" />
      <Label x={1488} y={560} r={28} size={10.5} lines={[<It key="w">water daily</It>]} />
    </Place>
  );
}

function RandomThoughts() {
  const [cx, cy] = [995, 642];
  const scale = (k: number) => `translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})`;
  const a = "M766 712C840 700 880 728 930 722S1040 706 1090 728S1190 762 1236 748";
  const b = "M762 738C840 726 880 754 930 748S1040 732 1090 754S1190 788 1236 774";
  const mid = "M764 725C840 713 880 741 930 735S1040 719 1090 741S1190 775 1236 761";
  return (
    <Place href={TWITTER} label="The corridor of Random Thoughts">
      <path d={mid} className="mm-hit-stroke" />
      <path d={a + b} className="mm-line" />
      <path id="mmi-thoughts-path" d={mid} fill="none" />
      <text className="mm-l" fontSize={11.5} dominantBaseline="central">
        <textPath href="#mmi-thoughts-path" startOffset="8%">
          <tspan className="it">the corridor of</tspan> <tspan className="sc">RANDOM THOUGHTS</tspan>
        </textPath>
      </text>
      <path d="M985 690V712M1005 690V712" className="mm-line" />
      <path d={THOUGHTS} transform={scale(1.1)} className="mm-wall mm-paper" />
      <path d={THOUGHTS} transform={scale(0.9)} className="mm-wall" />
      <path id="mmi-thoughts" d={THOUGHTS} fill="none" />
      <text className="mm-micro mm-scrawl" fontSize={9.5} dominantBaseline="central">
        <textPath href="#mmi-thoughts">{cover("maybe it's all a learning problem ", 460, 3)}</textPath>
      </text>
      <Label
        x={cx}
        y={cy}
        size={12.5}
        lh={15}
        lines={[<><It>Random</It> <SC>THOUGHTS</SC></>, <><It>may</It> <SC>LURK</SC></>, <SC key="h">HERE</SC>]}
      />
    </Place>
  );
}

function SmallTowers() {
  return (
    <g>
      <Place href="https://www.gse.harvard.edu/" label="Ravenclaw Tower: Learning Science at Harvard">
        <Tower id="mmi-rav" cx={150} cy={212} R={44} inner={false}>
          <circle cx={150} cy={212} r={31} className="mm-hit" />
          <Label x={150} y={212} size={9} lines={[<SC key="r">RAVENCLAW</SC>]} />
        </Tower>
        <Label x={150} y={288} size={12} lines={[<><It>Learning</It> <SC>SCIENCE</SC> <It>· Harvard</It></>]} />
      </Place>

      <Tower id="mmi-owl" cx={1480} cy={178} R={38} inner={false}>
        <Label x={1480} y={178} size={9.5} lines={[<SC key="o">OWLERY</SC>]} />
      </Tower>
      <Label x={1340} y={134} size={12} lines={[<><It>send an</It> <SC>OWL</SC></>]} />
      {SOCIALS.map((s, i) => (
        <Place key={s.label} href={s.href} label={`Send an owl: ${s.label}`}>
          <rect x={1303} y={146 + i * 16} width={74} height={15} className="mm-hit" />
          <Label x={1340} y={153 + i * 16} size={12} lines={[<It key="s">{s.label}</It>]} />
        </Place>
      ))}

      {/* the passage east from Ravenclaw */}
      <path d="M196 196C280 178 360 196 452 166M199 222C283 204 363 222 458 190" className="mm-line" />
      <path id="mmi-agi" d="M197 209C281 191 361 209 455 178" fill="none" />
      <text className="mm-l" fontSize={10.5} dominantBaseline="central">
        <textPath href="#mmi-agi" startOffset="12%">
          <tspan className="it">Unexplored passage to</tspan> <tspan className="sc">AGI</tspan>
        </textPath>
      </text>
    </g>
  );
}

function Annex() {
  return (
    <g transform="translate(352 286) rotate(7)">
      <Room id="mmi-annex" x={-92} y={-34} w={184} h={68} t={11} doors={[{ side: "b", at: 40 }, { side: "l", at: 0, w: 18 }]} caps />
      <Label x={-6} y={-6} size={13} lines={[<><It>the</It> <SC>arXiv ANNEX</SC></>]} />
      <Label x={-6} y={12} size={10} lines={[<It key="p">papers to read, someday</It>]} />
      <Wheel cx={92} cy={-34} r={12} />
    </g>
  );
}

function Notes() {
  return (
    <g>
      <Label x={690} y={492} r={-4} size={15} lh={17} lines={[<><SC>BEWARE</SC> <It>moving</It></>, <SC key="b">BENCHMARKS</SC>]} />
      {/* the staircase itself, mid-swing */}
      <g transform="translate(706 556) rotate(-28)">
        <rect x={-58} y={-13} width={116} height={26} className="mm-wall mm-paper" />
        <path d={Array.from({ length: 15 }, (_, i) => `M${-52 + i * 7.4} -13V13`).join("")} className="mm-hair" />
        <path d="M-58 0H-74M-74 0l6 -4M-74 0l6 4" className="mm-line" />
      </g>
      <Label x={140} y={782} r={-6} size={14} lh={17} lines={[<><It>Keep an</It> <SC>EYE</SC> <It>out for</It></>, <SC key="o">OVERFITTING</SC>]} />
      <path d="M452 794C552 778 640 806 768 790M455 818C555 802 643 830 771 814" className="mm-line" />
      <path id="mmi-gpus" d="M453 806C553 790 641 818 769 802" fill="none" />
      <text className="mm-l" fontSize={10.5} dominantBaseline="central">
        <textPath href="#mmi-gpus" startOffset="14%">
          <tspan className="it">Undercover route to the</tspan> <tspan className="sc">GPUs</tspan>
        </textPath>
      </text>
    </g>
  );
}

const INK_R = 1150;

// Grow the reveal mask from nothing to the whole sheet: the ink bleeding out.
function useInkSpread(animate: boolean) {
  const ref = useRef<SVGCircleElement>(null);
  useEffect(() => {
    const circle = ref.current;
    if (!animate || !circle) return;
    const delay = 400;
    const duration = 3600;
    let start: number | undefined;
    let frame = requestAnimationFrame(function step(now) {
      start ??= now;
      const t = Math.min(Math.max((now - start - delay) / duration, 0), 1);
      const eased = 1 - Math.pow(1 - t, 2.4);
      circle.setAttribute("r", (eased * INK_R).toFixed(1));
      if (t < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [animate]);
  return ref;
}

export function Interior({ posts, tick, animate }: { posts: HeroPost[]; tick: number; animate: boolean }) {
  const inkRef = useInkSpread(animate);
  const stepsA = useMemo(() => buildSteps(ROUTE_SRIRAAM), []);
  const stepsB = useMemo(() => buildSteps(ROUTE_QWEN), []);
  const vibe = posts.find((p) => p.slug === "vibe-rl");
  return (
    <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="mm-svg" role="group" aria-label="The Marauder's Map of sriraam.me">
      <defs>
        <radialGradient id="mm-mottle-g">
          <stop offset="0" stopColor="#a8742f" stopOpacity="0.22" />
          <stop offset="1" stopColor="#a8742f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mmi-edge" cx="50%" cy="50%" r="75%">
          <stop offset="0.6" stopColor="#8a5a20" stopOpacity="0" />
          <stop offset="1" stopColor="#8a5a20" stopOpacity="0.32" />
        </radialGradient>
        <linearGradient id="mmi-fold">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.42" stopColor="#fff8e0" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#7a5020" stopOpacity="0.35" />
          <stop offset="0.62" stopColor="#7a5020" stopOpacity="0.08" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="mmi-panel3">
          <rect x={800} y={79} width={400} height={762} />
        </clipPath>
        {/* the ink bleeds outward from where the wand touched */}
        <radialGradient id="mmi-soft">
          <stop offset="0.8" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <filter id="mmi-bleed" x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="2" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="110" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <mask id="mmi-reveal" maskUnits="userSpaceOnUse" x={0} y={0} width={MAP_W} height={MAP_H}>
          <circle ref={inkRef} cx={MAP_W / 2} cy={MAP_H / 2} r={animate ? 0 : INK_R} fill="url(#mmi-soft)" filter="url(#mmi-bleed)" />
        </mask>
      </defs>

      <rect width={MAP_W} height={MAP_H} className="mm-parchment" />
      <Foxing seed={11} w={MAP_W} h={MAP_H} count={0} mottles />

      <g className="mm-ink" mask="url(#mmi-reveal)">
        <Rays />
        <LatinFlow />
        <Alchemy />
        <Border />
        <SmallTowers />
        <Annex />
        <ResearchTower />
        <Library posts={posts} />
        <CommonRoom />
        <RandomThoughts />
        <Laboratorium href={vibe ? `/blog/${vibe.slug}` : "/blog"} />
        <IdeaGarden />
        <LossLandscape />
        <Notes />
      </g>

      {/* age: stains over the ink, then the folds */}
      <Foxing seed={7} w={MAP_W} h={MAP_H} count={260} mottles={false} />
      <rect width={MAP_W} height={MAP_H} fill="url(#mmi-edge)" pointerEvents="none" />
      {[400, 800, 1200].map((x) => (
        <rect key={x} x={x - 7} y={0} width={14} height={MAP_H} fill="url(#mmi-fold)" pointerEvents="none" />
      ))}

      <g mask="url(#mmi-reveal)">
        <Footprints steps={stepsA} tick={tick} name="Sriraam" offset={0} />
        <Footprints steps={stepsB} tick={tick} name="Qwen3-4B" offset={9} />
      </g>
    </svg>
  );
}
