// Drawing helpers for the IP / TCP / UDP explainer. Everything is a pure
// function of time so any frame can be rendered independently.
/* global TIMELINE */

const W = 1920, H = 1080;
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

const C = {
  bg: "#0b0f17", bg2: "#111827", panel: "#151c2b", panel2: "#1b2436", line: "#2a3550",
  text: "#e8edf6", dim: "#8a97b0", faint: "#4a5672",
  ip: "#5aa9ff", tcp: "#3ddc97", udp: "#ff9f43", bad: "#ff5d6c", warn: "#ffcc4d",
  app: "#e879c9", link: "#a0a8bb", quic: "#b48cff",
};
const SANS = "Inter, 'DejaVu Sans', sans-serif";
const MONO = "'JetBrains Mono', 'DejaVu Sans Mono', monospace";

// ---------- math / timing ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const easeIO = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
// linear 0..1 progress of t through [start, start+dur]
const lin = (t, start, dur) => clamp((t - start) / dur);
const prog = (t, start, dur = 0.7) => easeIO(lin(t, start, dur));
const pop = (t, start, dur = 0.5) => easeBack(lin(t, start, dur));
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// alpha for something visible between a and b, with fades
function win(t, a, b, f = 0.4) {
  if (b === undefined) return prog(t, a, f);
  return Math.min(prog(t, a, f), 1 - prog(t, b - f, f));
}

// ---------- canvas state ----------
function save(fn, alpha = 1) {
  if (alpha <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  fn();
  ctx.restore();
}
function at(x, y, s, fn) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); fn(); ctx.restore();
}

// ---------- primitives ----------
function rrect(x, y, w, h, r, fill, stroke, lw = 2, dash) {
  ctx.beginPath();
  r = Math.min(r, w / 2, h / 2);
  ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) {
    ctx.lineWidth = lw; ctx.strokeStyle = stroke;
    if (dash) ctx.setLineDash(dash);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
function circle(x, y, r, fill, stroke, lw = 2) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function line(x1, y1, x2, y2, color, lw = 2, dash) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = color; ctx.lineWidth = lw;
  if (dash) ctx.setLineDash(dash);
  ctx.stroke(); ctx.setLineDash([]);
}
function font(size, weight = 400, mono = false) {
  return `${weight} ${size}px ${mono ? MONO : SANS}`;
}
// text(str, x, y, {size, weight, color, align, base, mono, max})
function text(str, x, y, o = {}) {
  ctx.font = font(o.size || 32, o.weight || 400, o.mono);
  ctx.fillStyle = o.color || C.text;
  ctx.textAlign = o.align || "left";
  ctx.textBaseline = o.base || "middle";
  if (o.spacing) ctx.letterSpacing = o.spacing + "px";
  ctx.fillText(str, x, y, o.max);
  if (o.spacing) ctx.letterSpacing = "0px";
}
function measure(str, size, weight = 400, mono = false) {
  ctx.font = font(size, weight, mono);
  return ctx.measureText(str).width;
}
// rich text: array of [str, color, weight?] segments on one line
function rich(segs, x, y, o = {}) {
  const size = o.size || 32;
  let total = 0;
  for (const s of segs) total += measure(s[0], size, s[2] || o.weight || 400, o.mono);
  let cx = o.align === "center" ? x - total / 2 : o.align === "right" ? x - total : x;
  for (const s of segs) {
    text(s[0], cx, y, { size, weight: s[2] || o.weight || 400, color: s[1] || C.text, mono: o.mono });
    cx += measure(s[0], size, s[2] || o.weight || 400, o.mono);
  }
  return total;
}
function wrap(str, maxW, size, weight = 400) {
  const words = str.split(" ");
  const out = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (measure(test, size, weight) > maxW && cur) { out.push(cur); cur = w; } else cur = test;
  }
  if (cur) out.push(cur);
  return out;
}

// arrow from (x1,y1) to (x2,y2), drawn up to fraction p
function arrow(x1, y1, x2, y2, o = {}) {
  const p = o.p === undefined ? 1 : o.p;
  if (p <= 0) return;
  const x = lerp(x1, x2, p), y = lerp(y1, y2, p);
  const color = o.color || C.text, lw = o.lw || 3;
  line(x1, y1, x, y, color, lw, o.dash);
  if (o.head === false) return;
  const a = Math.atan2(y2 - y1, x2 - x1), hs = o.hs || 16;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - hs * Math.cos(a - 0.45), y - hs * Math.sin(a - 0.45));
  ctx.lineTo(x - hs * Math.cos(a + 0.45), y - hs * Math.sin(a + 0.45));
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
}
function cross(x, y, s, color = C.bad, lw = 6) {
  line(x - s, y - s, x + s, y + s, color, lw);
  line(x + s, y - s, x - s, y + s, color, lw);
}
function check(x, y, s, color = C.tcp, lw = 6) {
  ctx.beginPath();
  ctx.moveTo(x - s, y); ctx.lineTo(x - s * 0.3, y + s * 0.7); ctx.lineTo(x + s, y - s * 0.7);
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
  ctx.lineCap = "butt"; ctx.lineJoin = "miter";
}
function glow(color, blur, fn) {
  ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; fn(); ctx.restore();
}

// packet chip centred at x,y
function packet(x, y, label, color, o = {}) {
  const size = o.size || 22;
  const w = o.w || Math.max(46, measure(label, size, 700, true) + 26), h = o.h || size + 20;
  glow(color, o.glow === undefined ? 14 : o.glow, () => rrect(x - w / 2, y - h / 2, w, h, 8, o.fill || C.panel2, color, 3));
  text(label, x, y + 1, { size, weight: 700, mono: true, color: o.textColor || color, align: "center" });
}

// labelled box
function box(x, y, w, h, o = {}) {
  rrect(x, y, w, h, o.r === undefined ? 14 : o.r, o.fill || C.panel, o.stroke || C.line, o.lw || 2, o.dash);
  if (o.title) text(o.title, x + (o.center ? w / 2 : 20), y + (o.titleY || 30), {
    size: o.tsize || 24, weight: 700, color: o.tcolor || C.dim, align: o.center ? "center" : "left", mono: o.tmono,
  });
}

// ---------- icons ----------
function laptop(x, y, s = 1, color = C.text, label, sub) {
  at(x, y, s, () => {
    rrect(-60, -52, 120, 78, 8, C.panel2, color, 4);
    rrect(-50, -43, 100, 60, 4, "#0f1a2e");
    ctx.beginPath(); ctx.moveTo(-78, 30); ctx.lineTo(78, 30); ctx.lineTo(68, 42); ctx.lineTo(-68, 42); ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    for (let i = 0; i < 3; i++) rrect(-40, -33 + i * 16, 50 + 30 * hash(i + 3), 8, 3, color + "55");
  });
  if (label) text(label, x, y + 72 * s, { size: 26 * Math.max(s, 0.8), weight: 700, align: "center" });
  if (sub) text(sub, x, y + 104 * s, { size: 20 * Math.max(s, 0.8), mono: true, color: C.dim, align: "center" });
}
function server(x, y, s = 1, color = C.text, label, sub) {
  at(x, y, s, () => {
    for (let i = 0; i < 3; i++) {
      rrect(-55, -60 + i * 40, 110, 34, 6, C.panel2, color, 4);
      circle(35, -43 + i * 40, 5, C.tcp);
      line(-40, -43 + i * 40, 10, -43 + i * 40, color + "88", 4);
    }
  });
  if (label) text(label, x, y + 88 * s, { size: 26 * Math.max(s, 0.8), weight: 700, align: "center" });
  if (sub) text(sub, x, y + 120 * s, { size: 20 * Math.max(s, 0.8), mono: true, color: C.dim, align: "center" });
}
function router(x, y, s = 1, color = C.ip, label, hl = 0) {
  at(x, y, s, () => {
    if (hl > 0) glow(color, 30 * hl, () => circle(0, 0, 34, C.panel2, color, 4));
    else circle(0, 0, 34, C.panel2, color, 3);
    // four little arrows
    for (let k = 0; k < 4; k++) {
      ctx.save(); ctx.rotate(k * Math.PI / 2 + Math.PI / 4);
      arrow(4, 0, 22, 0, { color, lw: 3, hs: 8 });
      ctx.restore();
    }
  });
  if (label) text(label, x, y + 52 * s, { size: 18, color: C.dim, align: "center", mono: true });
}
function phone(x, y, s = 1, color = C.text) {
  at(x, y, s, () => {
    rrect(-32, -58, 64, 116, 12, C.panel2, color, 4);
    rrect(-24, -46, 48, 84, 4, "#0f1a2e");
    circle(0, 48, 4, color);
  });
}
function emoji(ch, x, y, size) {
  ctx.font = `${size}px 'Noto Color Emoji'`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(ch, x, y);
}

// ---------- scene furniture ----------
function sceneTitle(t, title, color = C.text, kicker) {
  const a = prog(t, 0.1, 0.6);
  save(() => {
    const dx = (1 - a) * -30;
    rrect(90 + dx, 62, 8, 64, 4, color);
    if (kicker) text(kicker, 118 + dx, 76, { size: 20, weight: 700, color, spacing: 3 });
    text(title, 118 + dx, kicker ? 110 : 94, { size: kicker ? 44 : 48, weight: 800 });
  }, a);
}

function background(T) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W * 0.5, H * 0.35, 100, W * 0.5, H * 0.5, W * 0.75);
  g.addColorStop(0, "#131b2c"); g.addColorStop(1, C.bg);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // faint dot grid
  ctx.fillStyle = "#1a2336";
  for (let x = 40; x < W; x += 60) for (let y = 40; y < H; y += 60) ctx.fillRect(x, y, 2, 2);
}

function captions(cue, lt) {
  if (!cue) return;
  const a = Math.min(prog(lt, cue.start - 0.05, 0.25), 1 - prog(lt, cue.end + 0.25, 0.25));
  if (a <= 0) return;
  const size = 28, maxW = 1500;
  const rows = wrap(cue.text, maxW, size, 500);
  // show at most 2 rows at a time: page through long lines in step with speech
  const pages = [];
  for (let i = 0; i < rows.length; i += 2) pages.push(rows.slice(i, i + 2));
  const frac = clamp((lt - cue.start) / Math.max(0.1, cue.end - cue.start));
  // weight pages by character count so paging tracks the voice
  const lens = pages.map(p => p.join(" ").length), tot = lens.reduce((x, y) => x + y, 0);
  let acc = 0, pi = 0;
  for (let i = 0; i < pages.length; i++) { acc += lens[i] / tot; if (frac <= acc + 1e-6) { pi = i; break; } pi = i; }
  const page = pages[pi];
  const lh = 40, bh = page.length * lh + 26, by = 1040 - bh;
  const bw = Math.max(...page.map(r => measure(r, size, 500))) + 60;
  save(() => {
    rrect(W / 2 - bw / 2, by, bw, bh, 12, "rgba(6,9,15,0.78)");
    page.forEach((r, i) => text(r, W / 2, by + 13 + lh / 2 + i * lh, { size, weight: 500, align: "center", color: "#f3f6fb" }));
  }, a);
}

const CHAPTERS = [
  ["intro", "Intro"], ["layers", "Layers"], ["ip", "IP"], ["ports", "Ports"], ["udp", "UDP"],
  ["tcp", "TCP"], ["connection", "What is a connection?"], ["usecases", "Real problems"],
  ["quic", "QUIC"], ["recap", "Recap"],
];
function progressBar(T) {
  const dur = TIMELINE.duration;
  ctx.fillStyle = "#1a2336"; ctx.fillRect(0, H - 6, W, 6);
  ctx.fillStyle = C.ip; ctx.fillRect(0, H - 6, W * T / dur, 6);
  // chapter label top-right
  let ch = CHAPTERS[0][1];
  for (const [id, name] of CHAPTERS) {
    const s = TIMELINE.scenes.find(x => x.id === id);
    if (s && T >= s.start) ch = name;
  }
  text(ch.toUpperCase(), W - 90, 80, { size: 18, weight: 700, color: C.faint, align: "right", spacing: 3 });
}

// position along a polyline of points, p in 0..1 (uniform speed)
function along(pts, p) {
  const seg = [];
  let tot = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(d); tot += d;
  }
  let d = clamp(p) * tot;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) {
      const f = seg[i] ? clamp(d / seg[i]) : 0;
      return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f), i];
    }
    d -= seg[i];
  }
  return pts[pts.length - 1];
}
