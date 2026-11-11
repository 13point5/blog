// A tiny synth for the playable bits of the site. Nothing here makes a sound
// until the visitor taps something.

let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);

/** Play one soft, plucked note. */
export function tone(freq: number, seconds = 0.9, volume = 0.07) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  const t = ac.currentTime;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + seconds + 0.05);
}

// The opening bars of Bach's Prelude in C (BWV 846): five notes, then the last
// three again, each bar played twice.
const BARS = [
  [60, 64, 67, 72, 76],
  [60, 62, 69, 74, 77],
  [59, 62, 67, 74, 77],
  [60, 64, 67, 72, 76],
  [60, 64, 69, 76, 81],
  [60, 62, 66, 69, 74],
  [59, 62, 67, 74, 79],
  [59, 60, 64, 67, 72],
];
const PATTERN = [0, 1, 2, 3, 4, 2, 3, 4];

/** Start the prelude on a loop. Returns a function that stops it. */
export function playPrelude() {
  let step = 0;
  const tick = () => {
    const bar = BARS[Math.floor(step / 16) % BARS.length];
    tone(midi(bar[PATTERN[step % 8]]), 1.1, 0.045);
    step++;
  };
  tick();
  const id = setInterval(tick, 165);
  return () => clearInterval(id);
}

/** One bowed note: a filtered sawtooth with a slow attack and a little vibrato. */
function bowed(freq: number, start: number, seconds: number, volume = 0.05) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const lfo = ac.createOscillator();
  const depth = ac.createGain();
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = freq;
  lfo.frequency.value = 5.5;
  depth.gain.value = freq * 0.006;
  lfo.connect(depth).connect(osc.frequency);
  filter.type = "lowpass";
  filter.frequency.value = 2400;
  const t = ac.currentTime + start;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.05);
  gain.gain.setValueAtTime(volume, t + Math.max(0.06, seconds - 0.08));
  gain.gain.linearRampToValueAtTime(0, t + seconds);
  osc.connect(filter).connect(gain).connect(ac.destination);
  osc.start(t); lfo.start(t);
  osc.stop(t + seconds + 0.05); lfo.stop(t + seconds + 0.05);
}

/** The opening of "Spring" from Vivaldi's Four Seasons. */
export function playSpring() {
  const beat = 0.26;
  const phrase: [number, number][] = [[76, 1], [80, 1], [80, 1], [80, 1], [78, 0.5], [76, 0.5], [83, 3]];
  let at = 0;
  for (const [note, beats] of phrase) {
    bowed(midi(note), at, beats * beat * 0.96);
    at += beats * beat;
  }
}
