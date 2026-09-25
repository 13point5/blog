// Scenes: what a connection physically is, what keeps it alive, NAT, closing, UDP's lack of state.
/* global SCENES_FN */

function recordCard(x, y, w, o = {}) {
  const h = o.h || 170, col = o.color || C.tcp;
  const draw = () => rrect(x, y, w, h, 14, o.fill || "#0f1a2b", col, 3, o.dash);
  if (o.glow) glow(col, o.glow, draw); else draw();
  text("struct tcp_sock", x + 20, y + 30, { size: 20, mono: true, weight: 700, color: col });
  if (o.lines) o.lines.forEach((l, i) => text(l, x + 20, y + 72 + i * 34, { size: 20, mono: true, color: i === (o.hlLine ?? -1) ? col : C.text, max: w - 40 }));
}

function memPanel(x, y, w, h, title) {
  rrect(x, y, w, h, 18, C.panel, C.line, 2);
  // memory chip-like texture
  for (let i = 0; i < 10; i++) line(x + 20 + i * (w - 40) / 10, y + h - 18, x + 20 + i * (w - 40) / 10, y + h - 8, C.line, 3);
  text(title, x + 22, y + 32, { size: 20, weight: 700, color: C.dim });
}

// ---------------- connection ----------------
SCENES_FN.connection = (t, S) => {
  sceneTitle(t, "What is a “connection”, physically?", C.tcp, "UNDER THE HOOD");

  // cue 0: the question
  save(() => {
    rich([["“", C.faint], ["established", C.tcp, 800], ["”", C.faint]], 960, 400, { size: 110, align: "center" });
    save(() => rich([["“", C.faint], ["stays alive", C.tcp, 800], ["”", C.faint]], 960, 560, { size: 110, align: "center" }), S.pw(0, "stays alive", -0.3));
    save(() => text("…what is actually there?", 960, 700, { size: 40, color: C.dim, align: "center" }), S.p(0, 3.2));
  }, S.p(0, 0.2) * (1 - S.p(1, 0, 0.5)));

  // cue 1: no wire
  const c1 = S.p(1, 0.2) * (1 - S.p(2, 0, 0.6));
  save(() => {
    const y = 520, xs = [560, 810, 1060, 1310];
    const tubeA = S.p(1, 0.2, 0.6);
    const brk = S.pw(1, "no wire", 0, 0.5);
    // imagined tube
    save(() => {
      glow(C.tcp, 30, () => rrect(260, y - 28, 1400, 56, 28, C.tcp + "30", C.tcp, 3));
      text("a dedicated line?", 960, y - 70, { size: 30, weight: 700, color: C.tcp, align: "center" });
    }, tubeA * (1 - brk));
    save(() => {
      cross(960, y - 150, 40);
      text("no wire · no reserved path · no circuit", 960, y - 230, { size: 36, weight: 800, color: C.bad, align: "center" });
    }, brk);
    for (let i = 0; i < xs.length - 1; i++) line(xs[i], y, xs[i + 1], y, "#2a3654", 4);
    line(260, y, xs[0], y, "#2a3654", 4); line(xs[3], y, 1660, y, "#2a3654", 4);
    laptop(200, y, 1, C.text, "laptop");
    server(1720, y, 1, C.text, "server");
    const q = S.pw(1, "routers in between", 0, 0.5);
    xs.forEach((x, i) => {
      router(x, y, 1, C.ip);
      save(() => {
        rrect(x - 95, y + 60, 190, 80, 12, C.panel2, C.warn + "88", 2);
        text("connection?", x, y + 88, { size: 20, weight: 700, color: C.warn, align: "center" });
        text("never heard of it", x, y + 116, { size: 18, color: C.dim, align: "center" });
      }, prog(t, S.w(1, "routers in between") + i * 0.2, 0.4));
    });
    // independent packets
    const t0 = S.w(1, "They just forward");
    for (let k = 0; k < 6; k++) {
      const u = (t - t0 - k * 0.7) / 3;
      if (u < 0 || u > 1) continue;
      const x = lerp(280, 1640, u);
      packet(x, y - 1, "pkt", C.ip, { size: 16, glow: 6 });
    }
    void q;
  }, c1);

  // cue 2: two records
  const c2 = S.p(2, 0.2) * (1 - S.p(3, 0, 0.6));
  save(() => {
    laptop(330, 280, 0.8, C.text, "laptop");
    server(1590, 280, 0.8, C.text, "server");
    for (let x = 520; x < 1420; x += 220) router(x + 50, 280, 0.6, C.ip);
    memPanel(90, 420, 800, 400, "laptop · kernel memory");
    memPanel(1030, 420, 800, 400, "server · kernel memory");
    const a = S.pw(2, "small record", 0, 0.6);
    save(() => {
      recordCard(150, 480, 680, { lines: ["192.168.1.20:52100 ↔ 142.250.72.14:443", "state = ESTABLISHED", "…"], glow: 20 });
      recordCard(1090, 480, 680, { lines: ["142.250.72.14:443 ↔ 192.168.1.20:52100", "state = ESTABLISHED", "…"], glow: 20 });
    }, a);
    save(() => {
      text("this record on each side  =  the whole connection", 960, 740, { size: 32, weight: 700, align: "center" });
    }, S.pw(2, "Linux kernel", 0, 0.6));
    save(() => text("in Linux: struct tcp_sock", 960, 790, { size: 24, mono: true, color: C.dim, align: "center" }), S.pw(2, "struct", 0, 0.6));
  }, c2);

  // cue 3: the fields
  const c3 = S.p(3, 0.2) * (1 - S.p(4, 0, 0.6));
  save(() => {
    const x = 140, y = 190, w = 1640;
    rrect(x, y, w, 690, 18, "#0f1a2b", C.tcp, 3);
    text("struct tcp_sock   // the laptop's copy, in kernel memory", x + 30, y + 40, { size: 24, mono: true, weight: 700, color: C.tcp });
    const F = [
      ["local", "192.168.1.20 : 52100", "", "four values", C.ip],
      ["remote", "142.250.72.14 : 443", "← these 4 values are its key", "four values", C.ip],
      ["state", "ESTABLISHED", "", "ESTABLISHED", C.tcp],
      ["snd_nxt", "4001", "next sequence number to send", "next sequence number", C.text],
      ["snd_una", "3001", "oldest byte not yet acknowledged", "oldest byte", C.text],
      ["rcv_nxt", "5001", "next byte expected from the server", "next byte expected", C.text],
      ["snd_wnd / rcv_wnd", "64 KB / 64 KB", "window sizes", "window sizes", C.text],
      ["send buffer", "", "bytes 3001–4000, kept until ACKed", "send buffer", C.text],
      ["receive buffer", "", "arrived, not yet read by the app", "receive buffer", C.text],
      ["retransmit timer", "⏱ 212 ms", "fires if no ACK comes back", "retransmission timer", C.warn],
    ];
    F.forEach(([k, v, cmt, word, col], i) => {
      const a = S.pw(3, word, -0.3, 0.5);
      const ry = y + 100 + i * 57;
      save(() => {
        text(k, x + 40, ry, { size: 26, mono: true, weight: 700, color: C.dim });
        if (k === "send buffer" || k === "receive buffer") {
          const n = k === "send buffer" ? 4 : 2;
          for (let j = 0; j < 8; j++) rrect(x + 420 + j * 44, ry - 16, 38, 32, 5, j < n ? C.tcp : C.panel2, C.tcp + "88", 1);
        } else text(v, x + 420, ry, { size: 28, mono: true, weight: 700, color: col });
        text(cmt, x + 880, ry, { size: 24, color: C.dim });
      }, a);
    });
    save(() => {
      glow(C.ip, 20, () => rrect(x + 20, y + 72, 820, 114, 10, null, C.ip, 3));
    }, S.pw(3, "four values", 0.8, 0.5) * (1 - S.pw(3, "stores the state", 0, 0.5)));
  }, c3);

  // cue 4: a packet arrives
  const c4 = S.p(4, 0.2) * (1 - S.p(5, 0, 0.6));
  save(() => {
    text("server kernel: a packet arrives", 120, 200, { size: 26, weight: 700, color: C.dim });
    // packet header
    const hdA = S.p(4, 0.3);
    const px = lerp(-300, 120, easeOut(hdA));
    rrect(px, 240, 470, 220, 14, C.panel2, C.ip, 3);
    const hl4 = S.pw(4, "reads those", 0, 0.4);
    const rows = [["src", "192.168.1.20:52100"], ["dst", "142.250.72.14:443"], ["seq", "3001"], ["data", "1000 bytes…"]];
    rows.forEach(([k, v], i) => {
      const on = i < 2 ? hl4 : i === 2 ? S.pw(4, "checks the sequence", 0, 0.4) : S.pw(4, "copies", 0, 0.4);
      text(k, px + 24, 285 + i * 48, { size: 22, mono: true, color: C.dim });
      text(v, px + 100, 285 + i * 48, { size: 24, mono: true, weight: 700, color: on > 0.5 ? C.warn : C.text });
    });
    // hash table
    const tA = S.pw(4, "hash table", -0.4, 0.5);
    save(() => {
      const tx = 680, ty = 240;
      rrect(tx, ty, 700, 330, 14, C.panel, C.line, 2);
      text("connection table (hash of 4 values → record)", tx + 20, ty + 30, { size: 20, weight: 700, color: C.dim });
      const conns = [
        ["ESTAB", "81.2.69.160:40122"], ["ESTAB", "192.168.1.20:52100"], ["ESTAB", "203.0.113.9:61001"],
        ["ESTAB", "198.51.100.4:50550"], ["LISTEN", "*:*  (waiting for new)"],
      ];
      const found = S.pw(4, "finds the matching", 0, 0.4);
      conns.forEach(([st, peer], i) => {
        const ry = ty + 80 + i * 50;
        const hit = i === 1 ? found : 0;
        if (hit > 0) glow(C.tcp, 20 * hit, () => rrect(tx + 12, ry - 22, 676, 44, 8, C.tcp + "30", C.tcp, 2));
        text(st, tx + 30, ry, { size: 22, mono: true, weight: 700, color: st === "LISTEN" ? C.dim : C.tcp });
        text(":443 ↔ " + peer, tx + 150, ry, { size: 22, mono: true, color: hit > 0.5 ? C.text : C.dim });
      });
      arrow(px + 470, 320, tx, 340, { color: C.warn, lw: 3, p: hl4 });
    }, tA);
    // record + checks
    save(() => {
      const rx = 1440, ry = 240;
      rrect(rx, ry, 380, 330, 14, "#0f1a2b", C.tcp, 3);
      text("tcp_sock (server)", rx + 20, ry + 30, { size: 20, mono: true, weight: 700, color: C.tcp });
      text("rcv_nxt = 3001", rx + 20, ry + 80, { size: 24, mono: true, weight: 700 });
      save(() => { check(rx + 290, ry + 80, 14); text("seq 3001 ✓ expected", rx + 20, ry + 120, { size: 20, color: C.tcp }); }, S.pw(4, "checks the sequence", 0.3, 0.4));
      save(() => text("rcv_nxt → 4001", rx + 20, ry + 160, { size: 22, mono: true, color: C.warn }), S.pw(4, "copies", 0.3, 0.4));
      text("receive buffer", rx + 20, ry + 220, { size: 20, color: C.dim });
      const fill = S.pw(4, "copies", 0, 0.8);
      for (let j = 0; j < 7; j++) rrect(rx + 20 + j * 48, ry + 244, 42, 40, 5, j < Math.round(fill * 3) ? C.tcp : C.panel2, C.tcp + "88", 1);
      arrow(1380, 340, rx, 340, { color: C.tcp, lw: 3, p: S.pw(4, "finds the matching", 0.3, 0.4) });
    }, S.pw(4, "finds the matching", 0, 0.5));
    // app
    save(() => {
      rrect(1440, 640, 380, 150, 14, C.app + "18", C.app, 2);
      text("web server process", 1460, 675, { size: 22, weight: 700, color: C.app });
      text("n = read(sock, buf)", 1460, 725, { size: 24, mono: true });
      text("→ 1000 bytes", 1460, 762, { size: 22, mono: true, color: C.tcp });
      arrow(1630, 575, 1630, 640, { color: C.app, lw: 3 });
    }, S.pw(4, "Your program", 0, 0.5));
    // step list
    const steps = ["1. read the 4 values from the headers", "2. look them up in a hash table", "3. find the record", "4. check the sequence number", "5. copy data into the receive buffer", "6. the app reads it from the socket"];
    const words = ["reads those", "hash table", "finds the matching", "checks the sequence", "copies", "reads from the socket"];
    steps.forEach((s, i) => save(() => text(s, 120, 540 + i * 50, { size: 26, color: C.text }), S.pw(4, words[i], 0, 0.4)));
  }, c4);

  // cue 5: established
  save(() => {
    laptop(330, 330, 1, C.text, "laptop");
    server(1590, 330, 1, C.text, "server");
    const g = 20 + 15 * Math.sin(t * 3);
    recordCard(110, 470, 700, { lines: ["192.168.1.20:52100 ↔ 142.250.72.14:443", "state = ESTABLISHED"], glow: g, h: 150 });
    recordCard(1110, 470, 700, { lines: ["142.250.72.14:443 ↔ 192.168.1.20:52100", "state = ESTABLISHED"], glow: g, h: 150 });
    text("both records exist", 960, 700, { size: 38, weight: 800, align: "center" });
    text("+ handshake finished", 960, 755, { size: 38, weight: 800, align: "center", color: C.tcp });
    save(() => text("= “established”. That's the whole connection.", 960, 830, { size: 32, color: C.dim, align: "center" }), S.p(5, 2));
  }, S.p(5, 0.2));
};

// ---------------- stays alive ----------------
function aliveBase(t, o) {
  const y = 300;
  laptop(260, y, 0.9, C.text, "laptop");
  if (o.crash > 0) {
    save(() => server(1660, y, 0.9, C.bad), o.crash);
    save(() => server(1660, y, 0.9, C.text), 1 - o.crash);
    text("server", 1660, y + 79, { size: 24, weight: 700, align: "center" });
  } else server(1660, y, 0.9, C.text, "server");
  // cable + routers
  const unplug = o.unplug || 0;
  line(340, y, 520 - 60 * unplug, y, unplug > 0.5 ? C.bad : "#2a3654", 5);
  rrect(512 - 60 * unplug, y - 10, 16, 20, 3, unplug > 0.5 ? C.bad : "#3b4a6e");
  line(540, y, 1580, y, "#2a3654", 5);
  for (let x = 560; x <= 1380; x += 270) router(x + 30, y, 0.7, C.ip);
}

SCENES_FN.alive = (t, S) => {
  sceneTitle(t, "What keeps it “alive”?", C.tcp, "UNDER THE HOOD");
  const base = S.p(0, 0.2) * (1 - S.p(4, 0, 0.6));
  const crash = S.pw(2, "crashes", 0, 0.4);
  const reboot = S.pw(2, "record is gone", 0, 0.6);
  const rst = S.pw(3, "reset packet", -0.5, 1.0);
  save(() => {
    // cable unplug in cue 1
    const u1 = t - S.w(1, "unplug");
    const unplug = u1 > 0 && u1 < 3.2 ? prog(u1, 0, 0.3) * (1 - prog(u1, 2.8, 0.3)) : 0;
    aliveBase(t, { unplug, crash: crash * (1 - reboot) });
    if (unplug > 0) save(() => text("unplugged!", 430, 240, { size: 26, weight: 800, color: C.bad, align: "center" }), unplug);
    // laptop record
    const lapGone = S.pw(3, "connection reset", 0.2, 0.6);
    save(() => recordCard(60, 420, 520, {
      h: 140, lines: ["→ 142.250.72.14:443", "state = ESTABLISHED"], glow: 12,
      color: t > S.c(2) && lapGone < 1 && reboot > 0 ? C.warn : C.tcp,
    }), 1 - lapGone);
    save(() => text("half-open: it thinks the connection is fine", 320, 590, { size: 22, weight: 700, color: C.warn, align: "center" }), reboot * (1 - lapGone));
    // server record
    save(() => recordCard(1340, 420, 520, { h: 140, lines: ["→ 192.168.1.20:52100", "state = ESTABLISHED"], glow: 12 }), 1 - reboot);
    save(() => {
      rrect(1340, 420, 520, 140, 14, null, C.faint, 2, [10, 8]);
      text("(no record — it rebooted)", 1600, 490, { size: 24, color: C.dim, align: "center" });
    }, reboot);
    save(() => text("CRASH → reboot", 1660, 160, { size: 30, weight: 800, color: C.bad, align: "center" }), crash * (1 - S.p(3, 0)));

    // cue 0: idle clock
    save(() => {
      const cx = 960, cy = 600;
      circle(cx, cy, 100, C.panel, C.dim, 4);
      const ang = t * 3;
      line(cx, cy, cx + 70 * Math.cos(ang - Math.PI / 2), cy + 70 * Math.sin(ang - Math.PI / 2), C.text, 5);
      line(cx, cy, cx + 45 * Math.cos(ang / 12 - Math.PI / 2), cy + 45 * Math.sin(ang / 12 - Math.PI / 2), C.text, 7);
      const mins = Math.min(60, Math.floor(lin(t, 0.5, 7) * 60));
      text(`idle: ${mins} min`, cx, cy + 150, { size: 34, mono: true, weight: 700, align: "center" });
      save(() => text("packets on the network: 0", cx, cy + 200, { size: 34, mono: true, weight: 800, color: C.tcp, align: "center" }), S.pw(0, "Zero", -0.2));
    }, S.p(0, 0.3) * (1 - S.p(1, 0, 0.5)));

    // cue 1: terminal
    save(() => {
      const x = 660, y = 470;
      rrect(x, y, 600, 300, 14, "#05080e", C.line, 2);
      rrect(x, y, 600, 40, 14, "#1a2234");
      [C.bad, C.warn, C.tcp].forEach((c, i) => circle(x + 24 + i * 22, y + 20, 7, c));
      text("ssh user@server", x + 300, y + 20, { size: 18, mono: true, color: C.dim, align: "center" });
      const typed = t > S.w(1, "plug it back") + 1;
      text("user@server:~$ " + (typed ? "uptime" : ""), x + 24, y + 80, { size: 22, mono: true, color: C.tcp });
      if (typed) save(() => text(" 14:02:11 up 41 days,  load 0.08", x + 24, y + 118, { size: 22, mono: true }), prog(t, S.w(1, "plug it back") + 1.6, 0.2));
      save(() => { check(x + 60, y + 200, 16); text("same connection, as if nothing happened", x + 90, y + 200, { size: 24, weight: 700, color: C.tcp }); }, prog(t, S.w(1, "carries on"), 0.4));
      save(() => text("(as long as your IP address didn't change)", x + 300, y + 255, { size: 20, color: C.dim, align: "center" }), S.pw(1, "as long as", 0, 0.4));
    }, S.p(1, 0.3) * (1 - S.p(2, 0, 0.5)));

    // cue 3: data -> RST
    if (t > S.c(3)) {
      const t0 = S.c(3) + 0.3;
      const u = (t - t0) / 1.8;
      if (u > 0 && u < 1) packet(lerp(360, 1560, easeIO(u)), 300, "data seq=9001", C.tcp, { size: 20 });
      save(() => {
        rrect(1340, 600, 520, 150, 14, C.panel, C.bad + "aa", 2);
        text("lookup 192.168.1.20:52100 …", 1360, 640, { size: 22, mono: true });
        text("no such connection", 1360, 685, { size: 24, mono: true, weight: 700, color: C.bad });
        text("→ reply with RST", 1360, 725, { size: 22, mono: true, color: C.bad });
      }, S.pw(3, "finds nothing", -0.3, 0.4));
      if (rst > 0 && rst < 1) packet(lerp(1560, 360, easeIO(rst)), 300, "RST", C.bad, { size: 22 });
      save(() => {
        rrect(560, 620, 760, 110, 14, "#05080e", C.bad, 2);
        text("read: Connection reset by peer", 940, 675, { size: 30, mono: true, weight: 700, color: C.bad, align: "center" });
      }, S.pw(3, "famous error", 0, 0.4));
    }
  }, base);

  // cue 4: keepalive timeline
  save(() => {
    const x0 = 200, x1 = 1720, y = 430;
    text("TCP keepalive (optional)", x0, y - 120, { size: 30, weight: 800, color: C.tcp });
    line(x0, y, x1, y, C.dim, 3);
    for (let h = 0; h <= 2; h++) {
      const x = lerp(x0, x1, h / 2);
      line(x, y - 10, x, y + 10, C.dim, 3);
      text(h === 0 ? "last packet" : `${h} h`, x, y + 36, { size: 22, color: C.dim, align: "center" });
    }
    const pr = S.pw(4, "after a period", 0, 3);
    rrect(x0, y - 18, (x1 - x0) * pr, 36, 6, C.faint + "33");
    text("silence…", lerp(x0, x1, 0.45), y - 50, { size: 24, color: C.dim, align: "center" });
    save(() => {
      arrow(x1 - 20, y - 20, x1 - 20, y - 90, { color: C.tcp, lw: 4 });
      text("probe", x1 - 34, y - 80, { size: 22, weight: 700, color: C.tcp, align: "right" });
      arrow(x1 + 10, y - 90, x1 + 10, y - 20, { color: C.ip, lw: 4 });
      text("ACK?", x1 + 24, y - 80, { size: 22, weight: 700, color: C.ip });
    }, prog(t, S.w(4, "after a period") + 3, 0.4));
    save(() => text("Linux default:  net.ipv4.tcp_keepalive_time = 7200  (2 hours)", 960, y + 110, { size: 26, mono: true, color: C.warn, align: "center" }), S.pw(4, "two hours", -0.3, 0.4));
    // app heartbeats
    save(() => {
      const y2 = 720;
      text("app heartbeat: ping every 30 s", x0, y2 - 70, { size: 30, weight: 800, color: C.udp });
      line(x0, y2, x1, y2, C.dim, 3);
      const n = 240, shown = Math.floor(n * S.pw(4, "heartbeats", 0, 3));
      for (let i = 1; i <= shown; i++) {
        const x = lerp(x0, x1, i / n);
        line(x, y2 - 16, x, y2 + 16, C.udp, 2);
      }
      text("finds a dead peer in seconds, not hours", 960, y2 + 60, { size: 24, color: C.dim, align: "center" });
    }, S.pw(4, "heartbeats", -0.3, 0.5));
  }, S.p(4, 0.3));
};

// ---------------- NAT, closing, UDP ----------------
SCENES_FN.nat = (t, S) => {
  sceneTitle(t, "Tables all the way down", C.tcp, "NAT · HEARTBEATS · CLOSING");
  const natA = S.p(0, 0.2) * (1 - S.p(3, 0, 0.6));
  save(() => {
    const y = 330;
    laptop(170, y, 0.9, C.text, "laptop", "192.168.1.20");
    // router with NAT
    router(620, y, 1.3, C.warn);
    text("home router (NAT)", 620, y + 70, { size: 24, weight: 700, align: "center", color: C.warn });
    text("public 203.0.113.7", 620, y + 100, { size: 20, mono: true, align: "center", color: C.dim });
    server(1720, y, 0.9, C.text, "server", "142.250.72.14");
    line(250, y, 575, y, "#2a3654", 5);
    line(665, y, 1640, y, "#2a3654", 5);
    for (let x = 900; x <= 1400; x += 250) router(x, y, 0.6, C.ip);
    // badges
    const est = (x) => { rrect(x - 90, y - 150, 180, 36, 8, C.tcp + "22", C.tcp, 2); text("ESTABLISHED", x, y - 132, { size: 18, mono: true, weight: 700, color: C.tcp, align: "center" }); };
    est(170); est(1720);
    // NAT table
    const tx = 330, ty = 520, tw = 900;
    const rowA = S.pw(0, "keeps its own table", 0, 0.5);
    rrect(tx, ty, tw, 200, 14, C.panel, C.warn + "88", 2);
    text("NAT table", tx + 20, ty + 30, { size: 22, weight: 800, color: C.warn });
    text("inside", tx + 30, ty + 74, { size: 20, color: C.dim });
    text("outside", tx + 330, ty + 74, { size: 20, color: C.dim });
    text("idle for", tx + 700, ty + 74, { size: 20, color: C.dim });
    // idle / expiry logic
    const forget = S.pw(1, "forgets it", 0, 0.5);
    const hb = S.p(2, 0.3, 0.6);
    let idle;
    if (t < S.c(1)) idle = Math.max(0, t - S.w(0, "mapping") - 1.5) * 0.4;
    else if (t < S.c(2)) idle = lin(t, S.c(1) + 0.3, S.w(1, "forgets it") - S.c(1) - 0.3) * 300;
    else idle = ((t - S.c(2)) % 1.8) / 1.8 * 30;
    const rowCol = forget > 0.5 && hb < 0.5 ? C.bad : C.text;
    save(() => {
      const ry = ty + 130;
      rrect(tx + 14, ry - 30, tw - 28, 60, 8, forget > 0.5 && hb < 0.5 ? C.bad + "22" : C.panel2);
      text("192.168.1.20:52100", tx + 30, ry, { size: 24, mono: true, color: rowCol });
      text("203.0.113.7:61234", tx + 330, ry, { size: 24, mono: true, color: rowCol });
      const s = Math.floor(idle);
      text(s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`, tx + 700, ry, { size: 24, mono: true, color: idle > 200 ? C.bad : C.text });
    }, rowA * (1 - forget * (1 - hb)));
    save(() => text("entry expired — forgotten", tx + tw / 2, ty + 130, { size: 28, weight: 800, color: C.bad, align: "center" }), forget * (1 - hb));
    // outgoing packet with rewrite (cue 0)
    const u0 = (t - S.w(0, "mapping")) / 3.2;
    if (u0 > 0 && u0 < 1) {
      const x = u0 < 0.35 ? lerp(250, 600, u0 / 0.35) : lerp(640, 1640, (u0 - 0.35) / 0.65);
      const rewritten = u0 > 0.35;
      packet(x, y - 60, rewritten ? "src 203.0.113.7:61234" : "src 192.168.1.20:52100", rewritten ? C.warn : C.tcp, { size: 18 });
    }
    // reply dropped (cue 1)
    const u1 = (t - S.w(1, "Packets from the server")) / 1.8;
    if (u1 > 0) {
      const x = lerp(1640, 680, easeIO(clamp(u1)));
      save(() => {
        packet(x, y - 60, "dst 203.0.113.7:61234", C.ip, { size: 18 });
        if (u1 >= 1) { cross(x + 130, y - 60, 22); text("no mapping → dropped", x + 180, y - 110, { size: 24, weight: 700, color: C.bad }); }
      }, 1 - S.p(2, 0, 0.4));
    }
    // heartbeats (cue 2)
    if (t > S.c(2) + 0.3) {
      const period = 1.8, k = (t - S.c(2)) % period;
      const f = k / 0.9;
      if (f < 1) packet(lerp(250, 1640, easeIO(f)), y - 60, "ping", C.udp, { size: 18 });
      else if (f < 2) packet(lerp(1640, 250, easeIO(f - 1)), y - 60, "pong", C.udp, { size: 18 });
      save(() => text("a tiny ping every ~30 s resets every idle timer on the path", 780, 790, { size: 28, weight: 700, color: C.udp, align: "center" }), S.p(2, 1.5));
    }
  }, natA);

  // cue 3: closing
  const cA = S.p(3, 0.2) * (1 - S.p(4, 0, 0.6));
  save(() => {
    const cx = 700, sx = 1220, top = 230;
    text("laptop", cx, top - 20, { size: 26, weight: 800, align: "center" });
    text("server", sx, top - 20, { size: 26, weight: 800, align: "center" });
    line(cx, top + 10, cx, 800, C.faint, 3); line(sx, top + 10, sx, 800, C.faint, 3);
    seqArrow(cx, 280, sx, 340, "FIN", { p: S.p(3, 0.5, 0.8), color: C.warn });
    seqArrow(sx, 360, cx, 420, "ACK", { p: S.p(3, 1.5, 0.8), color: C.ip });
    seqArrow(sx, 450, cx, 510, "FIN", { p: S.p(3, 2.6, 0.8), color: C.warn });
    seqArrow(cx, 530, sx, 590, "ACK", { p: S.p(3, 3.6, 0.8), color: C.ip });
    const gone = S.pw(3, "records are deleted", 0, 1.0);
    save(() => recordCard(120, 330, 460, { h: 140, lines: ["→ :443", "state = ESTABLISHED"] }), 1 - gone);
    save(() => recordCard(1340, 330, 460, { h: 140, lines: ["→ :52100", "state = ESTABLISHED"] }), 1 - gone);
    save(() => {
      text("memory freed", 350, 400, { size: 30, weight: 800, color: C.dim, align: "center" });
      text("memory freed", 1570, 400, { size: 30, weight: 800, color: C.dim, align: "center" });
      text("closing doesn't cut a wire — it deletes two records", 960, 720, { size: 32, weight: 700, align: "center" });
    }, gone);
  }, cA);

  // cue 4: UDP keeps no per-connection state
  save(() => {
    // TCP side
    text("TCP server", 420, 230, { size: 30, weight: 800, color: C.tcp, align: "center" });
    for (let i = 0; i < 5; i++) recordCard(150 + i * 14, 280 + i * 60, 520, { h: 110, color: C.tcp });
    text("one record per connection", 420, 740, { size: 26, color: C.dim, align: "center" });
    // UDP side
    text("UDP server", 1350, 230, { size: 30, weight: 800, color: C.udp, align: "center" });
    const bx = 1150, by = 420;
    glow(C.udp, 20, () => rrect(bx, by, 400, 150, 16, C.panel2, C.udp, 3));
    text("UDP socket", bx + 200, by + 50, { size: 30, weight: 800, align: "center", color: C.udp });
    text("bound to :53", bx + 200, by + 100, { size: 26, mono: true, align: "center" });
    const srcs = [[980, 300], [1000, 690], [1720, 290], [1740, 700], [960, 500]];
    srcs.forEach(([sx0, sy0], i) => {
      const f = ((t * 0.5 + hash(i)) % 1);
      const e = easeIO(f) * 0.72;
      const x = lerp(sx0, bx + 200, e), y = lerp(sy0, by + 75, e);
      save(() => packet(x, y, "datagram", C.udp, { size: 16, glow: 6 }), 1 - lin(f, 0.8, 0.2));
    });
    text("no per-peer state: every datagram stands alone", 1350, 740, { size: 26, color: C.dim, align: "center" });
    save(() => text("want sessions? build them yourself (→ QUIC, later)", 960, 820, { size: 30, weight: 700, align: "center" }), S.pw(4, "If an app", 0, 0.5));
  }, S.p(4, 0.3));
};
