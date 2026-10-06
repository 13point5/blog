import { Foxing, cover } from "./primitives";

/*
 * The folded map's front, after the film prop: a curling ribbon, the
 * "Messrs." credit, an isometric castle around the dark title plaque, a tree
 * made of words and a river of Latin. Rendered once per gatefold half
 * (`half`), each with its own id prefix.
 */

export const COVER_W = 600;
export const COVER_H = 840;

const LATIN =
  "NVLLIVS IN VERBA · SAPERE AVDE · EXPERIENTIA DOCET · OMNIA PROBATE QVOD BONVM EST TENETE · ";

// Point along an edge, for crenellations and windows.
const lerp = (a: [number, number], b: [number, number], t: number): [number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

function merlons(a: [number, number], b: [number, number], n: number, h = 7) {
  let d = "";
  for (let i = 0; i < n; i++) {
    const [x1, y1] = lerp(a, b, (i + 0.25) / n);
    const [x2, y2] = lerp(a, b, (i + 0.75) / n);
    d += `M${x1.toFixed(1)} ${y1.toFixed(1)}l0 ${-h}L${x2.toFixed(1)} ${(y2 - h).toFixed(1)}l0 ${h}`;
  }
  return d;
}

function Turret({ x, top, w, body, roof, flag }: { x: number; top: number; w: number; body: number; roof: number; flag?: boolean }) {
  const l = x - w / 2;
  const r = x + w / 2;
  return (
    <g>
      <path d={`M${l} ${top}V${top + body}Q${x} ${top + body + w / 4} ${r} ${top + body}V${top}`} className="mm-wall mm-paper" />
      {/* shading on the right of the drum */}
      <path
        d={Array.from({ length: Math.floor(body / 7) }, (_, i) => `M${r - w * 0.28} ${top + 6 + i * 7}l${w * 0.22} 4`).join("")}
        className="mm-hair"
      />
      <path d={`M${x - 2} ${top + body * 0.3}v8a2 2 0 0 0 4 0v-8a2 2 0 0 0 -4 0Z`} className="mm-solid" />
      <path
        d={`M${l - 3} ${top}Q${x - w / 4} ${top - roof * 0.45} ${x} ${top - roof}Q${x + w / 4} ${top - roof * 0.45} ${r + 3} ${top}Q${x} ${top + w / 5} ${l - 3} ${top}Z`}
        className="mm-wall mm-paper"
      />
      <path
        d={`M${x} ${top - roof + 4}L${x + w * 0.18} ${top + 2}M${x} ${top - roof + 8}L${x + w * 0.35} ${top}`}
        className="mm-hair"
      />
      <path d={`M${x} ${top - roof}v-12`} className="mm-line" />
      <circle cx={x} cy={top - roof - 13} r={1.8} className="mm-solid" />
      {flag && <path d={`M${x} ${top - roof - 12}l10 3l-10 3`} className="mm-line" />}
    </g>
  );
}

function Castle() {
  const N: [number, number] = [300, 520];
  const E: [number, number] = [462, 602];
  const S: [number, number] = [300, 684];
  const Wt: [number, number] = [138, 602];
  const h = 48;
  const down = (p: [number, number]): [number, number] => [p[0], p[1] + h];
  return (
    <g>
      {/* back towers rise behind the courtyard */}
      <Turret x={300} top={448} w={30} body={80} roof={62} flag />
      <Turret x={226} top={478} w={24} body={58} roof={46} />
      <Turret x={376} top={474} w={24} body={58} roof={48} />
      <Turret x={186} top={526} w={20} body={44} roof={34} />
      <Turret x={416} top={522} w={20} body={44} roof={36} />

      {/* back walls */}
      <path d={`M${Wt[0]} ${Wt[1]}L${N[0]} ${N[1]}L${E[0]} ${E[1]}M${Wt[0] + 10} ${Wt[1] + 4}L${N[0]} ${N[1] + 9}L${E[0] - 10} ${E[1] + 4}`} className="mm-wall" />
      <path d={merlons(Wt, N, 12) + merlons(N, E, 12)} className="mm-line" />

      {/* the plaque */}
      <path d="M300 536L438 602L300 668L162 602Z" className="mm-plaque" />
      <text x={300} y={580} textAnchor="middle" className="mm-l it mm-plaque-text" fontSize={24}>
        The
      </text>
      <text x={300} y={612} textAnchor="middle" className="mm-l sc mm-plaque-text" fontSize={28}>
        MARAUDER&apos;S
      </text>
      <text x={300} y={643} textAnchor="middle" className="mm-l sc mm-plaque-text" fontSize={28}>
        MAP
      </text>

      {/* corner towers */}
      <Turret x={138} top={556} w={30} body={92} roof={54} />
      <Turret x={462} top={556} w={30} body={92} roof={56} />

      {/* front walls with windows, shading and the gate */}
      <path d={`M${Wt[0]} ${Wt[1]}L${S[0]} ${S[1]}L${down(S)[0]} ${down(S)[1]}L${down(Wt)[0]} ${down(Wt)[1]}Z`} className="mm-wall mm-paper" />
      <path d={`M${S[0]} ${S[1]}L${E[0]} ${E[1]}L${down(E)[0]} ${down(E)[1]}L${down(S)[0]} ${down(S)[1]}Z`} className="mm-wall mm-paper" />
      <path d={merlons(Wt, S, 13) + merlons(S, E, 13)} className="mm-line" />
      <path
        d={Array.from({ length: 22 }, (_, i) => {
          const [x, y] = lerp(S, E, (i + 0.5) / 22);
          return `M${x.toFixed(1)} ${(y + 6).toFixed(1)}l6 ${h - 14}`;
        }).join("")}
        className="mm-hair"
      />
      {[0.22, 0.42, 0.62].map((t) => {
        const [x, y] = lerp(Wt, S, t);
        return <path key={t} d={`M${x - 2} ${y + 16}v9a2 2 0 0 0 4 0v-9a2 2 0 0 0 -4 0Z`} className="mm-solid" />;
      })}
      {[0.3, 0.55, 0.8].map((t) => {
        const [x, y] = lerp(S, E, t);
        return <path key={t} d={`M${x - 2} ${y + 16}v9a2 2 0 0 0 4 0v-9a2 2 0 0 0 -4 0Z`} className="mm-solid" />;
      })}
      <path d="M292 722v-16a8 8 0 0 1 16 0v16" className="mm-wall" />
      <path d="M300 684V732" className="mm-hair" />

      {/* the pennant: this map's name */}
      <path d="M138 490L124 458" className="mm-line" />
      <path d="M124 456C100 448 72 466 40 456L48 471L36 486C68 494 98 478 124 482Z" className="mm-wall mm-paper" />
      <text x={82} y={470} textAnchor="middle" dominantBaseline="central" className="mm-l sc" fontSize={10} transform="rotate(3 82 470)">
        SRIRAAM.ME
      </text>
    </g>
  );
}

function Ribbon() {
  // a single band arching over the credit, with curling tails and loose loops
  const curls = [
    "M118 214C70 182 40 122 88 100C134 80 160 138 122 150C98 156 92 132 108 126",
    "M84 228C40 246 26 304 66 314C98 322 112 292 92 284",
    "M300 116C282 76 330 52 342 82C350 106 322 112 318 98",
    "M150 160C130 120 170 70 210 92C236 106 214 138 196 126",
  ];
  const mirrored = curls.map((d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${600 - Number(x)} ${y}`));
  return (
    <g>
      {[...curls, ...mirrored].map((d, i) => (
        <g key={i}>
          <path d={d} className="mm-ribbon-edge" />
          <path d={d} className="mm-ribbon-face" />
        </g>
      ))}
      <path d="M124 212L80 222L94 240L72 264L120 250Z" className="mm-wall mm-paper" />
      <path d="M476 212L520 222L506 240L528 264L480 250Z" className="mm-wall mm-paper" />
      <path d="M118 202Q300 92 482 202L482 238Q300 128 118 238Z" className="mm-wall mm-paper" />
      <path d="M140 200Q300 110 460 200M140 230Q300 140 460 230" className="mm-hair" />
    </g>
  );
}

export function CoverArt({ prefix, half }: { prefix: string; half: "left" | "right" }) {
  const x0 = half === "left" ? 0 : COVER_W / 2;
  return (
    <svg viewBox={`${x0} 0 ${COVER_W / 2} ${COVER_H}`} className="mm-cover-svg" aria-hidden="true">
      <defs>
        <radialGradient id="mm-mottle-g">
          <stop offset="0" stopColor="#a8742f" stopOpacity="0.22" />
          <stop offset="1" stopColor="#a8742f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${prefix}-edge`} cx="50%" cy="50%" r="80%">
          <stop offset="0.55" stopColor="#8a5a20" stopOpacity="0" />
          <stop offset="1" stopColor="#8a5a20" stopOpacity="0.34" />
        </radialGradient>
      </defs>
      <rect width={COVER_W} height={COVER_H} className="mm-parchment" />
      <Foxing seed={23} w={COVER_W} h={COVER_H} count={0} mottles />

      <g className="mm-ink">
        <Ribbon />
        <path id={`${prefix}-ribbon`} d="M126 222Q300 112 474 222" fill="none" />
        <text className="mm-l sc" fontSize={19} letterSpacing={2} dominantBaseline="central">
          <textPath href={`#${prefix}-ribbon`} startOffset="50%" textAnchor="middle">
            ITINERARIVM · DISCENTIVM
          </textPath>
        </text>

        <text x={300} y={300} textAnchor="middle" className="mm-l it" fontSize={38}>
          Messrs.
        </text>
        <text x={300} y={346} textAnchor="middle" className="mm-l sc" fontSize={29}>
          REWARD, POLICY,
        </text>
        <text x={300} y={382} textAnchor="middle" className="mm-l sc" fontSize={29}>
          ROLLOUT &amp; GRADIENT
        </text>
        <text x={300} y={414} textAnchor="middle" className="mm-l it" fontSize={22}>
          are proud to present
        </text>

        {/* a tree made of words, standing in for the Whomping Willow */}
        <g>
          {[
            "M494 650C498 610 478 580 494 536",
            "M494 538C506 488 546 456 590 446",
            "M494 544C526 508 566 502 598 508",
            "M492 552C474 496 504 446 524 416",
            "M496 548C536 538 572 552 594 570",
            "M493 546C486 476 536 436 566 410",
            "M494 560C470 540 470 512 454 492",
            "M494 532C500 470 520 430 548 398",
            "M495 556C540 560 568 590 588 612",
            "M492 540C468 470 470 430 484 400",
          ].map((d, i) => (
            <g key={i}>
              <path id={`${prefix}-tree-${i}`} d={d} fill="none" />
              <text className="mm-l sc" fontSize={7.5} dominantBaseline="central">
                <textPath href={`#${prefix}-tree-${i}`}>{cover("DECISION TREE · ", 160, 4.8)}</textPath>
              </text>
            </g>
          ))}
        </g>

        <g transform="translate(300 600) scale(0.86) translate(-300 -572)">
          <Castle />
        </g>

        {/* a river of Latin */}
        {Array.from({ length: 4 }, (_, i) => {
          const y = 762 + i * 18;
          return (
            <g key={i}>
              <path id={`${prefix}-latin-${i}`} d={`M${70 + i * 6} ${y}C150 ${y - 26} 220 ${y + 22} 300 ${y}S440 ${y - 20} ${540 - i * 4} ${y + 8}`} fill="none" />
              <text className="mm-l sc" fontSize={11.5}>
                <textPath href={`#${prefix}-latin-${i}`} startOffset={-i * 23}>
                  {LATIN.repeat(2)}
                </textPath>
              </text>
            </g>
          );
        })}
      </g>

      <Foxing seed={31} w={COVER_W} h={COVER_H} count={120} mottles={false} />
      <rect width={COVER_W} height={COVER_H} fill={`url(#${prefix}-edge)`} />
    </svg>
  );
}
