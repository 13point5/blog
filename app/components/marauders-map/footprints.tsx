import type { Pt } from "./primitives";

/*
 * Footprints that wander the map with a name on a little scroll, as in the
 * film. Steps alternate left/right along a looping route.
 */

export type Step = { x: number; y: number; angle: number };

export function buildSteps(route: Pt[], spacing = 19): Step[] {
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
      steps.push({ x: ax + ux * s - uy * 4.5 * side, y: ay + uy * s + ux * 4.5 * side, angle });
      left = !left;
    }
    carry = s - len;
  }
  return steps;
}

const TRAIL = 9;

export function Footprints({ steps, tick, name, offset }: { steps: Step[]; tick: number; name: string; offset: number }) {
  const head = (tick + offset) % steps.length;
  const lead = steps[head];
  const w = name.length * 6.6 + 18;
  return (
    <g className="mm-walker" aria-hidden="true">
      {Array.from({ length: TRAIL }, (_, k) => {
        const step = steps[(head - k + steps.length) % steps.length];
        return (
          <g key={k} transform={`translate(${step.x.toFixed(1)} ${step.y.toFixed(1)}) rotate(${step.angle.toFixed(0)})`} opacity={1 - k / TRAIL}>
            <path d="M-1.5 -2.6C3 -3.2 6.2 -1.8 6.2 0S3 3.2 -1.5 2.6C-3 2.3 -3 -2.3 -1.5 -2.6Z" />
            <ellipse cx={-5.6} cy={0} rx={2.1} ry={2.2} />
          </g>
        );
      })}
      {/* name scroll */}
      <g transform={`translate(${lead.x.toFixed(1)} ${(lead.y - 19).toFixed(1)})`} className="mm-nametag">
        <path d={`M${-w / 2} -7H${w / 2}C${w / 2 + 4} -7 ${w / 2 + 4} 0 ${w / 2} 0C${w / 2 + 5} 0 ${w / 2 + 6} 7 ${w / 2 + 1} 7H${-w / 2 - 1}C${-w / 2 - 6} 7 ${-w / 2 - 5} 0 ${-w / 2} 0C${-w / 2 - 4} 0 ${-w / 2 - 4} -7 ${-w / 2} -7Z`} />
        <text y={0.5} textAnchor="middle" dominantBaseline="central" fontSize={10.5} className="mm-l it">
          {name}
        </text>
      </g>
    </g>
  );
}
