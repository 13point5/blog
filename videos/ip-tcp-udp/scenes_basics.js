// Scenes: intro, layers, IP, best effort, ports, UDP, TCP, handshake, reliability, flow control.
/* global SCENES_FN */

// ---------------- intro ----------------
const MESH = (() => {
  const nodes = [];
  for (let i = 0; i < 34; i++) nodes.push([120 + hash(i) * 1680, 190 + hash(i + 50) * 660]);
  const links = [];
  nodes.forEach((a, i) => {
    const d = nodes.map((b, j) => [Math.hypot(a[0] - b[0], a[1] - b[1]), j]).sort((x, y) => x[0] - y[0]);
    for (let k = 1; k <= 2; k++) links.push([i, d[k][1]]);
  });
  return { nodes, links };
})();
const INTRO_ROUTE = [[230, 560], [520, 430], [800, 640], [1100, 400], [1400, 600], [1690, 560]];

SCENES_FN.intro = (t, S) => {
  const titleA = S.p(1, 0, 0.8);
  // background mesh with packets flying around
  save(() => {
    for (const [i, j] of MESH.links) line(...MESH.nodes[i], ...MESH.nodes[j], "#1f2a40", 2);
    for (const n of MESH.nodes) circle(n[0], n[1], 6, "#1c2740", "#2b3957", 2);
    for (let k = 0; k < 26; k++) {
      const [i, j] = MESH.links[Math.floor(hash(k + 7) * MESH.links.length)];
      const ph = (t * (0.25 + hash(k) * 0.3) + hash(k + 3)) % 1;
      const a = MESH.nodes[i], b = MESH.nodes[j];
      const col = [C.ip, C.tcp, C.udp][k % 3];
      circle(lerp(a[0], b[0], ph), lerp(a[1], b[1], ph), 4, col);
    }
  }, lerp(1, 0.35, titleA));
  // laptop -> server stream
  save(() => {
    for (let i = 1; i < INTRO_ROUTE.length; i++) line(...INTRO_ROUTE[i - 1], ...INTRO_ROUTE[i], C.ip + "55", 4);
    for (let k = 0; k < 8; k++) {
      const ph = ((t - 1) * 0.22 - k * 0.12);
      if (ph < 0 || ph > 1) continue;
      const [x, y] = along(INTRO_ROUTE, ph);
      rrect(x - 13, y - 9, 26, 18, 4, [C.tcp, C.udp, C.ip][k % 3]);
    }
    laptop(230, 560, 1, C.text, "you");
    server(1690, 560, 1, C.text, "a server");
  }, win(t, 0.3) * lerp(1, 0.18, titleA));

  // title
  save(() => {
    const y = 400;
    const parts = [["IP", C.ip, S.w(1, "IP")], ["TCP", C.tcp, S.w(1, "TCP")], ["UDP", C.udp, S.w(1, "UDP")]];
    const xs = [560, 960, 1370];
    parts.forEach(([s, col, tw], i) => {
      const a = pop(t, tw, 0.6);
      save(() => at(xs[i], y, 0.6 + 0.4 * a, () => glow(col, 40, () => text(s, 0, 0, { size: 150, weight: 800, color: col, align: "center" }))), clamp(a));
    });
    save(() => text("how the internet actually moves your data", 960, 530, { size: 36, color: C.dim, align: "center" }), S.p(1, 2.5));
  }, 1);
  const bullets = [
    ["How each one works under the hood", S.w(2, "how each")],
    ["What a TCP “connection” physically is", S.w(2, "what it really")],
    ["Real problems: which one, and why", S.w(2, "which one")],
  ];
  bullets.forEach(([b, tw], i) => {
    const a = prog(t, tw, 0.6);
    save(() => {
      const y = 640 + i * 70, x = 660 + (1 - a) * 40;
      circle(x, y, 8, [C.ip, C.tcp, C.udp][i]);
      text(b, x + 30, y, { size: 36, weight: 600 });
    }, a);
  });
};

// ---------------- layers ----------------
SCENES_FN.layers = (t, S) => {
  sceneTitle(t, "Layers: envelopes inside envelopes", C.text, "THE BIG PICTURE");
  const aT = S.p(1, 0.2, 1.0), aI = S.p(2, 0.2, 1.0), aL = S.p(3, 0.2, 1.0);
  const focus = S.p(4, 0.3, 0.8);
  const pad = 22, P = 380, PH = 110;
  const layers = [
    { key: "link", a: aL, hdr: 250, color: C.link, name: "Wi-Fi frame", l1: "to: home router", l2: "(next hop only)" },
    { key: "ip", a: aI, hdr: 400, color: C.ip, name: "IP header", l1: "src 192.168.1.20", l2: "dst 142.250.72.14" },
    { key: "tcp", a: aT, hdr: 320, color: C.tcp, name: "TCP header", l1: "src port 52100", l2: "dst port 443" },
  ];
  // sizes inside-out
  let w = P, h = PH;
  const sizes = [];
  for (let k = layers.length - 1; k >= 0; k--) {
    const L = layers[k];
    w += L.a * (L.hdr + 3 * pad); h += L.a * 2 * pad;
    sizes[k] = [w, h];
  }
  const cy = 440 + focus * 60;
  let x = 960 - w / 2;
  for (let k = 0; k < layers.length; k++) {
    const L = layers[k];
    if (L.a <= 0.001) continue;
    const [bw, bh] = sizes[k];
    const dim = focus * (L.key === "ip" ? 0 : 0.6);
    save(() => {
      rrect(x, cy - bh / 2, bw, bh, 16, L.color + "14", L.color, 3);
      const hx = x + pad * L.a, hw = L.hdr * L.a, hh = bh - 2 * pad * L.a;
      const draw = () => rrect(hx, cy - hh / 2, hw, hh, 10, L.color + "33", L.color, 2);
      if (L.key === "ip" && focus > 0) glow(C.ip, 40 * focus, draw); else draw();
      save(() => {
        text(L.name, hx + 20, cy - 34, { size: 22, weight: 700, color: L.color });
        text(L.l1, hx + 20, cy + 4, { size: 22, mono: true, max: hw - 30 });
        text(L.l2, hx + 20, cy + 36, { size: 22, mono: true, max: hw - 30, color: L.key === "link" ? C.dim : C.text });
      }, clamp((L.a - 0.6) / 0.4));
    }, L.a * (1 - dim));
    x += L.a * (pad + L.hdr + pad);
  }
  // payload
  save(() => {
    rrect(x, cy - PH / 2, P, PH, 10, C.app + "26", C.app, 3);
    text("app data", x + 20, cy - 26, { size: 22, weight: 700, color: C.app });
    text("GET /index.html", x + 20, cy + 14, { size: 28, mono: true });
  }, S.p(0, 0.8) * (1 - focus * 0.6));

  // legend
  const leg = [
    ["Application", "HTTP, DNS, your app", "what to say", C.app, S.p(1, 0)],
    ["Transport", "TCP or UDP", "which program? → port", C.tcp, S.w(1, "port") ],
    ["Network", "IP", "which machine? → IP address", C.ip, S.w(2, "IP address")],
    ["Link", "Wi-Fi, Ethernet", "only the next box on the path", C.link, S.w(3, "next box")],
  ];
  leg.forEach(([n, ex, what, col, tw], i) => {
    const a = i === 0 ? tw : prog(t, tw, 0.6);
    const lx = 160 + i * 410, ly = 740;
    save(() => {
      rrect(lx, ly, 370, 120, 12, C.panel, col + "88", 2);
      rrect(lx, ly, 8, 120, 4, col);
      text(n, lx + 28, ly + 30, { size: 26, weight: 800, color: col });
      text(ex, lx + 28, ly + 64, { size: 22, color: C.text });
      text(what, lx + 28, ly + 96, { size: 20, color: C.dim });
    }, a * (1 - focus));
  });
  // router reading the IP header
  save(() => {
    const rx = 960 - sizes[0][0] / 2 + pad + 250 + pad + pad + 200;
    router(rx, 250, 1.2, C.ip, null, 1);
    arrow(rx, 300, rx, cy - 70, { color: C.ip, lw: 3, dash: [8, 8] });
    text("a router reads only this", rx + 70, 240, { size: 30, weight: 700, color: C.ip });
    text("…and forwards it. The rest is just cargo.", rx + 70, 280, { size: 26, color: C.dim });
    save(() => {
      text("Each layer reads only its own envelope.", 960, 780, { size: 38, weight: 700, align: "center" });
    }, S.p(4, 0.8));
  }, focus);
};

// ---------------- IP ----------------
const NET = {
  n: {
    A: [150, 560], R1: [370, 560], R2: [610, 410], R3: [610, 720], R4: [880, 300], R5: [880, 560], R6: [880, 800],
    R7: [1160, 410], R8: [1160, 720], R9: [1440, 560], B: [1720, 560],
  },
  links: [["A", "R1"], ["R1", "R2"], ["R1", "R3"], ["R2", "R4"], ["R2", "R5"], ["R3", "R5"], ["R3", "R6"], ["R4", "R7"],
    ["R5", "R7"], ["R5", "R8"], ["R6", "R8"], ["R7", "R9"], ["R8", "R9"], ["R9", "B"], ["R4", "R5"], ["R6", "R5"]],
};
const P_MAIN = ["A", "R1", "R2", "R5", "R7", "R9", "B"];
const P_FAST = ["A", "R1", "R2", "R4", "R7", "R9", "B"];
const P_SLOW = ["A", "R1", "R3", "R6", "R8", "R9", "B"];
const pts = path => path.map(k => NET.n[k]);

function drawNet(o = {}) {
  for (const [a, b] of NET.links) line(...NET.n[a], ...NET.n[b], "#2a3654", 4);
  for (const [k, p] of Object.entries(NET.n)) {
    if (k === "A") laptop(p[0], p[1], 0.8, C.text, "you", "192.168.1.20");
    else if (k === "B") server(p[0], p[1], 0.8, C.text, "server", "142.250.72.14");
    else router(p[0], p[1], 0.9, C.ip, k, (o.hl && o.hl[k]) || 0);
  }
}
// hop-by-hop travel with pauses at routers; returns [x, y, hopIndex, arrived]
function hopTravel(path, t0, t, move = 0.75, pause = 0.55) {
  const P = pts(path), per = move + pause;
  const u = t - t0;
  if (u <= 0) return [...P[0], 0, false, false];
  const i = Math.floor(u / per);
  if (i >= P.length - 1) return [...P[P.length - 1], P.length - 1, true, false];
  const f = clamp((u - i * per) / move);
  const e = easeIO(f);
  return [lerp(P[i][0], P[i + 1][0], e), lerp(P[i][1], P[i + 1][1], e), f >= 1 ? i + 1 : i, false, f >= 1];
}

SCENES_FN.ip = (t, S) => {
  sceneTitle(t, "IP: addresses and hops", C.ip, "THE NETWORK LAYER");
  // cue 0: the address
  save(() => {
    const bytes = [142, 250, 72, 14];
    text("142.250.72.14", 960, 330, { size: 110, weight: 700, mono: true, align: "center", color: C.ip });
    bytes.forEach((b, i) => {
      const a = S.pw(0, "32-bit", 0.3 + i * 0.25);
      const x = 420 + i * 360;
      save(() => {
        rrect(x - 150, 470, 300, 150, 14, C.panel, C.ip + "88", 2);
        text(String(b), x, 510, { size: 40, weight: 800, align: "center" });
        text(b.toString(2).padStart(8, "0"), x, 575, { size: 36, mono: true, align: "center", color: C.ip });
        text(`byte ${i + 1}`, x, 650, { size: 20, color: C.dim, align: "center" });
      }, a);
    });
    save(() => text("32 bits = 4 bytes  →  about 4.3 billion possible addresses", 960, 740, { size: 32, color: C.dim, align: "center" }), S.pw(0, "four bytes", 0.5));
  }, S.p(0, 0.3) * (1 - S.p(1, 0, 0.5)));

  // cue 1: the header
  save(() => {
    const fields = [
      ["source", "src 192.168.1.20", 360, "source address"],
      ["destination", "dst 142.250.72.14", 380, "destination address"],
      ["time to live", "TTL 64", 170, "time to live"],
      ["protocol", "proto = TCP", 230, "what's inside"],
    ];
    let x = 250;
    const y = 470;
    rrect(230, y - 70, 1460, 140, 16, C.ip + "10", C.ip, 3);
    text("IP header", 250, y - 105, { size: 26, weight: 700, color: C.ip });
    text("data (a TCP or UDP segment)", 1560, y - 105, { size: 24, weight: 600, color: C.dim, align: "right" });
    fields.forEach(([lab, val, w, word]) => {
      const a = S.pw(1, word, -0.2, 0.5);
      const hl = a * (1 - S.pw(1, word, 1.6, 0.6));
      save(() => {
        const draw = () => rrect(x, y - 50, w, 100, 10, hl > 0.5 ? C.ip + "44" : C.panel2, C.ip, hl > 0.5 ? 3 : 2);
        if (hl > 0) glow(C.ip, 30 * hl, draw); else draw();
        text(val, x + w / 2, y, { size: 26, mono: true, align: "center", weight: 700 });
        text(lab, x + w / 2, y + 90, { size: 22, color: hl > 0.5 ? C.ip : C.dim, align: "center" });
      }, a);
      x += w + 16;
    });
    save(() => {
      rrect(x, y - 50, 1690 - x - 20, 100, 10, C.tcp + "22", C.tcp + "88", 2, [8, 6]);
      text("payload…", x + (1690 - x - 20) / 2, y, { size: 26, mono: true, align: "center", color: C.tcp });
    }, S.pw(1, "followed by data", 0.2));
    save(() => text("(the real header has a few more fields: length, checksum, flags…)", 960, 680, { size: 24, color: C.faint, align: "center" }), S.p(1, 6));
  }, S.p(1, 0.2) * (1 - S.p(2, 0, 0.5)));

  // cue 2+3: hop by hop on a map
  const mapA = S.p(2, 0.2) * (1 - 0.8 * S.pw(3, "If it ever", 0, 0.6));
  if (mapA > 0) {
    const t0 = S.c(2) + 1.4;
    const [px, py, hop, arrived, atRouter] = hopTravel(P_MAIN, t0, t);
    const hl = {};
    if (!arrived && hop > 0 && atRouter) hl[P_MAIN[hop]] = 1;
    save(() => {
      drawNet({ hl });
      // path trace
      for (let i = 0; i < hop; i++) line(...NET.n[P_MAIN[i]], ...NET.n[P_MAIN[i + 1]], C.ip, 6);
      const ttl = 64 - Math.max(0, Math.min(hop, 5) - (atRouter || arrived ? 0 : 0));
      packet(px, py - 50, `TTL ${ttl}`, C.ip, { size: 20 });
      circle(px, py, 11, C.ip);
      // routing table popup at the current router
      if (!arrived && hop > 0 && hop < P_MAIN.length - 1) {
        const r = NET.n[P_MAIN[hop]], nxt = P_MAIN[hop + 1];
        const pa = atRouter ? 1 : 0;
        save(() => {
          const bx = r[0] - 170, by = r[1] + (r[1] > 600 ? -250 : 60);
          rrect(bx, by, 340, 150, 10, "#0e1422ee", C.ip, 2);
          text(`${P_MAIN[hop]} routing table`, bx + 16, by + 24, { size: 18, weight: 700, color: C.ip });
          text("142.250.0.0/15", bx + 16, by + 62, { size: 20, mono: true, color: C.text });
          text(`→ ${nxt}`, bx + 324, by + 62, { size: 20, mono: true, color: C.tcp, align: "right" });
          text("10.0.0.0/8", bx + 16, by + 96, { size: 20, mono: true, color: C.faint });
          text("→ …", bx + 324, by + 96, { size: 20, mono: true, color: C.faint, align: "right" });
          text("0.0.0.0/0", bx + 16, by + 128, { size: 20, mono: true, color: C.faint });
          text("→ …", bx + 324, by + 128, { size: 20, mono: true, color: C.faint, align: "right" });
          rrect(bx + 8, by + 44, 324, 36, 6, null, C.tcp, 2);
        }, pa);
      }
      save(() => text("each hop: TTL − 1", 1440, 820, { size: 28, weight: 700, color: C.warn, align: "center" }), S.p(3, 0.3) * (1 - S.pw(3, "If it ever", 0, 0.4)));
    }, mapA);
  }
  // cue 3 vignette: a routing loop, TTL runs out
  save(() => {
    const cx = 960, cy = 520, R = 200;
    const ring = [0, 1, 2].map(k => [cx + R * Math.cos(-Math.PI / 2 + k * 2 * Math.PI / 3), cy + R * Math.sin(-Math.PI / 2 + k * 2 * Math.PI / 3)]);
    rrect(cx - 420, cy - 300, 840, 600, 20, "#0c1220f2", C.warn + "66", 2);
    text("a routing mistake: a loop", cx, cy - 262, { size: 26, weight: 700, color: C.warn, align: "center" });
    for (let k = 0; k < 3; k++) line(...ring[k], ...ring[(k + 1) % 3], "#2a3654", 4);
    ring.forEach((p, k) => router(p[0], p[1], 0.9, C.ip, "R" + (k + 1)));
    const t0 = S.w(3, "If it ever") + 0.4;
    const u = Math.max(0, t - t0), hopDur = 0.7, hops = Math.min(Math.floor(u / hopDur), 4);
    const ttl = 4 - hops;
    if (hops < 4) {
      const f = easeIO(clamp((u - hops * hopDur) / hopDur));
      const a = ring[hops % 3], b = ring[(hops + 1) % 3];
      packet(lerp(a[0], b[0], f), lerp(a[1], b[1], f), `TTL ${ttl}`, C.ip, { size: 20 });
    } else {
      const p = ring[4 % 3];
      packet(p[0], p[1] - 70, "TTL 0", C.bad, { size: 20 });
      save(() => { cross(p[0] + 100, p[1] - 70, 24); text("thrown away", p[0], p[1] - 130, { size: 28, weight: 700, color: C.bad, align: "center" }); }, prog(t, t0 + 4 * hopDur, 0.3));
    }
  }, S.pw(3, "If it ever", 0, 0.5));
};

// ---------------- best effort ----------------
function travel(path, t0, dur, t) {
  const p = (t - t0) / dur;
  if (p < 0) return null;
  return [...along(pts(path), easeIO(clamp(p)) * 0.999 + 0.0005), p >= 1];
}

SCENES_FN.besteffort = (t, S) => {
  sceneTitle(t, "IP is “best effort”", C.ip, "NO PROMISES");
  const mapA = S.p(0, 0.2) * (1 - S.p(3, 0, 0.6));
  // queue at R5
  const q0 = S.c(1);
  const sends = [
    { id: "1", path: P_MAIN, t0: q0 + 0.2, dur: 3.2, color: C.ip },
    { id: "2", path: P_MAIN, t0: q0 + 0.9, dur: 3.2, color: C.ip },
    { id: "3", path: P_MAIN, t0: q0 + 1.6, dur: 3.2, color: C.ip, dropAt: 0.5 },
    { id: "4", path: P_SLOW, t0: S.c(2) + 0.2, dur: 4.4, color: C.ip },
    { id: "5", path: P_FAST, t0: S.c(2) + 0.9, dur: 2.4, color: C.ip },
    { id: "4", path: P_MAIN, t0: S.c(2) + 1.6, dur: 3.4, color: C.ip, dup: true },
  ];
  if (mapA > 0) save(() => {
    drawNet();
    // queue bar next to R5
    const [rx, ry] = NET.n.R5;
    const drop = sends[2];
    const tArr1 = sends[0].t0 + sends[0].dur * 0.45, tArr2 = sends[1].t0 + sends[1].dur * 0.45;
    let level = 3 + (t > tArr1 ? 1 : 0) + (t > tArr2 ? 1 : 0);
    if (t > S.c(2)) level = Math.max(2, 5 - Math.floor((t - S.c(2)) / 0.8));
    save(() => {
      rrect(rx + 46, ry - 70, 36, 140, 6, C.panel2, level >= 5 ? C.bad : C.dim, 2);
      for (let i = 0; i < level; i++) rrect(rx + 51, ry + 42 - i * 27, 26, 22, 3, level >= 5 ? C.bad : C.warn);
      text("queue", rx + 64, ry + 92, { size: 18, color: C.dim, align: "center" });
    }, S.p(1, 0));
    for (const s of sends) {
      const r = travel(s.path, s.t0, s.dur, t);
      if (!r) continue;
      const [x, y, , done] = r;
      if (s.dropAt !== undefined && t > s.t0 + s.dur * s.dropAt) {
        const [dx, dy] = along(pts(s.path), s.dropAt);
        const u = t - (s.t0 + s.dur * s.dropAt);
        save(() => {
          packet(dx, dy - 50 - u * 20, s.id, C.bad, { size: 22 });
          cross(dx, dy - 50 - u * 20, 26);
        }, 1 - lin(u, 1.2, 1));
        save(() => text("queue full → dropped. No error sent.", dx + 100, dy + 120, { size: 26, weight: 700, color: C.bad }), win(t, s.t0 + s.dur * s.dropAt, S.c(2) + 0.5));
        continue;
      }
      if (done) continue;
      packet(x, y, s.id, s.dup ? C.warn : s.color, { size: 22 });
    }
    // arrivals
    const arr = sends.filter(s => s.dropAt === undefined).map(s => ({ ...s, at: s.t0 + s.dur })).sort((a, b) => a.at - b.at);
    save(() => {
      rrect(1380, 170, 470, 110, 12, C.panel, C.line, 2);
      text("arrived at server, in order received:", 1400, 196, { size: 18, color: C.dim });
      arr.forEach((s, i) => {
        const a = pop(t, s.at, 0.4);
        if (t < s.at) return;
        const bad = s.id === "5" || s.id === "4";
        save(() => packet(1420 + i * 70 + 20, 245, s.id, s.dup ? C.warn : bad && !s.dup ? C.warn : C.tcp, { size: 22 }), clamp(a));
        if (s.dup) save(() => text("twice!", 1420 + i * 70 + 20, 300, { size: 18, color: C.warn, align: "center", weight: 700 }), a);
      });
      save(() => text("3 never shows up", 1400, 320, { size: 20, color: C.bad, weight: 700 }), S.p(2, 3));
    }, S.p(1, 0));
  }, mapA);

  // big stamp in cue 0
  save(() => {
    at(960, 500, 1, () => {
      ctx.rotate(-0.06);
      glow(C.warn, 30, () => rrect(-420, -110, 840, 220, 20, "#0c1220ee", C.warn, 6));
      text("BEST EFFORT", 0, -20, { size: 96, weight: 800, color: C.warn, align: "center" });
      text("it tries — it promises nothing", 0, 60, { size: 32, color: C.text, align: "center" });
    });
  }, win(t, 0.5, S.c(1) + 0.3));

  // cue 3: which program?
  save(() => {
    const x = 1060, y = 230;
    rrect(x, y, 620, 560, 20, C.panel, C.line, 3);
    text("server 142.250.72.14", x + 30, y + 40, { size: 26, weight: 700 });
    const apps = [["web server", C.app], ["database", C.quic], ["SSH", C.udp]];
    apps.forEach(([n, col], i) => {
      rrect(x + 200, y + 110 + i * 140, 380, 100, 12, C.panel2, col, 2);
      text(n, x + 390, y + 160 + i * 140, { size: 30, weight: 700, align: "center" });
      save(() => text("?", x + 150, y + 160 + i * 140, { size: 48, weight: 800, color: C.warn, align: "center" }), S.p(3, 1.5 + i * 0.3));
    });
    const u = S.p(3, 0.3, 1.2);
    packet(lerp(300, x - 150, u), 500, "IP → 142.250.72.14", C.ip, { size: 22 });
    save(() => text("IP gets it to the machine…", 240, 400, { size: 34, weight: 700 }), S.p(3, 0.5));
    save(() => text("…but which program?", 240, 620, { size: 34, weight: 700, color: C.warn }), S.pw(3, "which program"));
  }, S.p(3, 0) * (1 - S.p(4, 0, 0.5)));

  // cue 4: the two gaps
  save(() => {
    const gaps = [["1", "Reliability", "lost · reordered · duplicated"], ["2", "Which program?", "IP stops at the machine"]];
    gaps.forEach(([n, h, sub], i) => {
      const a = S.p(4, 0.4 + i * 0.8);
      const x = 300 + i * 700, y = 300;
      save(() => {
        rrect(x, y, 620, 220, 20, C.panel, C.warn + "88", 3);
        circle(x + 70, y + 110, 40, C.warn + "33", C.warn, 3);
        text(n, x + 70, y + 112, { size: 40, weight: 800, color: C.warn, align: "center" });
        text(h, x + 140, y + 90, { size: 40, weight: 800 });
        text(sub, x + 140, y + 145, { size: 28, color: C.dim });
      }, a);
    });
    save(() => {
      text("TCP", 760, 680, { size: 90, weight: 800, color: C.tcp, align: "center" });
      text("and", 960, 680, { size: 36, color: C.dim, align: "center" });
      text("UDP", 1160, 680, { size: 90, weight: 800, color: C.udp, align: "center" });
      text("fill these gaps — very differently", 960, 770, { size: 32, color: C.dim, align: "center" });
    }, S.pw(4, "exactly what"));
  }, S.p(4, 0.2));
};

// ---------------- ports ----------------
SCENES_FN.ports = (t, S) => {
  sceneTitle(t, "Ports: which program?", C.tcp, "TCP AND UDP BOTH START HERE");
  // building analogy
  save(() => {
    const bx = 380, by = 260, bw = 440, bh = 560;
    rrect(bx, by, bw, bh, 8, C.panel, C.ip, 4);
    rrect(bx + 40, by - 60, bw - 80, 60, 8, C.ip + "33", C.ip, 3);
    text("142.250.72.14", bx + bw / 2, by - 30, { size: 30, mono: true, weight: 700, color: C.ip, align: "center" });
    const nums = ["22", "53", "80", "443", "5432", "8080"];
    nums.forEach((n, i) => {
      const cx = bx + 60 + (i % 2) * 200, cy = by + 50 + Math.floor(i / 2) * 170;
      const hl = n === "443" ? S.p(0, 3.2) : 0;
      rrect(cx, cy, 120, 120, 8, hl ? C.tcp + "44" : "#0f1a2e", hl ? C.tcp : C.line, 2);
      text(n, cx + 60, cy + 60, { size: 30, mono: true, weight: 700, color: hl > 0.5 ? C.tcp : C.text, align: "center" });
    });
    rich([["IP address", C.ip, 800], [" = the building", C.text]], 1000, 430, { size: 46 });
    rich([["port", C.tcp, 800], [" = the apartment", C.text]], 1000, 530, { size: 46 });
    save(() => text("an address has both:  142.250.72.14 : 443", 1000, 640, { size: 30, mono: true, color: C.dim }), S.p(0, 3.5));
  }, S.p(0, 0.3) * (1 - S.p(1, 0, 0.5)));

  // machines
  const mA = S.p(1, 0.3);
  if (mA > 0) save(() => {
    // laptop panel
    const L = [110, 210, 620, 620];
    rrect(...L, 20, C.panel, C.line, 3);
    laptop(210, 290, 0.6);
    text("your laptop", 290, 270, { size: 28, weight: 700 });
    text("192.168.1.20", 290, 306, { size: 22, mono: true, color: C.ip });
    const lp = [["browser tab", "52100", S.pw(1, "52,100")], ["browser tab", "52101", S.pw(1, "52,100", 0.4)], ["music app", "52188", S.pw(1, "52,100", 0.8)]];
    lp.forEach(([n, p, a], i) => save(() => {
      rrect(150, 380 + i * 130, 540, 100, 12, C.panel2, C.app + "88", 2);
      text(n, 180, 430 + i * 130, { size: 28, weight: 600 });
      text(":" + p, 660, 430 + i * 130, { size: 30, mono: true, weight: 700, color: C.tcp, align: "right" });
    }, a));
    save(() => text("random temporary ports", 420, 790, { size: 22, color: C.dim, align: "center" }), S.pw(1, "random", 0.3));
    // server panel
    const sx = 1150;
    rrect(sx, 210, 660, 620, 20, C.panel, C.line, 3);
    server(sx + 90, 300, 0.55);
    text("server", sx + 170, 270, { size: 28, weight: 700 });
    text("142.250.72.14", sx + 170, 306, { size: 22, mono: true, color: C.ip });
    rrect(sx + 30, 370, 90, 420, 10, C.ip + "18", C.ip + "88", 2);
    at(sx + 75, 580, 1, () => { ctx.rotate(-Math.PI / 2); text("operating system", 0, 0, { size: 22, weight: 700, color: C.ip, align: "center" }); });
    const sp = [["web server", "443", S.pw(1, "443", -0.3)], ["DNS server", "53", S.pw(1, "port 53", -0.3)], ["SSH", "22", S.pw(1, "port 53", 0.6)]];
    const lit = [0, 0, 0];
    // packets for cue 2
    const d1 = S.w(2, "reads the destination") - 1.2, d2 = S.w(2, "hands the data") + 0.6;
    const pk = [[d1, 0, "dst port 443"], [d2, 1, "dst port 53"]];
    for (const [t0, row, lab] of pk) {
      const u = t - t0;
      if (u < 0) continue;
      const ry = 440 + row * 130;
      let x, y;
      if (u < 1.3) { const f = easeIO(u / 1.3); x = lerp(700, sx + 75, f); y = lerp(600, 580, f); }
      else if (u < 2.2) { const f = easeIO((u - 1.3) / 0.9); x = lerp(sx + 75, sx + 300, f); y = lerp(580, ry, f); }
      else { x = sx + 300; y = ry; lit[row] = prog(u, 2.2, 0.4); }
      if (u < 2.6) packet(x, y, lab, C.tcp, { size: 20 });
    }
    sp.forEach(([n, p, a], i) => save(() => {
      const hl = lit[i];
      const draw = () => rrect(sx + 150, 390 + i * 130, 480, 100, 12, hl > 0.5 ? C.tcp + "30" : C.panel2, hl > 0.5 ? C.tcp : C.app + "88", hl > 0.5 ? 3 : 2);
      if (hl > 0) glow(C.tcp, 30 * hl, draw); else draw();
      text(n, sx + 180, 440 + i * 130, { size: 28, weight: 600 });
      text(":" + p, sx + 600, 440 + i * 130, { size: 30, mono: true, weight: 700, color: C.tcp, align: "right" });
    }, a));
    save(() => {
      rrect(700, 240, 400, 110, 14, C.panel2, C.tcp + "88", 2);
      text("port = 16-bit number", 900, 278, { size: 26, weight: 700, color: C.tcp, align: "center" });
      text("0 – 65,535", 900, 318, { size: 26, mono: true, align: "center" });
    }, S.pw(1, "16-bit", 0, 0.6));
  }, mA);
};

// ---------------- UDP ----------------
function headerGrid(x, y, w, rows, o = {}) {
  // rows: [[ [label, bits, key], ... ], ...]
  const rh = o.rh || 84, col = o.color;
  if (o.ruler !== false) {
    text("0", x, y - 24, { size: 18, mono: true, color: C.dim });
    text("15", x + w / 2 - 6, y - 24, { size: 18, mono: true, color: C.dim, align: "right" });
    text("16", x + w / 2 + 6, y - 24, { size: 18, mono: true, color: C.dim });
    text("31  (bits)", x + w, y - 24, { size: 18, mono: true, color: C.dim, align: "right" });
  }
  rows.forEach((row, r) => {
    let cx = x;
    for (const [lab, bits, key] of row) {
      const fw = w * bits / 32;
      const a = o.alpha ? o.alpha(key) : 1, hl = o.hl ? o.hl(key) : 0;
      save(() => {
        const draw = () => rrect(cx + 3, y + r * rh + 3, fw - 6, rh - 6, 8, hl > 0.5 ? col + "44" : C.panel2, col, hl > 0.5 ? 3 : 2);
        if (hl > 0) glow(col, 30 * hl, draw); else draw();
        text(lab, cx + fw / 2, y + r * rh + rh / 2, { size: o.size || (fw < 150 ? 17 : 24), weight: 600, align: "center", max: fw - 12 });
      }, a);
      cx += fw;
    }
  });
}

SCENES_FN.udp = (t, S) => {
  sceneTitle(t, "UDP: the simple one", C.udp, "USER DATAGRAM PROTOCOL");
  // cue 0-1: header
  const hA = S.p(0, 0.2) * (1 - S.p(2, 0, 0.6));
  save(() => {
    const keys = { src: S.pw(0, "source port", -0.2), dst: S.pw(0, "destination port", -0.2), len: S.pw(0, "length", -0.2), sum: S.pw(0, "checksum", -0.2) };
    headerGrid(360, 300, 1200, [
      [["source port", 16, "src"], ["destination port", 16, "dst"]],
      [["length", 16, "len"], ["checksum", 16, "sum"]],
    ], { color: C.udp, rh: 100, alpha: k => keys[k], hl: k => k === "sum" ? S.p(1, 0) * (1 - S.p(2, 0)) : 0 });
    save(() => {
      rrect(363, 503, 1194, 90, 8, C.udp + "12", C.udp + "88", 2, [8, 6]);
      text("data (your message)…", 960, 548, { size: 26, color: C.dim, align: "center" });
    }, S.pw(0, "That's it", -1));
    save(() => {
      rrect(1600, 300, 12, 200, 6, C.udp);
      text("8 bytes", 1640, 370, { size: 44, weight: 800, color: C.udp });
      text("total", 1640, 420, { size: 26, color: C.dim });
    }, S.pw(0, "eight bytes"));
    // corrupted packet demo
    save(() => {
      const u = t - S.c(1) - 1.2;
      const x = lerp(420, 1100, easeIO(clamp(u / 1.6)));
      rrect(x - 160, 690, 320, 70, 10, C.panel2, u > 1.8 ? C.bad : C.udp, 3);
      rich([["01101", C.text], [u > 0.8 ? "1" : "0", u > 0.8 ? C.bad : C.text, 800], ["0010110", C.text]], x, 725, { size: 26, mono: true, align: "center" });
      save(() => {
        text("bit flipped in transit", x, 800, { size: 24, color: C.bad, align: "center" });
      }, prog(u, 0.8, 0.4));
      save(() => {
        text("checksum doesn't match → discarded", 1300, 725, { size: 30, weight: 700, color: C.bad });
        cross(x, 725, 30);
      }, prog(u, 1.8, 0.4));
    }, S.p(1, 0.6));
  }, hA);

  // cue 2: straight out
  const sA = S.p(2, 0.3) * (1 - S.p(3, 0, 0.5));
  save(() => {
    laptop(260, 420, 1, C.text, "sender");
    server(1660, 420, 1, C.text, "receiver");
    rrect(120, 560, 300, 70, 10, C.panel2, C.app, 2);
    text("sendto(msg)", 270, 595, { size: 24, mono: true, align: "center", color: C.app });
    const t0 = S.w(2, "hands the operating") + 0.2;
    for (let k = 0; k < 3; k++) {
      const u = (t - t0 - k * 1.6) / 1.4;
      if (u < 0 || u > 1) continue;
      packet(lerp(380, 1540, easeIO(u)), 420, "datagram", C.udp, { size: 20 });
    }
    const no = [["handshake", "no handshake"], ["connection", "no connection"], ["sequence numbers", "no sequence"], ["acknowledgements", "no acknowledge"]];
    no.forEach(([lab, word], i) => {
      const a = S.pw(2, word, 0, 0.4);
      save(() => {
        const x = 330 + i * 330, y = 760;
        rrect(x - 145, y - 40, 290, 80, 12, C.panel, C.line, 2);
        text(lab, x, y, { size: 24, weight: 600, align: "center", color: C.dim });
        line(x - 120, y, x + 120, y, C.bad, 4);
      }, a);
    });
  }, sA);

  // cue 3: fire and forget stream
  const fA = S.p(3, 0.2) * (1 - S.p(4, 0, 0.5));
  save(() => {
    laptop(200, 440, 0.9, C.text, "sender");
    server(1720, 440, 0.9, C.text, "receiver");
    const t0 = S.c(3) + 0.3;
    const ps = [
      { id: 1, t0: 0, d: 2.2 }, { id: 2, t0: 0.6, d: 2.2 }, { id: 3, t0: 1.2, d: 2.2, lost: 0.45 },
      { id: 4, t0: 1.8, d: 2.9 }, { id: 5, t0: 2.4, d: 1.8 }, { id: 6, t0: 3.0, d: 2.2 },
    ];
    const got = [];
    for (const p of ps) {
      const u = (t - t0 - p.t0) / p.d;
      if (u < 0) continue;
      if (p.lost !== undefined && u > p.lost) {
        const x = lerp(330, 1590, p.lost);
        save(() => { packet(x, 440, String(p.id), C.bad, { size: 22 }); cross(x, 440, 26); }, 1 - clamp((u - p.lost) * 1.5));
        continue;
      }
      if (u >= 1) { got.push([p.id, t0 + p.t0 + p.d]); continue; }
      packet(lerp(330, 1590, u), 440 + (p.id % 2 ? -1 : 1) * 30 * Math.sin(u * Math.PI), String(p.id), C.udp, { size: 22 });
    }
    got.sort((a, b) => a[1] - b[1]);
    rrect(1330, 590, 520, 110, 12, C.panel, C.line, 2);
    text("program receives:", 1350, 614, { size: 18, color: C.dim });
    got.forEach(([id], i) => packet(1380 + i * 72, 660, String(id), id === 5 || id === 4 ? C.warn : C.udp, { size: 22 }));
    save(() => text("3 is gone — no one is told, nothing is resent", 960, 250, { size: 30, weight: 700, color: C.bad, align: "center" }), S.pw(3, "nobody finds", 0.3));
    save(() => {
      rich([["UDP", C.udp, 800], [" ≈ ", C.dim], ["IP", C.ip, 800], [" + ", C.dim], ["ports", C.tcp, 800], [" + ", C.dim], ["checksum", C.text, 800]], 700, 790, { size: 48, align: "center" });
    }, S.pw(3, "basically"));
  }, fA);

  // cue 4: zero setup
  save(() => {
    const cx = 620, sx = 1300, y0 = 260;
    text("client", cx, y0 - 30, { size: 28, weight: 700, align: "center" });
    text("server", sx, y0 - 30, { size: 28, weight: 700, align: "center" });
    line(cx, y0, cx, 800, C.faint, 3); line(sx, y0, sx, 800, C.faint, 3);
    const p = S.p(4, 0.8, 1.2);
    arrow(cx, 320, sx, 420, { p, color: C.udp, lw: 4 });
    save(() => text("DATA — right away", (cx + sx) / 2, 340, { size: 28, weight: 700, mono: true, color: C.udp, align: "center" }), p);
    save(() => {
      text("0 round trips of setup", 960, 560, { size: 48, weight: 800, color: C.udp, align: "center" });
      text("nothing ever waits for anything else", 960, 630, { size: 30, color: C.dim, align: "center" });
    }, S.pw(4, "very first", 0.4));
  }, S.p(4, 0.2));
};

// ---------------- TCP ----------------
SCENES_FN.tcp = (t, S) => {
  sceneTitle(t, "TCP: a reliable, ordered byte stream", C.tcp, "TRANSMISSION CONTROL PROTOCOL");
  const pA = S.p(0, 0.2) * (1 - S.p(1, 0, 0.6));
  save(() => {
    const msg = "HELLO, WORLD";
    rrect(100, 330, 360, 180, 16, C.panel, C.app, 2);
    text("program A", 280, 370, { size: 24, weight: 700, color: C.app, align: "center" });
    text(`write("${msg}")`, 280, 440, { size: 22, mono: true, align: "center", max: 330 });
    rrect(1460, 330, 360, 180, 16, C.panel, C.app, 2);
    text("program B", 1640, 370, { size: 24, weight: 700, color: C.app, align: "center" });
    // chaos cloud
    rrect(560, 260, 800, 330, 60, "#101a2c", C.ip + "55", 2, [10, 8]);
    text("the internet (IP): loses, shuffles, duplicates", 960, 620, { size: 22, color: C.ip, align: "center" });
    const u = t - 1.0;
    let out = 0;
    for (let i = 0; i < msg.length; i++) {
      const st = i * 0.45, du = 3.0 + hash(i) * 1.5;
      const f = (u - st) / du;
      if (f < 0) continue;
      if (f >= 1) { out++; continue; }
      const x = lerp(520, 1400, f);
      const y = 425 + Math.sin(f * Math.PI * (2 + hash(i + 5) * 3) + i) * 110 * Math.sin(f * Math.PI);
      rrect(x - 20, y - 22, 40, 44, 6, C.panel2, C.tcp, 2);
      text(msg[i], x, y, { size: 26, mono: true, weight: 700, align: "center" });
    }
    // TCP delivers only the in-order prefix
    const done = Math.min(out, msg.length);
    text(done ? `read() → "${msg.slice(0, done)}"` : "read() → (waiting…)", 1640, 440, { size: 22, mono: true, align: "center", color: C.tcp, max: 330 });
    const g = [["complete", "complete"], ["in order", "in order"], ["no duplicates", "no duplicates"], ["…or an error", "Or you get"]];
    g.forEach(([lab, w], i) => save(() => {
      const x = 380 + i * 390;
      if (i < 3) check(x - 70, 760, 18, C.tcp, 6); else text("!", x - 70, 760, { size: 40, weight: 800, color: C.warn, align: "center" });
      text(lab, x - 40, 760, { size: 34, weight: 700, color: i < 3 ? C.text : C.warn });
    }, S.pw(0, w, 0, 0.4)));
  }, pA);

  // header
  const hA = S.p(1, 0.2) * (1 - S.p(2, 0, 0.6));
  save(() => {
    const hl = { seq: S.pw(1, "sequence number", -0.2) * (1 - S.pw(1, "an acknowledgement", 0)),
      ack: S.pw(1, "acknowledgement number", -0.2) * (1 - S.pw(1, "flags", 0)),
      flags: S.pw(1, "flags", -0.2) * (1 - S.pw(1, "window", -0.1)), win: S.pw(1, "window", -0.2) };
    headerGrid(300, 270, 1150, [
      [["source port", 16, "p"], ["destination port", 16, "p"]],
      [["sequence number", 32, "seq"]],
      [["acknowledgement number", 32, "ack"]],
      [["offset", 4, "o"], ["rsvd", 4, "o"], ["flags: CWR ECE URG ACK PSH RST SYN FIN", 8, "flags"], ["window size", 16, "win"]],
      [["checksum", 16, "c"], ["urgent pointer", 16, "c"]],
    ], { color: C.tcp, rh: 90, size: 24, hl: k => hl[k] || 0 });
    save(() => {
      rrect(1490, 270, 12, 450, 6, C.tcp);
      text("20 bytes", 1530, 460, { size: 44, weight: 800, color: C.tcp });
      text("(UDP: 8)", 1530, 510, { size: 28, color: C.udp });
    }, S.p(1, 1.2));
    save(() => {
      text("SYN = let's start · ACK = I got it · FIN = I'm done", 875, 790, { size: 26, mono: true, align: "center", color: C.dim });
    }, S.pw(1, "flags"));
  }, hA);

  // byte numbering
  save(() => {
    const x0 = 180, x1 = 1740, y = 480;
    text("the byte stream", x0, y - 110, { size: 28, weight: 700, color: C.dim });
    const segs = [[1001, 2000], [2001, 3000], [3001, 4000]];
    const sw = (x1 - x0) / 3;
    segs.forEach(([a, b], i) => {
      const hl = i === 0 ? S.p(2, 1.5) : 0;
      rrect(x0 + i * sw + 4, y - 45, sw - 8, 90, 10, hl > 0.5 ? C.tcp + "30" : C.panel2, C.tcp, hl > 0.5 ? 4 : 2);
      for (let k = 0; k < 40; k++) line(x0 + i * sw + 20 + k * (sw - 40) / 40, y + 20, x0 + i * sw + 20 + k * (sw - 40) / 40, y + 34, C.tcp + "55", 2);
      text(`bytes ${a}–${b}`, x0 + i * sw + sw / 2, y - 8, { size: 26, mono: true, align: "center" });
    });
    save(() => {
      const cx = x0 + sw / 2;
      rrect(cx - 190, y + 90, 380, 120, 14, C.panel, C.tcp, 3);
      text("packet 1 header:", cx, y + 122, { size: 22, color: C.dim, align: "center" });
      text("seq = 1001", cx, y + 170, { size: 36, mono: true, weight: 700, color: C.tcp, align: "center" });
      line(cx, y + 45, cx, y + 90, C.tcp, 3);
      text("“my first byte is byte #1001 of the stream”", cx + 240, y + 150, { size: 28, color: C.text });
    }, S.p(2, 2.0));
  }, S.p(2, 0.2));
};

// ---------------- handshake ----------------
function seqArrow(x1, y1, x2, y2, label, o = {}) {
  const p = o.p === undefined ? 1 : o.p;
  if (p <= 0) return;
  arrow(x1, y1, x2, y2, { p, color: o.color || C.tcp, lw: 4, dash: o.dash });
  save(() => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.save(); ctx.translate(mx, my); ctx.rotate(ang > Math.PI / 2 || ang < -Math.PI / 2 ? ang + Math.PI : ang);
    text(label, 0, -22, { size: o.size || 26, mono: true, weight: 700, color: o.color || C.tcp, align: "center" });
    if (o.quote) text(o.quote, 0, 26, { size: 22, color: C.dim, align: "center" });
    ctx.restore();
  }, clamp((p - 0.3) / 0.5));
}
function stateTag(x, y, s, color, a, right) {
  save(() => {
    const w = measure(s, 20, 700, true) + 24;
    const bx = right ? x + 20 : x - 20 - w;
    rrect(bx, y - 18, w, 36, 8, color + "22", color, 2);
    text(s, bx + w / 2, y, { size: 20, mono: true, weight: 700, color, align: "center" });
  }, a);
}

SCENES_FN.handshake = (t, S) => {
  sceneTitle(t, "The three-way handshake", C.tcp, "TCP · SETTING UP");
  const cx = 600, sx = 1320, top = 230, bot = 880;
  text("client", cx, top - 30, { size: 30, weight: 800, align: "center" });
  text("192.168.1.20 : 52100", cx, top + 4, { size: 20, mono: true, color: C.dim, align: "center" });
  text("server", sx, top - 30, { size: 30, weight: 800, align: "center" });
  text("142.250.72.14 : 443", sx, top + 4, { size: 20, mono: true, color: C.dim, align: "center" });
  line(cx, top + 30, cx, bot, C.faint, 3);
  line(sx, top + 30, sx, bot, C.faint, 3);
  text("time ↓", 1700, top + 60, { size: 22, color: C.faint });
  const p1 = S.pw(1, "sends a", 0, 1.4), p2 = S.pw(2, "replies", 0, 1.4), p3 = S.pw(3, "replies", -0.3, 1.4);
  const est = S.p(4, 0);
  seqArrow(cx, 320, sx, 420, "SYN  seq=1000", { p: p1, quote: "“I want to talk. My bytes start at 1000.”" });
  seqArrow(sx, 450, cx, 550, "SYN-ACK  seq=5000  ack=1001", { p: p2, quote: "“Mine start at 5000. Expecting your 1001.”" });
  seqArrow(cx, 580, sx, 680, "ACK  ack=5001", { p: p3, quote: "“Got it. Expecting your 5001.”" });
  stateTag(cx, 290, "CLOSED", C.faint, 1 - p1);
  stateTag(cx, 330, "SYN-SENT", C.warn, p1 * (1 - p2));
  stateTag(sx, 290, "LISTEN", C.dim, 1 - p1, true);
  stateTag(sx, 430, "SYN-RECEIVED", C.warn, p1 * (1 - p3), true);
  const glowE = est * (0.6 + 0.4 * Math.sin(t * 4));
  save(() => glow(C.tcp, 30 * glowE, () => stateTag(cx, 560, "ESTABLISHED", C.tcp, 1)), p2);
  save(() => glow(C.tcp, 30 * glowE, () => stateTag(sx, 690, "ESTABLISHED", C.tcp, 1, true)), p3);
  // private random numbers
  save(() => text("random start: 1000", cx - 30, 390, { size: 20, color: C.warn, align: "right" }), S.pw(1, "random", 0));
  save(() => text("random start: 5000", sx + 30, 520, { size: 20, color: C.warn }), S.pw(2, "own random", 0));
  save(() => {
    text("both sides know both starting numbers", 960, 790, { size: 34, weight: 700, align: "center" });
  }, S.p(4, 0.4) * (1 - S.p(5, 0)));
  // cost
  const c5 = S.p(5, 0.3);
  save(() => {
    const bx = cx - 250;
    line(bx, 320, bx, 550, C.warn, 4);
    line(bx, 320, bx + 20, 320, C.warn, 4); line(bx, 550, bx + 20, 550, C.warn, 4);
    text("1 round trip", bx - 16, 420, { size: 26, weight: 800, color: C.warn, align: "right" });
    text("(RTT)", bx - 16, 455, { size: 22, color: C.warn, align: "right" });
    text("before any data", bx - 16, 490, { size: 22, color: C.dim, align: "right" });
    seqArrow(cx, 690, sx, 770, "DATA: GET /index.html", { p: S.p(5, 1.2, 1.2), color: C.app, size: 24 });
    save(() => {
      rrect(560, 810, 800, 80, 14, C.panel, C.warn, 2);
      text("server 100 ms away  →  100 ms just to say hello", 960, 850, { size: 30, weight: 700, align: "center" });
    }, S.pw(5, "If the server", 0));
  }, c5);
};

// ---------------- reliability ----------------
SCENES_FN.reliable = (t, S) => {
  sceneTitle(t, "Acknowledgements and retransmission", C.tcp, "TCP · RELIABILITY");
  const cx = 230, sx = 820, top = 230;
  text("sender", cx, top - 20, { size: 26, weight: 800, align: "center" });
  text("receiver", sx, top - 20, { size: 26, weight: 800, align: "center" });
  line(cx, top + 10, cx, 880, C.faint, 3); line(sx, top + 10, sx, 880, C.faint, 3);
  const lostMode = S.p(2, 0, 0.6);
  const L = S.c(2);
  // sends
  const s1 = S.p(0, 1.0, 1.0), s2 = S.p(0, 3.2, 1.0), s3 = S.p(0, 5.4, 1.0);
  seqArrow(cx, 280, sx, 340, "1001–2000", { p: s1, size: 22 });
  // packet 2: whole arrow before "suppose", then lost
  save(() => seqArrow(cx, 350, sx, 410, "2001–3000", { p: s2, size: 22 }), 1 - lostMode);
  save(() => {
    const mx = lerp(cx, sx, 0.35), my = lerp(350, 410, 0.35);
    arrow(cx, 350, mx, my, { color: C.bad, lw: 4, head: false });
    text("2001–3000", (cx + mx) / 2 + 10, 330, { size: 22, mono: true, weight: 700, color: C.bad, align: "center" });
    cross(mx, my, 20);
  }, lostMode);
  seqArrow(cx, 420, sx, 480, "3001–4000", { p: s3, size: 22 });
  seqArrow(sx, 360, cx, 420, "ACK 2001", { p: S.p(1, 0.8, 1.0), color: C.ip, size: 22 });
  const dup = S.pw(2, "keeps saying", 0, 1.0);
  seqArrow(sx, 490, cx, 550, "ACK 2001  (again!)", { p: dup, color: C.warn, size: 22 });
  const re = S.pw(3, "resends", 0, 1.0);
  seqArrow(cx, 610, sx, 670, "2001–3000  (resent)", { p: re, size: 22 });
  const ack4 = S.pw(3, "released", 0, 1.0);
  seqArrow(sx, 690, cx, 750, "ACK 4001", { p: ack4, color: C.ip, size: 22 });
  save(() => text("timer ⏱ / duplicate ACKs", cx - 20, 585, { size: 18, color: C.warn, align: "left" }), S.pw(3, "timer", -0.5));

  // receiver panel
  const px = 980, pw = 860;
  rrect(px, 200, pw, 680, 20, C.panel, C.line, 2);
  text("receiver's kernel: receive buffer", px + 30, 240, { size: 24, weight: 700, color: C.dim });
  const slots = ["1001–2000", "2001–3000", "3001–4000"];
  const sw = 250, sy = 330;
  // state per slot: 0 empty, 1 held (amber), 2 delivered
  let st;
  if (lostMode < 0.5) st = [s1 >= 1 ? 2 : 0, s2 >= 1 ? 2 : 0, s3 >= 1 ? 2 : 0];
  else {
    const fill2 = re >= 1;
    st = [2, fill2 ? 2 : -1, fill2 ? 2 : 1];
  }
  slots.forEach((lab, i) => {
    const x = px + 50 + i * (sw + 20);
    const s = st[i];
    const col = s === 2 ? C.tcp : s === 1 ? C.warn : s === -1 ? C.bad : C.faint;
    rrect(x, sy, sw, 110, 12, s > 0 ? col + "30" : "transparent", col, 3, s <= 0 ? [8, 6] : undefined);
    text(lab, x + sw / 2, sy + 40, { size: 24, mono: true, weight: 700, align: "center", color: s === 0 ? C.faint : C.text });
    text(s === 2 ? "delivered" : s === 1 ? "held — can't deliver" : s === -1 ? "HOLE" : "", x + sw / 2, sy + 80, { size: 20, weight: 700, align: "center", color: col });
  });
  // app
  const delivered = st.reduce((n, s, i) => (n === i && s === 2 ? n + 1 : n), 0);
  rrect(px + 50, 560, pw - 100, 150, 14, C.app + "14", C.app, 2);
  text("program: read(socket)", px + 80, 596, { size: 24, weight: 700, color: C.app });
  const rb = delivered * 1000;
  text(rb ? `got bytes 1001–${1000 + rb}, in order` : "waiting…", px + 80, 650, { size: 28, mono: true });
  for (let i = 0; i < 3; i++) rrect(px + 80 + i * 240, 680, 230, 16, 4, i < delivered ? C.tcp : C.faint + "55");
  // HOL blocking highlight
  save(() => {
    const x = px + 50 + 2 * (sw + 20);
    glow(C.warn, 30, () => rrect(x - 6, sy - 6, sw + 12, 122, 14, null, C.warn, 4));
    text("arrived early — had to wait", x + sw / 2, sy - 30, { size: 22, weight: 700, color: C.warn, align: "center" });
    rrect(px + 60, 760, pw - 120, 90, 14, C.warn + "18", C.warn, 2);
    text("head-of-line blocking", px + pw / 2, 805, { size: 40, weight: 800, color: C.warn, align: "center" });
  }, S.pw(4, "head-of-line", -1.5) * (lostMode));
  save(() => text("what if packet 2 is lost?", sx - 20, 250, { size: 22, weight: 700, color: C.bad }), win(t, L, S.c(2) + 5));
};

// ---------------- flow / congestion control ----------------
SCENES_FN.flow = (t, S) => {
  sceneTitle(t, "Flow control and congestion control", C.tcp, "TCP · SPEED");
  // receive window
  save(() => {
    const x = 120, y = 250, w = 760;
    rrect(x, y, w, 560, 20, C.panel, C.line, 2);
    text("receiver's buffer", x + 30, y + 44, { size: 28, weight: 700 });
    text("(64 KB)", x + 290, y + 44, { size: 24, color: C.dim });
    const f = 0.35 + 0.3 * Math.sin(t * 0.9);
    const bx = x + 40, by = y + 120, bw = w - 80;
    rrect(bx, by, bw, 110, 12, C.panel2, C.tcp, 2);
    rrect(bx + 4, by + 4, (bw - 8) * f, 102, 10, C.warn + "88");
    text("unread data (app hasn't read it yet)", bx, by - 22, { size: 20, weight: 700, color: C.warn });
    const free = Math.round((1 - f) * 64);
    text(`free: ${free} KB`, bx + bw - 20, by + 56, { size: 26, mono: true, weight: 700, color: C.tcp, align: "right" });
    rrect(bx, by + 170, bw, 100, 12, C.tcp + "14", C.tcp, 2);
    text(`TCP header: window = ${free} KB`, bx + bw / 2, by + 220, { size: 28, mono: true, weight: 700, color: C.tcp, align: "center" });
    text("“don't send me more than this”", x + w / 2, by + 330, { size: 28, color: C.dim, align: "center" });
    text("fast sender can't overwhelm a slow receiver", x + w / 2, by + 390, { size: 24, color: C.dim, align: "center" });
  }, S.p(0, 0.3));
  // congestion window chart
  save(() => {
    const x = 980, y = 250, w = 820, h = 560;
    rrect(x, y, w, h, 20, C.panel, C.line, 2);
    text("sender's congestion window", x + 30, y + 44, { size: 28, weight: 700 });
    const gx = x + 80, gy = y + h - 70, gw = w - 130, gh = h - 170;
    line(gx, gy, gx + gw, gy, C.dim, 2); line(gx, gy, gx, gy - gh, C.dim, 2);
    text("time (round trips) →", gx + gw, gy + 34, { size: 20, color: C.dim, align: "right" });
    at(gx - 30, gy - gh / 2, 1, () => { ctx.rotate(-Math.PI / 2); text("how much it may send", 0, 0, { size: 20, color: C.dim, align: "center" }); });
    // simulate cwnd
    const pts2 = [];
    let c = 1, ssthresh = 32;
    const losses = [];
    for (let r = 0; r <= 30; r++) {
      pts2.push([r, c]);
      if (r === 13 || r === 23) { losses.push([r, c]); ssthresh = c / 2; c = ssthresh; } else if (c < ssthresh) c *= 2; else c += 2.5;
    }
    const maxC = 75;
    const P = pts2.map(([r, v]) => [gx + r / 30 * gw, gy - Math.min(v, maxC) / maxC * gh]);
    const pr = S.p(1, 0.8, 9);
    const n = Math.max(1, Math.floor(pr * (P.length - 1)));
    ctx.beginPath(); ctx.moveTo(...P[0]);
    for (let i = 1; i <= n; i++) {
      // step shape
      ctx.lineTo(P[i][0], P[i - 1][1]); ctx.lineTo(P[i][0], P[i][1]);
    }
    ctx.strokeStyle = C.tcp; ctx.lineWidth = 4; ctx.stroke();
    losses.forEach(([r]) => {
      if (n < r + 1) return;
      const [lx, ly] = P[r];
      save(() => { circle(lx + gw / 30, ly, 10, C.bad); text("loss → cut back", lx + gw / 30 + 14, ly - 26, { size: 20, weight: 700, color: C.bad }); }, 1);
    });
    save(() => text("doubles each round trip", gx + gw * 5.5 / 30 + 16, gy - 40, { size: 20, weight: 700, color: C.tcp }), S.p(1, 2));
    save(() => {
      glow(C.warn, 20, () => rrect(gx + 2, gy - gh + 20, gw * 5.5 / 30, gh - 22, 8, C.warn + "18", C.warn, 2));
      text("the ramp-up", gx + gw * 5.5 / 60, gy + 34, { size: 22, weight: 700, color: C.warn, align: "center" });
    }, S.p(2, 0.3));
  }, S.p(1, 0));
};
