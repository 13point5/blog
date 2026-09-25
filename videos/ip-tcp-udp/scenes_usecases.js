// Scenes: real problems solved both ways, the decision rule, QUIC, recap.
/* global SCENES_FN */

function laneBox(x, y, w, h, label, color, a = 1) {
  save(() => {
    rrect(x, y, w, h, 18, C.panel, color + "aa", 3);
    rrect(x, y, 150, h, 18, color + "22");
    text(label, x + 75, y + h / 2, { size: 44, weight: 800, color, align: "center" });
  }, a);
}
function verdict(x, y, s, color, a) {
  save(() => {
    const w = measure(s, 26, 700) + 40;
    rrect(x - w / 2, y - 24, w, 48, 24, color + "22", color, 2);
    text(s, x, y, { size: 26, weight: 700, color, align: "center" });
  }, a);
}

// ---------------- use cases intro ----------------
SCENES_FN.usecases = (t, S) => {
  save(() => {
    text("Same problem.", 960, 280, { size: 90, weight: 800, align: "center" });
    rich([["Two ", C.text, 800], ["protocols", C.dim, 800], [".", C.text, 800]], 960, 390, { size: 90, align: "center" });
  }, S.p(0, 0.2));
  const items = [["📞", "video call"], ["🎮", "multiplayer game"], ["📦", "file download"], ["🔎", "DNS lookup"], ["🎬", "movie streaming"]];
  items.forEach(([e, n], i) => {
    const a = pop(t, 1.5 + i * 0.35, 0.5);
    save(() => {
      const x = 260 + i * 350, y = 640;
      at(x, y, 0.7 + 0.3 * a, () => {
        rrect(-150, -110, 300, 220, 20, C.panel, C.line, 2);
        emoji(e, 0, -25, 80);
        text(n, 0, 70, { size: 26, weight: 700, align: "center" });
      });
    }, clamp(a));
  });
  save(() => rich([["TCP", C.tcp, 800], ["  vs  ", C.dim], ["UDP", C.udp, 800]], 960, 840, { size: 44, align: "center" }), S.p(0, 3.5));
};

// ---------------- video call ----------------
// plays one lane of the audio simulation; u = time since lane start
function callLane(y, u, mode, labelA) {
  const N = 11, gapT = 0.8, travel = 1.3, lost = 4;
  const x0 = 380, x1 = 1030;
  // packets in flight
  const arrivals = [];
  const rtt = 2 * travel;
  for (let k = 1; k <= N; k++) {
    const ts = k * gapT;
    const f = (u - ts) / travel;
    if (k === lost) {
      if (f > 0) {
        const lf = 0.55;
        const x = lerp(x0, x1, Math.min(f, lf));
        save(() => { packet(x, y, "#" + k, f > lf ? C.bad : C.text, { size: 18, w: 58 }); if (f > lf) cross(x, y, 22, C.bad, 5); }, f > lf ? 1 - clamp((f - lf) * 1.2) : 1);
      }
      if (mode === "tcp") {
        const rs = ts + rtt; // resent after about a round trip
        const fr = (u - rs) / travel;
        if (fr > 0 && fr < 1) packet(lerp(x0, x1, fr), y + 40, "#4 resent", C.tcp, { size: 16 });
        arrivals.push([k, rs + travel]);
      }
      continue;
    }
    if (f > 0 && f < 1) packet(lerp(x0, x1, f), y, "#" + k, mode === "tcp" ? C.tcp : C.udp, { size: 18, w: 58 });
    arrivals.push([k, ts + travel]);
  }
  // play time for each packet
  const play = {};
  const byK = Object.fromEntries(arrivals);
  if (mode === "tcp") {
    let ready = 0;
    for (let k = 1; k <= N; k++) {
      if (byK[k] === undefined) continue;
      ready = Math.max(ready, byK[k]);
      play[k] = ready;
    }
  } else for (const [k, a] of arrivals) play[k] = a;
  // waiting pile (tcp)
  if (mode === "tcp") {
    const held = [];
    for (let k = lost + 1; k <= N; k++) if (byK[k] !== undefined && u >= byK[k] && u < play[k]) held.push(k);
    held.forEach((k, i) => packet(x1 + 40, y - 60 + i * 34 - 20, "#" + k, C.warn, { size: 16, w: 52, glow: 0 }));
    if (held.length) text("held: waiting for #4", x1 + 40, y + 70, { size: 18, weight: 700, color: C.warn, align: "center" });
  }
  // speaker output strip
  const sx = 1160, sw = 640, secs = 12.5;
  text(labelA, sx, y - 70, { size: 20, color: C.dim });
  rrect(sx, y - 40, sw, 80, 10, "#0a0f1a", C.line, 2);
  const px = s => sx + (s - gapT - travel) / secs * sw;
  // each packet = 20 ms of audio; it plays for gapT at its play time, pushed back if the speaker is busy
  let busyUntil = 0;
  const slots = [];
  for (let k = 1; k <= N; k++) {
    if (play[k] === undefined) { slots.push([k, null, null]); continue; }
    const st = Math.max(play[k], busyUntil);
    const dur = mode === "tcp" && st > (k * gapT + travel) + 0.3 ? gapT * 0.35 : gapT; // late audio gets rushed out
    busyUntil = st + dur;
    slots.push([k, st, dur]);
  }
  for (const [k, st, dur] of slots) {
    if (st === null) {
      // concealed glitch (udp)
      const s0 = k * gapT + travel;
      if (u > s0) {
        rrect(px(s0) + 1, y - 34, gapT / secs * sw - 2, 68, 4, C.warn + "33");
        text("~", px(s0) + gapT / secs * sw / 2, y, { size: 26, color: C.warn, align: "center" });
      }
      continue;
    }
    if (u < st) continue;
    const late = mode === "tcp" && dur < gapT;
    const vis = clamp((u - st) / dur);
    const col = late ? C.warn : mode === "tcp" ? C.tcp : C.udp;
    const w = dur / secs * sw * vis;
    ctx.save();
    ctx.beginPath(); ctx.rect(px(st), y - 36, w, 72); ctx.clip();
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const xx = px(st) + i / 40 * dur / secs * sw;
      const yy = y + Math.sin(i * 1.3 + k * 2) * 26 * (0.5 + 0.5 * hash(i + k * 40));
      i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
    }
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
  return { play, slots, px, gapT, travel, rtt };
}

SCENES_FN.call = (t, S) => {
  sceneTitle(t, "Problem 1 · A video call", C.app, "SAME PROBLEM, BOTH WAYS");
  // cue 0: the constraint
  save(() => {
    const x0 = 260, x1 = 1660, y = 400;
    ctx.beginPath();
    for (let i = 0; i <= 400; i++) {
      const x = lerp(x0, x1, i / 400);
      const yy = y + Math.sin(i * 0.35) * 60 * (0.4 + 0.6 * Math.abs(Math.sin(i * 0.031))) * hash(Math.floor(i / 3) + 1);
      i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
    }
    ctx.strokeStyle = C.app; ctx.lineWidth = 3; ctx.stroke();
    const cut = S.pw(0, "chopped", 0, 1.2);
    for (let k = 1; k < 10; k++) save(() => line(lerp(x0, x1, k / 10), y - 90, lerp(x0, x1, k / 10), y + 90, C.text, 2, [6, 6]), prog(cut, k / 10 - 0.1, 0.1));
    for (let k = 0; k < 10; k++) save(() => text(`#${k + 1}`, lerp(x0, x1, (k + 0.5) / 10), y + 120, { size: 22, mono: true, weight: 700, color: C.app, align: "center" }), cut);
    save(() => text("each packet = 20 ms of sound", 960, y - 140, { size: 32, weight: 700, align: "center" }), S.pw(0, "20 milliseconds", -0.4));
    save(() => {
      rrect(560, 640, 800, 120, 16, C.panel, C.warn, 2);
      text("deadline: play within ~150 ms", 960, 680, { size: 34, weight: 800, color: C.warn, align: "center" });
      text("or the conversation feels laggy", 960, 725, { size: 26, color: C.dim, align: "center" });
    }, S.pw(0, "150", -0.3));
  }, S.p(0, 0.2) * (1 - S.p(1, 0, 0.5)));

  const lanes = S.p(1, 0.2);
  save(() => {
    // TCP lane
    const hlT = 1 - 0.5 * S.p(2, 0, 0.5) * (1 - S.p(3, 0, 0.5));
    save(() => {
      laneBox(100, 190, 1740, 330, "TCP", C.tcp);
      emoji("🎤", 320, 355, 48); emoji("🔊", 1090, 355, 48);
      const r = callLane(355, t - S.c(1) - 0.6, "tcp", "what you hear →");
      const frozen = t - S.c(1) - 0.6;
      // annotate freeze once it happened
      const fz0 = 3 * r.gapT + r.travel + r.gapT, fz1 = r.play[4];
      if (frozen > fz0) {
        save(() => {
          rrect(r.px(fz0), 305, Math.max(0, r.px(Math.min(frozen, fz1)) - r.px(fz0)), 100, 6, C.bad + "22", C.bad, 2, [6, 5]);
          text("frozen", (r.px(fz0) + r.px(fz1)) / 2, 440, { size: 22, weight: 800, color: C.bad, align: "center" });
        }, 1);
      }
      if (frozen > fz1 + 0.3) text("stale burst", r.px(fz1) + 80, 440, { size: 22, weight: 800, color: C.warn, align: "center" });
      save(() => text("retransmit ≥ 1 round trip later — already too late", 700, 480, { size: 24, weight: 700, color: C.bad, align: "center" }), S.pw(1, "That takes", 0));
    }, hlT);
    // UDP lane
    const hlU = S.p(2, 0, 0.5) ? 1 : 0.35;
    save(() => {
      laneBox(100, 550, 1740, 330, "UDP", C.udp);
      emoji("🎤", 320, 715, 48); emoji("🔊", 1090, 715, 48);
      const u = t < S.c(2) ? -1 : t - S.c(2) - 0.6;
      const r = callLane(715, u, "udp", "what you hear →");
      const g0 = 4 * r.gapT + r.travel;
      if (u > g0) text("tiny glitch — conversation keeps going", r.px(g0) + 30, 800, { size: 22, weight: 800, color: C.udp, align: "center" });
      save(() => text("app notices #4 is missing, smooths over it", 700, 840, { size: 24, weight: 700, color: C.udp, align: "center" }), S.pw(2, "notices a gap", 0));
    }, lanes * (t < S.c(2) ? 0.35 : 1));
  }, lanes * (1 - S.p(3, 0.2, 0.6) * 0.8));
  // cue 3: who uses UDP
  save(() => {
    rrect(260, 300, 1400, 400, 24, "#0d1320f4", C.udp, 3);
    text("Zoom · FaceTime · Discord · WebRTC", 960, 400, { size: 50, weight: 800, align: "center" });
    rich([["send voice and video over ", C.text], ["UDP", C.udp, 800]], 960, 480, { size: 40, align: "center" });
    save(() => {
      text("trade-off: the app must handle loss, jitter, and congestion itself", 960, 600, { size: 30, color: C.warn, align: "center" });
    }, S.pw(3, "trade-off", 0));
  }, S.p(3, 0.2));
};

// ---------------- game ----------------
function gamePanel(x, y, w, h, t, mode, color, focus) {
  save(() => {
    rrect(x, y, w, h, 20, C.panel, color + "aa", 3);
    text(mode.toUpperCase(), x + 30, y + 44, { size: 40, weight: 800, color });
    const cx = x + w / 2, cy = y + h / 2 - 10, R = 190;
    circle(cx, cy, R, null, C.faint, 2);
    const period = 4.0, rate = 0.2;
    const pos = s => [cx + R * Math.cos(s * 1.1), cy + R * Math.sin(s * 1.1)];
    // updates: every `rate` seconds, one lost at phase 1.2s of each period
    const lostAt = s => Math.abs((s % period) - 1.2) < rate / 2;
    const lastUpdate = s => Math.floor(s / rate) * rate;
    let shown;
    const tu = lastUpdate(t);
    if (mode === "udp") {
      let s = tu;
      if (lostAt(s)) s -= rate;
      shown = pos(s);
    } else {
      // TCP: after a loss, delivery stalls ~0.9s, then stale updates rush out
      const ph = t % period, base = t - ph;
      const lossT = base + 1.2;
      if (ph >= 1.2 && ph < 2.1) shown = pos(lossT - rate);
      else if (ph >= 2.1 && ph < 2.35) { const f = (ph - 2.1) / 0.25; shown = pos(lerp(lossT, t, f)); } else shown = pos(tu);
    }
    // true position ghost
    const tp = pos(t);
    circle(tp[0], tp[1], 26, null, C.dim, 2);
    text("real", tp[0], tp[1] - 42, { size: 16, color: C.dim, align: "center" });
    glow(color, 20, () => circle(shown[0], shown[1], 22, color));
    text("what others see", cx, cy, { size: 20, color: C.dim, align: "center" });
    // update timeline
    const ty = y + h - 60;
    for (let i = 0; i < 30; i++) {
      const s = tu - (29 - i) * rate;
      const bx = x + 40 + i * ((w - 80) / 30);
      const lost = lostAt(s);
      let col = color;
      if (lost) col = C.bad;
      else if (mode === "tcp") { const ph = s % period; if (ph > 1.2 && ph < 2.1 && t - s < 2.1 - ph + 0.9 && (t % period) < 2.1 && (t % period) >= 1.2) col = C.warn; }
      rrect(bx, ty - 14, (w - 80) / 30 - 6, 28, 4, col + (lost ? "" : "99"));
      if (lost) cross(bx + ((w - 80) / 30 - 6) / 2, ty, 10, C.text, 3);
    }
    text("position updates (60 / s) →", x + 40, ty - 36, { size: 18, color: C.dim });
  }, focus);
}

SCENES_FN.game = (t, S) => {
  sceneTitle(t, "Problem 2 · A multiplayer game", C.app, "SAME PROBLEM, BOTH WAYS");
  const two = S.p(3, 0.2, 0.6);
  const fT = S.p(0, 0.2) * (t > S.c(2) ? 0.4 + 0.6 * S.p(3, 0) : 1);
  const fU = S.p(0, 0.2) * (t > S.c(1) && t < S.c(2) ? 0.4 : 1);
  save(() => {
    gamePanel(100, 190, 840, 700, t, "tcp", C.tcp, fT);
    gamePanel(980, 190, 840, 700, t, "udp", C.udp, fU);
    save(() => verdict(520, 250, "stutter · rubber-banding", C.bad, 1), S.pw(1, "stutter", -0.5));
    save(() => verdict(1400, 250, "lost one? the next is newer anyway", C.udp, 1), S.pw(2, "The next one", -0.3));
  }, 1 - two * 0.85);
  save(() => {
    rrect(260, 250, 1400, 580, 24, "#0d1320f4", C.app, 3);
    text("what real games do: two channels on top of UDP", 960, 320, { size: 38, weight: 800, align: "center" });
    rrect(330, 400, 600, 330, 18, C.panel, C.udp, 3);
    text("unreliable", 630, 450, { size: 34, weight: 800, color: C.udp, align: "center" });
    text("positions, aim, movement", 630, 520, { size: 26, align: "center" });
    text("lost? ignore it —", 630, 600, { size: 24, color: C.dim, align: "center" });
    text("newer data is coming", 630, 640, { size: 24, color: C.dim, align: "center" });
    rrect(990, 400, 600, 330, 18, C.panel, C.tcp, 3);
    text("reliable", 1290, 450, { size: 34, weight: 800, color: C.tcp, align: "center" });
    text("purchases, chat, match results", 1290, 520, { size: 26, align: "center" });
    text("own seq numbers + ACKs +", 1290, 600, { size: 24, color: C.dim, align: "center" });
    text("resend, just for these", 1290, 640, { size: 24, color: C.dim, align: "center" });
  }, two);
};

// ---------------- download ----------------
SCENES_FN.download = (t, S) => {
  sceneTitle(t, "Problem 3 · Download a file, load a page", C.app, "SAME PROBLEM, BOTH WAYS");
  const c0 = S.p(0, 0.2) * (1 - S.p(1, 0, 0.5));
  save(() => {
    // byte grid
    const gx = 200, gy = 260, cols = 16, rows = 10, cs = 30;
    const miss = S.pw(0, "One missing", 0, 0.4);
    text("installer.zip", gx, gy - 30, { size: 26, mono: true, weight: 700 });
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const bad = r === 6 && c === 9 && miss > 0.5;
      rrect(gx + c * (cs + 4), gy + r * (cs + 4), cs, cs, 4, bad ? C.bad : C.tcp + "88");
    }
    save(() => text("1 byte missing → the whole file is corrupt", gx, gy + rows * 34 + 50, { size: 28, weight: 700, color: C.bad }), miss);
    // code snippet
    const cx = 1020, cy = 300;
    rrect(cx, cy - 50, 760, 280, 16, "#05080e", C.line, 2);
    text("checkout.js", cx + 24, cy - 20, { size: 20, mono: true, color: C.dim });
    text("if (user.ok) {", cx + 30, cy + 40, { size: 30, mono: true });
    rich([["  pay(amount", C.text], [miss > 0.5 ? "" : ")", C.text], [";", C.text]], cx + 30, cy + 90, { size: 30, mono: true });
    text("}", cx + 30, cy + 140, { size: 30, mono: true });
    save(() => {
      text("SyntaxError: missing ) after argument list", cx + 30, cy + 190, { size: 22, mono: true, color: C.bad });
    }, miss);
    save(() => text("every single byte matters", 960, 760, { size: 44, weight: 800, align: "center" }), S.pw(0, "every single", 0));
  }, c0);

  // TCP
  save(() => {
    laneBox(100, 200, 1720, 300, "TCP", C.tcp);
    const u = t - S.c(1) - 0.5;
    const stall0 = 2.2, stall1 = 3.0;
    let p;
    if (u < stall0) p = u / 6; else if (u < stall1) p = stall0 / 6; else p = (u - (stall1 - stall0)) / 6;
    p = clamp(p);
    rrect(320, 320, 1400, 60, 12, C.panel2, C.tcp + "88", 2);
    rrect(324, 324, 1392 * p, 52, 10, C.tcp);
    text(`${Math.round(p * 100)}%`, 1720, 420, { size: 26, mono: true, weight: 700, align: "right" });
    if (u > stall0) save(() => text("a loss: +1 round trip, then carries on", 324 + 1392 * (stall0 / 6), 420, { size: 22, color: C.warn, weight: 700, align: "center" }), 1);
    save(() => { check(360, 460, 14); text("every byte, in order — zero extra work in your app", 390, 460, { size: 26, weight: 700, color: C.tcp }); }, S.pw(1, "zero extra", 0));
  }, S.p(1, 0.2));
  // UDP
  save(() => {
    laneBox(100, 530, 1720, 360, "UDP", C.udp);
    text("you'd have to build it all yourself:", 320, 580, { size: 28, weight: 700, color: C.dim });
    const items = [["sequence numbers", "sequence numbers"], ["acknowledgements", "acknowledgements"], ["retransmission", "retransmission"], ["congestion control", "congestion control yourself"]];
    items.forEach(([n, w], i) => save(() => {
      const x = 330 + (i % 2) * 560, y = 650 + Math.floor(i / 2) * 64;
      text("🔧", x, y, { size: 28 });
      text(n, x + 50, y, { size: 30, weight: 700 });
    }, S.pw(2, w, -0.2, 0.4)));
    save(() => {
      rrect(1420, 600, 380, 180, 14, C.bad + "18", C.bad, 2);
      text("get it wrong →", 1610, 650, { size: 26, weight: 700, color: C.bad, align: "center" });
      text("flood the network", 1610, 700, { size: 28, weight: 800, color: C.bad, align: "center" });
      text("for everyone", 1610, 740, { size: 24, color: C.bad, align: "center" });
    }, S.pw(2, "flood", -0.5));
    save(() => verdict(960, 850, "for decades, the answer: just use TCP", C.tcp, 1), S.pw(2, "for decades", 0));
  }, S.p(2, 0.2));
};

// ---------------- DNS ----------------
SCENES_FN.dns = (t, S) => {
  sceneTitle(t, "Problem 4 · DNS lookup", C.app, "SAME PROBLEM, BOTH WAYS");
  const c0 = S.p(0, 0.2) * (1 - S.p(1, 0, 0.5));
  save(() => {
    laptop(360, 470, 1.1, C.text, "your laptop");
    server(1560, 470, 1.1, C.text, "DNS server", ":53");
    const q = S.pw(0, "turning a name", 0, 1.2), a = S.pw(0, "The question", 0, 1.2);
    if (q > 0 && q < 1) packet(lerp(480, 1440, q), 420, "example.com ?", C.app, { size: 24 });
    if (a > 0 && a < 1) packet(lerp(1440, 480, a), 530, "→ 203.0.113.10", C.tcp, { size: 24 });
    save(() => text("question ≈ 40 bytes · answer ≈ 60 bytes: one small packet each", 960, 720, { size: 30, color: C.dim, align: "center" }), S.pw(0, "each fit", 0));
    save(() => text("(203.0.113.10 is a placeholder address)", 960, 780, { size: 20, color: C.faint, align: "center" }), S.pw(0, "each fit", 0));
  }, c0);

  const diag = (x, label, color, a) => save(() => {
    rrect(x, 190, 800, 700, 20, C.panel, color + "aa", 3);
    text(label, x + 400, 232, { size: 34, weight: 800, color, align: "center" });
    const cx = x + 150, sx = x + 650;
    text("client", cx, 280, { size: 22, weight: 700, align: "center" });
    text("server", sx, 280, { size: 22, weight: 700, align: "center" });
    line(cx, 300, cx, 870, C.faint, 3); line(sx, 300, sx, 870, C.faint, 3);
  }, a);
  const ms = (x, y1, y2, label) => {
    line(x, y1, x, y2, C.warn, 4); line(x, y1, x + 16, y1, C.warn, 4); line(x, y2, x + 16, y2, C.warn, 4);
    text(label, x - 12, (y1 + y2) / 2, { size: 24, weight: 800, color: C.warn, align: "right" });
  };
  const both = S.p(1, 0.2);
  // TCP side
  diag(100, "DNS over TCP", C.tcp, both);
  save(() => {
    const cx = 250, sx = 750;
    seqArrow(cx, 330, sx, 400, "SYN", { p: S.p(1, 0.5, 0.8), size: 22 });
    seqArrow(sx, 410, cx, 480, "SYN-ACK", { p: S.p(1, 1.3, 0.8), size: 22 });
    seqArrow(cx, 490, sx, 560, "ACK + query", { p: S.p(1, 2.1, 0.8), size: 22, color: C.app });
    seqArrow(sx, 570, cx, 640, "answer", { p: S.p(1, 2.9, 0.8), size: 22, color: C.tcp });
    save(() => { ms(cx - 40, 330, 640, "2 RTT"); }, S.p(1, 3.8));
    save(() => text("(+ closing the connection afterwards)", 500, 700, { size: 22, color: C.dim, align: "center" }), S.p(1, 4.5));
  }, both);
  // UDP side
  diag(1020, "DNS over UDP", C.udp, both);
  save(() => {
    const cx = 1170, sx = 1670;
    seqArrow(cx, 330, sx, 400, "query", { p: S.p(2, 0.4, 0.8), size: 22, color: C.app });
    seqArrow(sx, 410, cx, 480, "answer", { p: S.p(2, 1.2, 0.8), size: 22, color: C.udp });
    save(() => ms(cx - 40, 330, 480, "1 RTT"), S.p(2, 2.0));
    // retry
    const r = S.pw(2, "If no answer", 0, 0.5) * (1 - S.p(3, 0, 0.5));
    save(() => {
      const mx = (cx + sx) / 2;
      arrow(cx, 560, mx, 595, { color: C.bad, lw: 4, head: false });
      cross(mx, 595, 16);
      text("query (lost)", (cx + mx) / 2, 540, { size: 20, mono: true, weight: 700, color: C.bad, align: "center" });
      text("⏱ timeout", cx + 20, 660, { size: 22, color: C.warn });
      seqArrow(cx, 700, sx, 770, "query again", { p: S.pw(2, "asks again", 0, 0.8), size: 22, color: C.app });
      seqArrow(sx, 780, cx, 850, "answer", { p: S.pw(2, "asks again", 0.8, 0.8), size: 22, color: C.udp });
    }, r);
    save(() => {
      rrect(1060, 560, 720, 280, 16, C.panel2, C.tcp, 2);
      text("answer too big for one packet?", 1420, 620, { size: 28, weight: 800, align: "center" });
      text("server sets the TC (truncated) flag", 1420, 680, { size: 24, color: C.dim, align: "center" });
      rich([["→ client retries over ", C.text], ["TCP", C.tcp, 800]], 1420, 740, { size: 30, align: "center" });
    }, S.p(3, 0.3));
  }, both);
};

// ---------------- streaming ----------------
SCENES_FN.stream = (t, S) => {
  sceneTitle(t, "Problem 5 · Streaming a movie", C.app, "A TRICK QUESTION");
  const c01 = S.p(0, 0.2) * (1 - S.p(2, 0, 0.5));
  save(() => {
    // player
    const px = 410, py = 180, pw = 1100, ph = 470;
    const g = ctx.createLinearGradient(px, py, px + pw, py + ph);
    g.addColorStop(0, "#1b2b4a"); g.addColorStop(1, "#3a1f3f");
    rrect(px, py, pw, ph, 18, null, C.line, 2);
    ctx.save(); ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 18); ctx.clip();
    ctx.fillStyle = g; ctx.fillRect(px, py, pw, ph);
    // hills
    ctx.fillStyle = "#12203a";
    ctx.beginPath(); ctx.moveTo(px, py + ph);
    for (let i = 0; i <= 40; i++) ctx.lineTo(px + i / 40 * pw, py + ph * 0.7 + Math.sin(i * 0.5 + t * 0.2) * 40);
    ctx.lineTo(px + pw, py + ph); ctx.fill();
    circle(px + pw * 0.88, py + ph * 0.18, 36, "#ffd27a44");
    ctx.restore();
    const q = S.pw(0, "Actually", 0, 0.5);
    save(() => {
      rich([["video → ", C.text, 800], ["UDP", C.udp, 800], ["?", C.text, 800]], 960, py + 170, { size: 70, align: "center" });
      save(() => line(700, py + 170, 1220, py + 170, C.bad, 8), q);
    }, S.pw(0, "It's video", -0.3) * (1 - S.p(1, 0, 0.5)));
    save(() => rich([["Netflix streams over plain ", C.text, 800], ["TCP", C.tcp, 800]], 960, py + 300, { size: 52, align: "center" }), q * (1 - S.p(1, 0, 0.5)));
    // buffer bar
    const by = py + ph + 60;
    const playhead = 0.25 + (t - S.c(1)) * 0.004;
    rrect(px, by, pw, 30, 15, C.panel2);
    save(() => {
      rrect(px, by, pw * 0.8, 30, 15, C.dim + "66");
      rrect(px, by, pw * playhead, 30, 15, C.text);
      circle(px + pw * playhead, by + 15, 20, C.text);
      text("you are here", px + pw * playhead, by + 60, { size: 22, color: C.text, align: "center" });
      text("already downloaded: many seconds ahead", px + pw * 0.53, by - 26, { size: 22, color: C.dim, align: "center" });
      // lost chunk refilled
      const L = S.pw(1, "If a packet is lost", 0, 0.3), R = S.pw(1, "plenty of time", 0.6, 0.6);
      save(() => {
        rrect(px + pw * 0.66, by - 4, pw * 0.05, 38, 6, R > 0.5 ? C.tcp : C.bad);
        text(R > 0.5 ? "resent ✓" : "lost", px + pw * 0.685, by + 64, { size: 22, weight: 700, color: R > 0.5 ? C.tcp : C.bad, align: "center" });
      }, L);
      save(() => text("perfect quality · no glitches", 960, by + 130, { size: 32, weight: 800, color: C.tcp, align: "center" }), S.pw(1, "perfect quality", 0));
    }, S.p(1, 0.3));
  }, c01);
  // cue 2: the real question
  save(() => {
    const x = 410, w = 1100;
    text("video call", x, 220, { size: 28, weight: 700, color: C.app });
    rrect(x, 250, w, 30, 15, C.panel2);
    rrect(x, 250, w * 0.97, 30, 15, C.text);
    circle(x + w * 0.97, 265, 20, C.text);
    text("now — nothing to buffer: it hasn't been said yet", x + w, 320, { size: 22, color: C.dim, align: "right" });
    save(() => {
      text("Does late data still have value?", 960, 480, { size: 66, weight: 800, align: "center" });
      rrect(460, 580, 460, 160, 20, C.tcp + "18", C.tcp, 3);
      text("yes", 690, 630, { size: 34, weight: 800, color: C.tcp, align: "center" });
      text("→ TCP", 690, 685, { size: 40, weight: 800, align: "center" });
      rrect(1000, 580, 460, 160, 20, C.udp + "18", C.udp, 3);
      text("no", 1230, 630, { size: 34, weight: 800, color: C.udp, align: "center" });
      text("→ UDP", 1230, 685, { size: 40, weight: 800, align: "center" });
    }, S.pw(2, "does late data", -0.3));
  }, S.p(2, 0.2));
};

// ---------------- decision ----------------
SCENES_FN.decide = (t, S) => {
  sceneTitle(t, "The mental model", C.text, "SO WHICH ONE?");
  const col = (x, name, color, tag, items, ci) => {
    save(() => {
      rrect(x, 190, 780, 700, 24, C.panel, color, 3);
      text(name, x + 50, 270, { size: 80, weight: 800, color });
      text(tag, x + 50, 345, { size: 32, weight: 700 });
      items.forEach(([e, n, w], i) => save(() => {
        emoji(e, x + 80, 440 + i * 85, 44);
        text(n, x + 130, 440 + i * 85, { size: 34, weight: 600 });
      }, S.pw(ci, w, -0.2, 0.4)));
    }, S.p(ci, 0));
  };
  col(140, "TCP", C.tcp, "every byte must arrive, in order", [
    ["🌐", "web pages & APIs", "Web pages"], ["📁", "file transfers", "file transfers"], ["✉️", "email", "email"], ["🔐", "SSH", "SSH"], ["🗄️", "databases", "databases"],
  ], 1);
  col(1000, "UDP", C.udp, "fresh beats complete", [
    ["📞", "voice & video calls", "Voice"], ["🎮", "games", "games"], ["📡", "live broadcasts", "live broadcasts"], ["🔎", "DNS", "DNS"], ["⏱️", "time sync (NTP)", "time sync"],
  ], 2);
};

// ---------------- QUIC ----------------
SCENES_FN.quic = (t, S) => {
  sceneTitle(t, "The twist: QUIC", C.quic, "HTTP/3");
  const c0 = S.p(0, 0.2) * (1 - S.p(1, 0, 0.5));
  save(() => {
    const stack = (x, title, rows) => {
      text(title, x + 280, 230, { size: 34, weight: 800, align: "center" });
      rows.forEach(([n, c, h], i) => {
        const y = 280 + rows.slice(0, i).reduce((s, r) => s + r[2] + 12, 0);
        rrect(x, y, 560, h, 14, c + "26", c, 3);
        text(n, x + 280, y + h / 2, { size: 32, weight: 800, color: c, align: "center" });
      });
    };
    stack(300, "classic web", [["HTTP/1.1 or HTTP/2", C.app, 100], ["TLS (encryption)", C.dim, 100], ["TCP", C.tcp, 100], ["IP", C.ip, 100]]);
    save(() => stack(1060, "HTTP/3", [["HTTP/3", C.app, 100], ["QUIC  (reliability + TLS built in)", C.quic, 212], ["UDP", C.udp, 100], ["IP", C.ip, 100]]), S.pw(0, "HTTP/3", -0.3, 0.8));
  }, c0);

  // cue 1: streams
  const c1 = S.p(1, 0.2) * (1 - S.p(2, 0, 0.5));
  save(() => {
    const lane = (y, name, color, indep) => {
      laneBox(100, y, 1720, 300, name, color);
      const streams = [["image A", C.app], ["image B", C.ip], ["script C", C.warn]];
      const u = t - S.c(1) - 1.0;
      const lossT = 1.2, resend = 3.0;
      streams.forEach(([n, c], i) => {
        const yy = y + 70 + i * 80;
        text(n, 300, yy, { size: 24, weight: 700, color: c });
        rrect(460, yy - 16, 1300, 32, 8, C.panel2);
        let p;
        const blocked = indep ? i === 0 : true;
        if (u < lossT) p = u;
        else if (u < resend) p = blocked ? lossT : u;
        else p = blocked ? lossT + (u - resend) : u;
        p = clamp(p / 9);
        rrect(460, yy - 16, 1300 * p, 32, 8, c);
        if (blocked && u > lossT && u < resend) text(i === 0 ? "packet lost — waiting for resend" : "blocked by A's loss!", 470 + 1300 * p + 14, yy, { size: 20, weight: 700, color: C.bad });
      });
    };
    lane(190, "TCP", C.tcp, false);
    save(() => lane(540, "QUIC", C.quic, true), S.pw(1, "many independent", -0.5));
    save(() => text("one lost packet blocks only its own stream", 960, 880, { size: 30, weight: 800, color: C.quic, align: "center" }), S.pw(1, "doesn't block", 0));
  }, c1);

  // cue 2 & 3: connection migration
  const mig = (y, mode, a) => save(() => {
    const color = mode === "tcp" ? C.tcp : C.quic;
    laneBox(100, y, 1720, 330, mode === "tcp" ? "TCP" : "QUIC", color);
    const ci = mode === "tcp" ? 2 : 3;
    const sw = S.pw(ci, mode === "tcp" ? "switches" : "Your IP can change", 0, 0.5);
    phone(360, y + 150, 0.9);
    text(sw > 0.5 ? "📶 cellular" : "📡 Wi-Fi", 360, y + 245, { size: 22, weight: 700, align: "center" });
    text(sw > 0.5 ? "100.64.3.7" : "192.168.1.20", 360, y + 280, { size: 22, mono: true, color: sw > 0.5 ? C.warn : C.dim, align: "center" });
    // packet
    const u = (t - S.w(ci, mode === "tcp" ? "switches" : "Your IP can change") - 0.6) / 1.4;
    const lab = mode === "tcp" ? "src 100.64.3.7:40001" : "conn ID 7f3a91 · src 100.64.3.7";
    if (u > 0 && u < 1) packet(lerp(460, 1050, easeIO(u)), y + 150, lab, color, { size: 18 });
    // server table
    const tx = 1100, ty = y + 40;
    rrect(tx, ty, 680, 250, 14, C.panel2, C.line, 2);
    text(mode === "tcp" ? "server looks up by 4 values" : "server looks up by connection ID", tx + 20, ty + 30, { size: 22, weight: 700, color: C.dim });
    text(mode === "tcp" ? "192.168.1.20:52100 ↔ :443" : "7f3a91 → connection state", tx + 30, ty + 90, { size: 26, mono: true, color: C.text });
    const res = u >= 1;
    if (res) save(() => {
      if (mode === "tcp") {
        text("100.64.3.7:40001 ?  no match", tx + 30, ty + 150, { size: 26, mono: true, weight: 700, color: C.bad });
        cross(tx + 620, ty + 150, 22);
        text("→ every TCP connection breaks", tx + 30, ty + 205, { size: 26, weight: 800, color: C.bad });
      } else {
        glow(C.quic, 20, () => rrect(tx + 16, ty + 64, 648, 52, 8, null, C.quic, 3));
        check(tx + 620, ty + 150, 16, C.quic);
        text("same connection, new address", tx + 30, ty + 150, { size: 26, weight: 800, color: C.quic });
        text("→ it just keeps going", tx + 30, ty + 205, { size: 26, weight: 700, color: C.quic });
      }
    }, prog(u, 1, 0.3));
  }, a);
  mig(190, "tcp", S.p(2, 0.2));
  mig(550, "quic", S.p(3, 0.2));
};

// ---------------- recap ----------------
SCENES_FN.recap = (t, S) => {
  sceneTitle(t, "Recap", C.text, "WHAT TO REMEMBER");
  const rows = [
    ["IP", C.ip, "moves packets between machines, hop by hop — no guarantees", 0],
    ["UDP", C.udp, "adds ports + a checksum, then gets out of the way", 1],
    ["TCP", C.tcp, "handshake, sequence numbers, ACKs, retransmission, flow control", 2],
    ["connection", C.text, "not a wire: a record in memory on two machines", 3],
  ];
  rows.forEach(([n, c, d, ci], i) => save(() => {
    const y = 250 + i * 150, x = 150 + (1 - S.p(ci, 0.1)) * 40;
    rrect(x, y - 55, 1620, 110, 18, C.panel, c + "88", 2);
    text(n, x + 40, y, { size: 44, weight: 800, color: c });
    text(d, x + 360, y, { size: 32, weight: 600, max: 1220 });
  }, S.p(ci, 0.1)));
  save(() => text("alive exactly as long as both sides — and everything between — remember it", 960, 860, { size: 30, weight: 700, color: C.tcp, align: "center" }), S.pw(3, "It's alive", 0));
};
