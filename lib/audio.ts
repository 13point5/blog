// A tiny synth for the playable bits of the site. Nothing here makes a sound
// until the visitor taps something.

let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

/** A second of silence as a WAV data URI. */
function silentWav() {
  const rate = 8000, n = rate;
  const bytes = new Uint8Array(44 + n);
  const v = new DataView(bytes.buffer);
  const text = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  text(0, "RIFF"); v.setUint32(4, 36 + n, true); text(8, "WAVEfmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  text(36, "data"); v.setUint32(40, n, true);
  bytes.fill(128, 44); // 8-bit PCM silence
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return "data:audio/wav;base64," + btoa(bin);
}

let unlocked = false;

/**
 * On iPhones the ring/silent switch mutes Web Audio, because the browser files
 * it under "ambient" sound. Media playback is not muted by the switch, so on
 * the first tap we ask for the playback category, and for browsers without
 * that API we keep a silent <audio> element playing, which has the same effect.
 */
function unlock() {
  if (unlocked) return;
  unlocked = true;
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (session) {
    try { session.type = "playback"; return; } catch {}
  }
  try {
    const el = new Audio(silentWav());
    el.loop = true;
    el.setAttribute("playsinline", "");
    el.volume = 0.01;
    void el.play().catch(() => {});
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) el.pause();
      else void el.play().catch(() => {});
    });
  } catch {}
}

function audio() {
  if (typeof window === "undefined") return null;
  try {
    unlock();
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function noise(ac: AudioContext) {
  if (!noiseBuffer) {
    noiseBuffer = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer;
  return src;
}

export const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);

type Voice = { type?: OscillatorType; attack?: number; glideTo?: number; delay?: number };

/** One enveloped oscillator note. */
function note(freq: number, seconds: number, volume: number, { type = "sine", attack = 0.01, glideTo, delay = 0 }: Voice = {}) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const t = ac.currentTime + delay;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + seconds);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + seconds + 0.05);
}

/** A short burst of filtered noise. */
function burst(seconds: number, volume: number, filter: BiquadFilterType, from: number, to = from, delay = 0) {
  const ac = audio();
  if (!ac) return;
  const src = noise(ac);
  const f = ac.createBiquadFilter();
  const gain = ac.createGain();
  const t = ac.currentTime + delay;
  f.type = filter;
  f.frequency.setValueAtTime(from, t);
  if (to !== from) f.frequency.exponentialRampToValueAtTime(to, t + seconds);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  src.connect(f).connect(gain).connect(ac.destination);
  src.start(t);
  src.stop(t + seconds + 0.02);
}

/** A piano-ish note: a struck fundamental with two quieter partials that die away. */
export function piano(freq: number, volume = 0.1, delay = 0) {
  note(freq, 1.8, volume, { type: "triangle", attack: 0.004, delay });
  note(freq * 2, 0.9, volume * 0.28, { attack: 0.004, delay });
  note(freq * 3.01, 0.4, volume * 0.1, { attack: 0.004, delay });
  burst(0.03, volume * 0.25, "bandpass", 2500, 2500, delay); // hammer
}

/** Owl: two soft, falling hoots. */
export function hoot() {
  note(410, 0.22, 0.09, { attack: 0.04, glideTo: 350 });
  note(390, 0.42, 0.09, { attack: 0.05, glideTo: 320, delay: 0.3 });
}

/** A glittering run of notes, rising or falling. */
export function chime(rising: boolean) {
  const notes = [84, 88, 91, 96, 100];
  (rising ? notes : [...notes].reverse()).forEach((n, i) => note(midi(n), 0.5, 0.035, { delay: i * 0.055 }));
}

/** Arc reactor: a hum that winds up when it comes on, and down when it goes off. */
export function reactor(on: boolean) {
  note(on ? 90 : 360, 0.55, 0.05, { type: "sawtooth", attack: 0.05, glideTo: on ? 360 : 80 });
  note(on ? 180 : 720, 0.55, 0.03, { attack: 0.05, glideTo: on ? 720 : 160 });
  if (on) note(midi(96), 0.6, 0.03, { delay: 0.42 });
}

/** Cube: the click of one layer turning. */
export function click() {
  burst(0.035, 0.12, "bandpass", 1800);
  burst(0.05, 0.08, "bandpass", 900, 900, 0.045);
}

/** Cube solved, or anything else worth a small flourish. */
export function fanfare() {
  [72, 76, 79, 84].forEach((n, i) => note(midi(n), 0.5, 0.06, { type: "triangle", delay: i * 0.09 }));
}

/** Yoyo: the string snapping it back up. */
export function whoosh() {
  burst(0.28, 0.07, "bandpass", 500, 2600);
}

/** Floppy disk: a drive head stepping across the tracks. */
export function driveSeek() {
  for (let i = 0; i < 7; i++) note(70 + (i % 3) * 14, 0.05, 0.07, { type: "square", delay: i * 0.075 });
  burst(0.5, 0.012, "lowpass", 900);
}

/** Console: an 8-bit coin. */
export function coin() {
  note(midi(83), 0.08, 0.05, { type: "square" });
  note(midi(88), 0.3, 0.05, { type: "square", delay: 0.08 });
}

/** Something small and soft, for objects with no sound of their own. */
export function pluck() {
  note(midi(72), 0.25, 0.05, { type: "triangle" });
}

/** A book: a page turning over. */
export function pageFlip() {
  burst(0.16, 0.07, "bandpass", 2600, 700);
  burst(0.05, 0.05, "lowpass", 500, 500, 0.14);
}

/** A keyboard: a few quick key presses. */
export function keys() {
  for (let i = 0; i < 4; i++) burst(0.025, 0.09, "bandpass", 1500 + (i % 2) * 600, 1500, i * 0.07);
}

/** A castle bell, some way off. */
export function bell() {
  note(330, 2.2, 0.07);
  note(660, 1.6, 0.035);
  note(990, 0.9, 0.02);
}

/** A fish taking a crumb. */
export function plop() {
  note(620, 0.12, 0.09, { glideTo: 170 });
  burst(0.04, 0.03, "highpass", 3000, 3000, 0.05);
}

/** A gust of rain against the glass. */
export function rain() {
  burst(0.9, 0.035, "highpass", 2500);
  for (let i = 0; i < 6; i++) burst(0.015, 0.03, "bandpass", 3500, 3500, i * 0.13 + 0.05);
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

/** Put the record on: the prelude on a loop, with vinyl crackle. Returns a stop function. */
export function playRecord() {
  const ac = audio();
  let hiss: AudioBufferSourceNode | null = null;
  if (ac) {
    burst(0.12, 0.05, "lowpass", 300); // the needle dropping
    hiss = noise(ac);
    hiss.loop = true;
    const f = ac.createBiquadFilter();
    const g = ac.createGain();
    f.type = "highpass";
    f.frequency.value = 3500;
    g.gain.value = 0.006;
    hiss.connect(f).connect(g).connect(ac.destination);
    hiss.start();
  }
  let step = 0;
  const tick = () => {
    const bar = BARS[Math.floor(step / 16) % BARS.length];
    piano(midi(bar[PATTERN[step % 8]]), 0.05);
    if (Math.random() < 0.3) burst(0.012, 0.03, "highpass", 2000); // a pop
    step++;
  };
  tick();
  const id = setInterval(tick, 235); // an unhurried andante
  return () => {
    clearInterval(id);
    try { hiss?.stop(); } catch {}
  };
}
