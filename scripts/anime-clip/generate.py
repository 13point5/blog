#!/usr/bin/env python3
"""
黄昏の刃 / Twilight Blade — a 20 second anime-style short, generated from code.

Everything (the visuals and the instrumental score) is procedural: no footage,
no samples, no voice. Run:

    pip install numpy pillow scipy imageio-ffmpeg
    python3 scripts/anime-clip/generate.py            # full render
    python3 scripts/anime-clip/generate.py --stills   # a few preview frames

Output: public/videos/twilight-blade.mp4

Title glyphs use subsets of Noto Serif JP (SIL OFL 1.1, see fonts/OFL.txt).
"""
import math
import os
import sys
import wave

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy.signal import butter, fftconvolve, lfilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "public", "videos", "twilight-blade.mp4")
TMP_WAV = os.path.join(HERE, ".score.wav")

W, H, FPS, DUR = 1280, 720, 24, 20.0
NF = int(FPS * DUR)
SR = 44100
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
T_SLASH = 16.0  # the cut lands on the downbeat of bar 9

LW = 2600  # width of the parallax world layers
CHAR_X, CHAR_Y = 2000, 520  # world position of the swordsman's feet
SUN_X = 1010


def smooth(x):
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3 - 2 * x)


def ramp(t, a, b):
    return float(smooth((t - a) / (b - a)))


def lerp(a, b, s):
    return a + (b - a) * s


# ─────────────────────────────────────────────────────────────── visuals ──


def fbm1d(n, octaves, seed, period):
    r = np.random.default_rng(seed)
    x = np.arange(n, dtype=np.float64)
    total = np.zeros(n)
    amp, norm, per = 1.0, 0.0, float(period)
    for _ in range(octaves):
        pts = r.uniform(-1, 1, int(n / per) + 3)
        xi = x / per
        i0 = xi.astype(int)
        f = smooth(xi - i0)
        total += amp * (pts[i0] * (1 - f) + pts[i0 + 1] * f)
        norm += amp
        amp *= 0.5
        per = max(per / 2, 1.0)
    return total / norm


def shift_down(mask, d):
    out = np.zeros_like(mask)
    out[d:] = mask[:-d]
    return out


def to_layer(rgb, alpha):
    """Store a layer premultiplied, with its inverse alpha, for fast compositing."""
    a = alpha[..., None].astype(np.float32)
    return (rgb * a).astype(np.float32), (1 - a).astype(np.float32)


def draw_pines(d, ridge, xs, rng, hmin, hmax):
    for x in xs:
        h = rng.uniform(hmin, hmax)
        y = ridge[int(np.clip(x, 0, len(ridge) - 1))] + 6
        tiers = 3
        for k in range(tiers):
            tw = h * (0.45 - 0.1 * k)
            ty = y - h * (0.35 * k)
            d.polygon([(x - tw, ty), (x + tw, ty), (x, ty - h * 0.55)], fill=255)
        d.rectangle([x - 1.5, y - 4, x + 1.5, y + 4], fill=255)


def draw_torii(d, x, y, s):
    # posts
    d.polygon([(x - 30 * s, y), (x - 25 * s, y - 62 * s), (x - 20 * s, y - 62 * s), (x - 23 * s, y)], fill=255)
    d.polygon([(x + 23 * s, y), (x + 20 * s, y - 62 * s), (x + 25 * s, y - 62 * s), (x + 30 * s, y)], fill=255)
    # nuki (lower beam)
    d.rectangle([x - 34 * s, y - 50 * s, x + 34 * s, y - 45 * s], fill=255)
    # kasagi (curved top beam)
    pts_top = [(x + u * 46 * s, y - 66 * s - 6 * s * (u * u)) for u in np.linspace(-1, 1, 12)]
    pts_bot = [(x + u * 42 * s, y - 60 * s - 4 * s * (u * u)) for u in np.linspace(1, -1, 12)]
    d.polygon(pts_top + pts_bot, fill=255)
    d.rectangle([x - 3 * s, y - 62 * s, x + 3 * s, y - 48 * s], fill=255)


def mountain_layer(base, amp, seed, period, col, rim_col, haze_col, haze_amt, rim_w,
                   sharp=False, pines=0, pine_h=(14, 30), torii=None):
    n = fbm1d(LW, 6, seed, period)
    prof = (1 - np.abs(n)) ** 1.6 if sharp else n * 0.5 + 0.5
    ridge = base - amp * prof
    mask_img = Image.new("L", (LW, H), 0)
    d = ImageDraw.Draw(mask_img)
    rng = np.random.default_rng(seed + 100)
    if pines:
        draw_pines(d, ridge, rng.uniform(0, LW, pines), rng, *pine_h)
    if torii is not None:
        tx, ts = torii
        draw_torii(d, tx, ridge[int(tx)] + 4, ts)
    extra = np.asarray(mask_img, dtype=np.float32) / 255
    Y = np.arange(H, dtype=np.float32)[:, None]
    depth = Y - ridge[None, :].astype(np.float32)
    alpha = np.maximum(np.clip(depth + 1, 0, 1), extra)
    # haze by absolute height (not distance below the ridge) so jagged peaks don't streak
    haze = (np.clip((Y - (base - amp)) / (amp + 160), 0, 1) ** 1.3 * haze_amt)[..., None]
    haze = np.broadcast_to(haze, (H, LW, 1))
    rgb = np.array(col, np.float32) / 255 * (1 - haze) + np.array(haze_col, np.float32) / 255 * haze
    # rim light along the top edge (ridge + trees), strongest right at the edge
    m = alpha > 0.5
    rim = np.zeros((H, LW), np.float32)
    for k in range(1, rim_w + 1):
        rim = np.maximum(rim, (m & ~shift_down(m, k)) * (1 - (k - 1) / rim_w))
    rim = (rim * 0.85)[..., None]
    rgb = rgb * (1 - rim) + np.array(rim_col, np.float32) / 255 * rim
    return to_layer(rgb, alpha)


def cloud_layer(seed):
    rng = np.random.default_rng(seed)
    rgb = np.zeros((H, LW, 3), np.float32)
    alpha = np.zeros((H, LW), np.float32)
    clouds = []
    for _ in range(26):
        cy = rng.uniform(150, 400)
        clouds.append((rng.uniform(-100, LW + 100), cy, rng.uniform(220, 620), rng.uniform(26, 70)))
    clouds.sort(key=lambda c: c[1])  # higher (darker) clouds behind lower ones
    for cx, cy, cw, ch in clouds:
        pad = 40
        bw, bh = int(cw + 2 * pad), int(ch * 2.2 + 2 * pad)
        img = Image.new("L", (bw, bh), 0)
        d = ImageDraw.Draw(img)
        base_y = pad + ch * 1.6
        for _ in range(int(cw / 38)):
            ex = rng.uniform(pad + ch * 0.4, bw - pad - ch * 0.4)
            edge = 1 - abs((ex - bw / 2) / (cw / 2))
            er = ch * (0.35 + 0.65 * edge) * rng.uniform(0.6, 1.1)
            d.ellipse([ex - er * 1.5, base_y - er * 1.9, ex + er * 1.5, base_y + er * 0.3], fill=255)
        d.rectangle([0, base_y, bw, bh], fill=0)  # flat anime cloud bottoms
        img = img.filter(ImageFilter.GaussianBlur(1.2))
        m = np.asarray(img, np.float32) / 255
        mb = m > 0.5
        top = np.zeros_like(m)
        for k in range(1, 9):
            top = np.maximum(top, (mb & ~shift_down(mb, k)) * (1 - (k - 1) / 8))
        bottom = np.zeros_like(m)
        for k in range(1, 7):
            up = np.zeros_like(mb)
            up[:-k] = mb[k:]
            bottom = np.maximum(bottom, (mb & ~up) * (1 - (k - 1) / 6))
        low = np.clip((cy - 70) / 320, 0, 1)
        body = lerp(np.array([118, 80, 150]), np.array([236, 132, 150]), low) / 255
        shade = body * np.array([0.72, 0.62, 0.9])
        rim_c = lerp(np.array([255, 170, 150]), np.array([255, 222, 160]), low) / 255
        c = np.broadcast_to(body, m.shape + (3,)).copy()
        c = c * (1 - bottom[..., None] * 0.8) + shade * bottom[..., None] * 0.8
        c = c * (1 - top[..., None] * 0.9) + rim_c * top[..., None] * 0.9
        a = m * 0.94
        x0, y0 = int(cx - bw / 2), int(cy - bh / 2)
        xa, xb = max(x0, 0), min(x0 + bw, LW)
        ya, yb = max(y0, 0), min(y0 + bh, H)
        if xa >= xb or ya >= yb:
            continue
        sl = (slice(ya, yb), slice(xa, xb))
        ls = (slice(ya - y0, yb - y0), slice(xa - x0, xb - x0))
        aa = a[ls][..., None]
        rgb[sl] = rgb[sl] * (1 - aa) + c[ls] * aa
        alpha[sl] = alpha[sl] + a[ls] * (1 - alpha[sl])
    # un-premultiply what we accumulated so to_layer can premultiply again
    safe = np.maximum(alpha, 1e-4)[..., None]
    col = np.where(alpha[..., None] > 0, rgb / safe * np.minimum(alpha[..., None] / safe, 1), 0)
    return to_layer(np.clip(col, 0, 1), alpha)


def cliff_layer():
    pts = [(1740, H), (1768, 690), (1790, 650), (1805, 612), (1826, 588), (1850, 566),
           (1880, 548), (1915, 534), (1950, 523), (1990, 520), (2050, 520), (2100, 518),
           (2160, 512), (2240, 502), (2330, 488), (2450, 470), (2600, 452), (2600, H)]
    rng = np.random.default_rng(3)
    jag = [(x + rng.uniform(-3, 3), y + (rng.uniform(-2, 2) if 1950 > x or x > 2100 else 0)) for x, y in pts]
    img = Image.new("L", (LW, H), 0)
    ImageDraw.Draw(img).polygon(jag, fill=255)
    a = np.asarray(img, np.float32) / 255
    m = a > 0.5
    rim = np.zeros_like(a)
    for k in range(1, 5):
        rim = np.maximum(rim, (m & ~shift_down(m, k)) * (1 - (k - 1) / 4))
    rgb = np.broadcast_to(np.array([22, 10, 30], np.float32) / 255, (H, LW, 3)).copy()
    rim = (rim * 0.8)[..., None]
    rgb = rgb * (1 - rim) + np.array([255, 170, 110], np.float32) / 255 * rim
    return to_layer(rgb, a)


PALETTES = [
    # top, upper-mid, horizon, bottom
    [(38, 34, 98), (196, 92, 150), (255, 146, 96), (255, 204, 138)],  # sunset
    [(16, 14, 54), (124, 52, 122), (236, 94, 84), (255, 156, 104)],  # dusk
    [(22, 8, 42), (150, 30, 84), (255, 74, 62), (255, 170, 118)],  # after the cut
]
STOPS = np.array([0, 0.42, 0.7, 1.0]) * (H - 1)


def sky_column(t):
    s1, s2 = ramp(t, 0, 15.5), ramp(t, T_SLASH, T_SLASH + 1.5)
    cols = []
    for i in range(4):
        a, b, c = (np.array(p[i], np.float64) for p in PALETTES)
        cols.append(lerp(lerp(a, b, s1), c, s2) / 255)
    cols = np.array(cols)
    y = np.arange(H)
    return np.stack([np.interp(y, STOPS, cols[:, ch]) for ch in range(3)], -1).astype(np.float32)


class Scene:
    def __init__(self):
        print("building layers…", flush=True)
        self.clouds = cloud_layer(11)
        self.far = mountain_layer(500, 210, 21, 420, (118, 70, 140), (255, 176, 138), (236, 136, 146), 0.75, 3, sharp=True)
        self.mid = mountain_layer(585, 120, 37, 300, (70, 38, 94), (255, 150, 120), (190, 96, 126), 0.55, 2,
                                  pines=90, pine_h=(12, 26))
        self.near = mountain_layer(668, 90, 53, 260, (40, 20, 56), (255, 140, 110), (120, 56, 96), 0.35, 2,
                                   pines=70, pine_h=(20, 42), torii=(640, 1.0))
        self.cliff = cliff_layer()

        yy, xx = np.mgrid[0:2 * H, 0:2 * W].astype(np.float32)
        self.dist = np.hypot(xx - W, yy - H)
        self.glow = 0.5 * np.exp(-self.dist / 240) + 0.5 * np.exp(-self.dist / 70)

        r = np.random.default_rng(5)
        n = 220
        self.star_x = r.integers(0, W, n)
        self.star_y = (r.uniform(0, 1, n) ** 1.6 * H * 0.5).astype(int)
        self.star_b = r.uniform(0.3, 1.0, n)
        self.star_p = r.uniform(0, 2 * np.pi, n)

        yv, xv = np.mgrid[0:H, 0:W].astype(np.float32)
        rr = ((xv - W / 2) / (W / 2)) ** 2 + ((yv - H / 2) / (H / 2)) ** 2
        self.vignette = (1 - 0.42 * np.clip(rr / 2, 0, 1) ** 1.2)[..., None].astype(np.float32)
        self.grain_rng = np.random.default_rng(99)

        self.petals = Petals()
        self.lines_rng = np.random.default_rng(77)
        self.speed_cache = None
        self.slash_img = make_slash()
        self.title = make_title()

    # camera ------------------------------------------------------------
    @staticmethod
    def cam_x(t):
        return 1100 * ramp(t, 0.6, 9.8)

    @staticmethod
    def zoom(t):
        """Returns (zoom, focus screen x, focus screen y, target screen x, target screen y)."""
        fx, fy = CHAR_X - Scene.cam_x(t), CHAR_Y - 130
        if t < T_SLASH:
            p = ramp(t, 9.0, 15.95)
            z = 1 + 0.36 * p
            sx = lerp(fx, 800, p)
        else:
            u = t - T_SLASH
            z = 1.2 + 0.28 * math.exp(-u * 4.5) + 0.05 * ramp(t, 16.5, 20)
            sx = lerp(800, 780, ramp(t, 16, 18))
        return z, fx, fy, sx, fy

    def layer(self, dst, layer, ox):
        pm, inv = layer
        ox = int(np.clip(round(ox), 0, LW - W))
        dst *= inv[:, ox:ox + W]
        dst += pm[:, ox:ox + W]

    def render(self, i):
        t = i / FPS
        cam = self.cam_x(t)
        frame = np.broadcast_to(sky_column(t)[:, None, :], (H, W, 3)).copy()

        # stars fade in as the dusk deepens
        sa = ramp(t, 4, 14) * 0.9
        if sa > 0:
            v = sa * self.star_b * (0.55 + 0.45 * np.sin(3.1 * t + self.star_p)) * (1 - self.star_y / (0.55 * H))
            v = np.clip(v, 0, 1)[:, None]
            frame[self.star_y, self.star_x] = frame[self.star_y, self.star_x] * (1 - v) + v

        # sun
        sx, sy = int(SUN_X - 0.1 * cam), int(385 + 1.2 * t)
        d = self.dist[H - sy:2 * H - sy, W - sx:2 * W - sx]
        g = self.glow[H - sy:2 * H - sy, W - sx:2 * W - sx]
        frame += g[..., None] * np.array([0.75, 0.42, 0.22], np.float32) * 0.8
        disk = np.clip(78 - d, 0, 1)[..., None]
        frame = frame * (1 - disk) + np.array([1.0, 0.94, 0.78], np.float32) * disk

        self.layer(frame, self.clouds, cam * 0.2 + t * 7)
        self.layer(frame, self.far, cam * 0.33)
        self.layer(frame, self.mid, cam * 0.52)
        self.layer(frame, self.near, cam * 0.74)
        self.layer(frame, self.cliff, cam)

        # the swordsman
        cx = CHAR_X - cam
        if cx < W + 320:
            ch, (ax, ay) = draw_character(t, t >= T_SLASH)
            paste(frame, ch, int(cx) - ax, CHAR_Y - ay)

        # bloom back over the silhouettes + anamorphic streak through the sun
        frame += g[..., None] * np.array([0.9, 0.5, 0.3], np.float32) * 0.22
        streak_amt = 0.18 + 0.5 * math.exp(-max(t - T_SLASH, 0) * 2.0) * (t >= T_SLASH)
        ys = np.exp(-np.abs(np.arange(H) - sy) / 2.5)[:, None]
        xs = np.exp(-np.abs(np.arange(W) - sx) / 520)[None, :]
        frame += (ys * xs)[..., None] * np.array([1.0, 0.7, 0.5], np.float32) * streak_amt
        np.clip(frame, 0, 1, out=frame)

        # camera zoom + shake
        z, fx, fy, tx, ty = self.zoom(t)
        cw, chh = W / z, H / z
        left = np.clip(fx - tx / z, 0, W - cw)
        top = np.clip(fy - ty / z, 0, H - chh)
        if t >= T_SLASH:
            amp = 16 * math.exp(-(t - T_SLASH) * 6)
        else:
            amp = 2.2 * ramp(t, 14.5, 15.9)
        if amp > 0.05:
            r = np.random.default_rng(i)
            left = np.clip(left + r.normal() * amp / z, 0, W - cw)
            top = np.clip(top + r.normal() * amp / z, 0, H - chh)
        img = Image.fromarray((frame * 255).astype(np.uint8)).resize(
            (W, H), Image.BICUBIC, box=(left, top, left + cw, top + chh))
        focus = ((fx - left) * z, (fy - top) * z)

        img = img.convert("RGBA")
        img.alpha_composite(self.petals.draw(t, focus))
        sl = speed_lines(t, focus, self)
        if sl is not None:
            img.alpha_composite(sl)
        k = int(round((t - T_SLASH) * FPS)) if t >= T_SLASH - 1e-6 else -1
        if 0 <= k:
            fade = 1.0 if k < 4 else math.exp(-(t - T_SLASH - 4 / FPS) * 4)
            if fade > 0.01:
                s = self.slash_img.copy()
                s.putalpha(s.getchannel("A").point(lambda v: int(v * fade)))
                img.alpha_composite(s)
        out = np.asarray(img.convert("RGB"), np.float32) / 255

        # impact frames: pure white, then two red/black/white posterised frames
        if k == 0:
            out[:] = 1.0
        elif k in (1, 2):
            lum = out @ np.array([0.3, 0.55, 0.15], np.float32)
            red = np.array([0.86, 0.08, 0.14], np.float32)
            post = np.where((lum < 0.16)[..., None], 0.02, np.where((lum < 0.42)[..., None], red, 0.97))
            out = (post if k == 1 else 1 - post).astype(np.float32)
        elif k >= 3:
            flash = 0.85 * math.exp(-(t - T_SLASH - 3 / FPS) * 5.5)
            out = out * (1 - flash) + flash

        out *= self.vignette
        out += self.grain_rng.normal(0, 0.007, (H, W, 1)).astype(np.float32)

        ta = ramp(t, 16.9, 17.8)
        if ta > 0:
            ti = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).convert("RGBA")
            layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            layer.paste(self.title, (int(-40 * (1 - ta)), 0))
            layer.putalpha(layer.getchannel("A").point(lambda v: int(v * ta)))
            ti.alpha_composite(layer)
            out = np.asarray(ti.convert("RGB"), np.float32) / 255

        bar = 62
        out[:bar] = 0
        out[H - bar:] = 0
        out *= ramp(t, 0, 1.3) * (1 - ramp(t, 18.7, 19.95))
        return (np.clip(out, 0, 1) * 255).astype(np.uint8)


def paste(frame, rgba, x0, y0):
    h, w = rgba.shape[:2]
    xa, xb = max(x0, 0), min(x0 + w, W)
    ya, yb = max(y0, 0), min(y0 + h, H)
    if xa >= xb or ya >= yb:
        return
    src = rgba[ya - y0:yb - y0, xa - x0:xb - x0]
    a = src[..., 3:4]
    dst = frame[ya:yb, xa:xb]
    frame[ya:yb, xa:xb] = dst * (1 - a) + src[..., :3] * a


# ──────────────────────────────────────────────────────────── character ──

CW, CH = 560, 380
AX, AY = 320, 330
DARK = (18, 8, 26, 255)
RIBBON = (178, 26, 44, 255)


def ribbon_poly(x0, y0, length, w0, w1, phase, t, wind):
    s = np.linspace(0, 1, 18)
    xs = x0 - length * s * (0.86 + 0.14 * np.cos(3 * t + phase)) * min(wind, 1.6) / 1.2
    ys = y0 + 8 * s + (6 + 7 * wind) * s * np.sin(8 * s - 7.5 * t * wind ** 0.5 + phase)
    wv = w0 + (w1 - w0) * s
    dx, dy = np.gradient(xs), np.gradient(ys)
    nn = np.hypot(dx, dy) + 1e-6
    nx, ny = -dy / nn, dx / nn
    left = list(zip(xs + nx * wv / 2, ys + ny * wv / 2))
    right = list(zip(xs - nx * wv / 2, ys - ny * wv / 2))
    return left + right[::-1]


def draw_character(t, drawn):
    img = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    def P(pts):
        return [(AX + x, AY + y) for x, y in pts]

    wind = 1 + 0.6 * ramp(t, 8, 15.5)
    if t >= T_SLASH:
        wind += 0.9 * math.exp(-(t - T_SLASH) * 1.6)

    crouch = 8 if drawn else 0
    hip_y = -112 + crouch
    lean = 6 if drawn else 0
    sh_b, sh_f = (-12 + lean, -186 + crouch), (14 + lean, -182 + crouch)
    head = (6 + lean * 1.4, -204 + crouch)

    # headband tails (behind everything)
    for ph, ln, w0 in ((0.0, 96, 7), (1.9, 78, 5)):
        d.polygon(P(ribbon_poly(head[0] - 12, head[1] - 4, ln, w0, 2.5, ph, t, wind)), fill=RIBBON)

    # haori coat
    tx = -34 - 56 * wind * (1 + 0.12 * math.sin(5.3 * t))
    ty = -64 + crouch + 9 * math.sin(7 * t)
    front = [sh_f, (21 + lean, -150 + crouch), (24 + lean * 0.6, -110 + crouch), (25, -72 + crouch), (22, -52 + crouch)]
    hem = []
    for s in np.linspace(0, 1, 10):
        hem.append((lerp(22, tx, s), lerp(-52 + crouch, ty, s) + 5 * s * math.sin(10 * s - 9 * t)))
    back = []
    for s in np.linspace(1, 0, 10):
        bulge = 12 * math.sin(math.pi * s) * wind * (1 + 0.25 * math.sin(6 * t + 2 * s))
        back.append((lerp(sh_b[0], tx, s) - bulge, lerp(sh_b[1], ty, s)))
    d.polygon(P(front + hem + back), fill=DARK)

    # legs
    if drawn:
        legs = [((-6, hip_y), (-22, -56), (-40, 0)), ((6, hip_y), (26, -60), (40, 0))]
    else:
        legs = [((-6, hip_y), (-12, -58), (-18, 0)), ((6, hip_y), (13, -58), (24, 0))]
    for hip, knee, foot in legs:
        d.line(P([hip, knee, foot]), fill=DARK, width=15, joint="curve")
        for jx, jy in (knee, hip):
            d.ellipse([AX + jx - 7, AY + jy - 7, AX + jx + 7, AY + jy + 7], fill=DARK)
        fx, fy = foot
        d.polygon(P([(fx - 8, fy - 8), (fx + 16, fy - 3), (fx + 17, fy + 1), (fx - 9, fy + 1)]), fill=DARK)

    # torso
    d.polygon(P([(-15, hip_y), (15, hip_y), (sh_f[0] + 2, sh_f[1]), (sh_b[0], sh_b[1])]), fill=DARK)
    d.ellipse([AX + head[0] - 7, AY + head[1] + 8, AX + head[0] + 7, AY + head[1] + 24], fill=DARK)  # neck

    # sheathed sword at the hip (the saya stays there after the draw)
    d.line(P([(26, hip_y + 4), (-88, hip_y + 34)]), fill=DARK, width=6)
    if drawn:
        shoulder, elbow, hand = (12 + lean, -176 + crouch), (44, -150 + crouch), (74, -134 + crouch)
        d.line(P([shoulder, elbow, hand]), fill=DARK, width=11, joint="curve")
        d.line(P([hand, (hand[0] + 16, hand[1] - 4)]), fill=DARK, width=5)  # tsuka
        blade_end = (hand[0] + 150, hand[1] + 46)
        d.line(P([(hand[0] + 2, hand[1]), blade_end]), fill=DARK, width=4)
    else:
        d.line(P([(26, hip_y + 4), (48, hip_y - 6)]), fill=DARK, width=6)  # tsuka
        d.ellipse([AX + 22, AY + hip_y - 3, AX + 32, AY + hip_y + 11], fill=DARK)  # tsuba
        d.line(P([(12, -176), (22, -140), (40, hip_y - 2)]), fill=DARK, width=11, joint="curve")

    # head + spiky hair swept back by the wind
    hx, hy = head
    d.ellipse([AX + hx - 15, AY + hy - 15, AX + hx + 15, AY + hy + 15], fill=DARK)
    d.polygon(P([(hx + 12, hy + 2), (hx + 17, hy + 6), (hx + 11, hy + 9)]), fill=DARK)  # nose/chin hint
    hair = [(hx + 15 * math.cos(math.radians(-40)), hy + 15 * math.sin(math.radians(-40)))]
    spikes = [-70, -96, -122, -146, -170, 166, 142]
    for j, a in enumerate(spikes):
        ar = math.radians(a)
        ln = 14 + 7 * math.sin(j * 1.7 + 1) + 3 * wind
        sway = math.sin(8 * t * wind ** 0.5 + j * 0.9)
        tipx = hx + (15 + ln) * math.cos(ar) - 6 * wind - 3 * sway
        tipy = hy + (15 + ln) * math.sin(ar) + 2.5 * sway
        hair.append((tipx, tipy))
        mid = math.radians(a - 12 if j + 1 < len(spikes) else a - 30)
        hair.append((hx + 16 * math.cos(mid), hy + 16 * math.sin(mid)))
    d.polygon(P(hair), fill=DARK)

    arr = np.asarray(img, np.float32) / 255
    mask = img.getchannel("A")
    edge = (np.asarray(mask, np.float32) - np.asarray(mask.filter(ImageFilter.MinFilter(5)), np.float32)) / 255
    rim = np.clip(edge * 0.9, 0, 1)[..., None]
    rgb = arr[..., :3] * (1 - rim) + np.array([1.0, 0.72, 0.44], np.float32) * rim
    out = np.concatenate([rgb, arr[..., 3:4]], -1)

    # grass on the ledge, bending in the wind (only faintly rim-lit, so it stays dark)
    grass = Image.new("L", (CW, CH), 0)
    gd = ImageDraw.Draw(grass)
    r = np.random.default_rng(12)
    for gx in np.sort(r.uniform(-200, 220, 46)):
        gh = r.uniform(7, 20)
        bend = (6 + 5 * wind) * (0.6 + 0.4 * math.sin(6 * t * wind ** 0.5 + gx * 0.08))
        gd.polygon(P([(gx - 3, 5), (gx + 3, 5), (gx - bend, 5 - gh)]), fill=255)
    ga = np.asarray(grass, np.float32)[..., None] / 255
    tipness = np.clip((AY + 2 - np.arange(CH, dtype=np.float32)) / 18, 0, 1)[:, None, None]
    gcol = np.array(DARK[:3], np.float32) / 255 * (1 - 0.4 * tipness) + np.array([0.9, 0.5, 0.35], np.float32) * 0.4 * tipness
    out[..., :3] = out[..., :3] * (1 - ga) + gcol * ga
    out[..., 3:4] = np.maximum(out[..., 3:4], ga)

    if drawn:
        # a thin shine along the drawn blade
        shine = Image.new("L", (CW, CH), 0)
        ImageDraw.Draw(shine).line(P([(76, -135 + crouch), (74 + 146, -134 + crouch + 44)]), fill=255, width=1)
        sa = np.asarray(shine, np.float32)[..., None] / 255 * 0.9
        out[..., :3] = out[..., :3] * (1 - sa) + sa
    elif 15.1 < t < T_SLASH:
        # the glint before the cut: a four-point star on the tsuba
        g = math.sin(math.pi * (t - 15.1) / 0.85) ** 2
        star = Image.new("L", (CW, CH), 0)
        sd = ImageDraw.Draw(star)
        cx, cy = AX + 30, AY - 108
        L = 10 + 70 * g
        sd.polygon([(cx - L, cy), (cx, cy - 3), (cx + L, cy), (cx, cy + 3)], fill=255)
        sd.polygon([(cx, cy - L * 0.7), (cx + 3, cy), (cx, cy + L * 0.7), (cx - 3, cy)], fill=255)
        sa = np.asarray(star.filter(ImageFilter.GaussianBlur(0.8)), np.float32)[..., None] / 255 * g
        out[..., :3] = out[..., :3] * (1 - sa) + sa
        out[..., 3:4] = np.maximum(out[..., 3:4], sa)
    return out, (AX, AY)


# ────────────────────────────────────────────────────────────────── FX ──


class Petals:
    N = 170

    def __init__(self):
        r = self.r = np.random.default_rng(42)
        n = self.N
        self.x = r.uniform(0, W, n)
        self.y = r.uniform(-40, H, n)
        self.vx = -r.uniform(50, 150, n)
        self.vy = r.uniform(18, 60, n)
        self.rot = r.uniform(0, np.pi, n)
        self.spin = r.uniform(-3, 3, n)
        self.tum = r.uniform(0, 2 * np.pi, n)
        self.tspd = r.uniform(2, 6, n)
        self.size = r.uniform(4, 9, n)
        self.size[:10] = r.uniform(16, 26, 10)  # a few big, out-of-focus foreground petals
        self.col = r.integers(0, 3, n)
        self.bx = np.zeros(n)
        self.by = np.zeros(n)
        self.last_t = 0.0
        self.burst_done = False

    def step(self, t, focus):
        dt = t - self.last_t
        self.last_t = t
        if not self.burst_done and t >= T_SLASH:
            ang = np.arctan2(self.y - focus[1], self.x - focus[0])
            mag = self.r.uniform(350, 900, self.N)
            self.bx, self.by = np.cos(ang) * mag, np.sin(ang) * mag
            self.burst_done = True
        wind = 1 + 1.0 * ramp(t, 8, 15.5)
        self.x += (self.vx * wind + self.bx) * dt
        self.y += (self.vy + 25 * np.sin(1.3 * t + self.tum) + self.by) * dt
        drag = math.exp(-dt * 2.2)
        self.bx *= drag
        self.by *= drag
        self.rot += self.spin * dt
        self.tum += self.tspd * dt
        out = (self.x < -40) | (self.y > H + 40) | (self.x > W + 200) | (self.y < -200)
        k = out.sum()
        if k:
            self.x[out] = W + self.r.uniform(0, 80, k)
            self.y[out] = self.r.uniform(-60, H * 0.85, k)
            self.bx[out] = 0
            self.by[out] = 0

    def draw(self, t, focus):
        self.step(t, focus)
        count = int(self.N * (0.3 + 0.7 * ramp(t, 6, 15)))
        sharp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        blur = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ds, db = ImageDraw.Draw(sharp), ImageDraw.Draw(blur)
        cols = [(255, 183, 213), (255, 214, 232), (246, 150, 190)]
        for j in range(self.N):
            if j >= 10 and j - 10 >= count:
                continue
            if j < 10 and t < 7:
                continue
            a = self.size[j]
            b = a * (0.15 + 0.5 * abs(math.cos(self.tum[j])))
            cr, sr = math.cos(self.rot[j]), math.sin(self.rot[j])
            pts = []
            for u in np.linspace(0, 2 * np.pi, 11)[:-1]:
                ex = a * math.cos(u) * (0.8 if math.cos(u) > 0.9 else 1.0)
                ey = b * math.sin(u)
                pts.append((self.x[j] + ex * cr - ey * sr, self.y[j] + ex * sr + ey * cr))
            c = cols[self.col[j]] + (235,)
            (db if j < 10 else ds).polygon(pts, fill=c)
        blur = blur.filter(ImageFilter.GaussianBlur(3.5))
        sharp.alpha_composite(blur)
        return sharp


def speed_lines(t, focus, scene):
    if t < 14.3 or t > T_SLASH + 0.7:
        return None
    amt = ramp(t, 14.3, 15.9) * 0.55 if t < T_SLASH else 0.8 * (1 - ramp(t, T_SLASH, T_SLASH + 0.7))
    key = int(t * FPS) // 2
    if scene.speed_cache is None or scene.speed_cache[0] != key:
        r = scene.lines_rng
        img = Image.new("L", (W, H), 0)
        d = ImageDraw.Draw(img)
        fx, fy = focus
        for _ in range(90):
            ang = r.uniform(0, 2 * np.pi)
            rin = r.uniform(300, 480) if t < T_SLASH else r.uniform(200, 380)
            wid = r.uniform(0.004, 0.02)
            tip = (fx + rin * math.cos(ang), fy + rin * math.sin(ang))
            p1 = (fx + 1600 * math.cos(ang - wid), fy + 1600 * math.sin(ang - wid))
            p2 = (fx + 1600 * math.cos(ang + wid), fy + 1600 * math.sin(ang + wid))
            d.polygon([tip, p1, p2], fill=int(r.uniform(150, 255)))
        scene.speed_cache = (key, img)
    lines = scene.speed_cache[1].point(lambda v: int(v * amt))
    out = Image.new("RGBA", (W, H), (255, 246, 236, 0))
    out.putalpha(lines)
    return out


def make_slash():
    p0, p1 = (W * 1.08, H * 0.08), (-W * 0.08, H * 0.9)
    glow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(glow).line([p0, p1], fill=255, width=44)
    glow = glow.filter(ImageFilter.GaussianBlur(14))
    core = Image.new("L", (W, H), 0)
    cd = ImageDraw.Draw(core)
    # tapered core: wide in the middle, needle-thin at the ends
    for s0 in np.linspace(0, 1, 40, endpoint=False):
        s1 = s0 + 1 / 40
        wmid = 1 + 9 * math.sin(math.pi * (s0 + s1) / 2)
        a = (lerp(p0[0], p1[0], s0), lerp(p0[1], p1[1], s0))
        b = (lerp(p0[0], p1[0], s1), lerp(p0[1], p1[1], s1))
        cd.line([a, b], fill=255, width=int(wmid))
    g = np.asarray(glow, np.float32) / 255
    c = np.asarray(core, np.float32) / 255
    rgb = np.zeros((H, W, 3), np.float32)
    rgb[:] = np.array([1.0, 0.45, 0.35])
    rgb = rgb * (1 - c[..., None]) + c[..., None]
    a = np.clip(g + c, 0, 1)
    return Image.fromarray((np.concatenate([rgb, a[..., None]], -1) * 255).astype(np.uint8), "RGBA")


def make_title():
    fonts = os.path.join(HERE, "fonts")
    glyph_font = {
        "黄": "noto-serif-jp-95-900-normal.woff2",
        "昏": "noto-serif-jp-66-900-normal.woff2",
        "の": "noto-serif-jp-119-900-normal.woff2",
        "刃": "noto-serif-jp-79-900-normal.woff2",
    }
    mask = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(mask)
    x, y = 96, 190
    for chh in "黄昏の刃":
        size = 76 if chh == "の" else 112
        f = ImageFont.truetype(os.path.join(fonts, glyph_font[chh]), size)
        d.text((x, y + (112 - size) * 0.8), chh, font=f, fill=255)
        x += f.getlength(chh) + 6
    title_right = x
    sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 26)
    sx = 100
    for chh in "TWILIGHT  BLADE":
        d.text((sx, 372), chh, font=sub, fill=235)
        sx += sub.getlength(chh) + 7
    d.rectangle([100, 354, max(title_right, sx) - 10, 356], fill=255)

    glow = mask.filter(ImageFilter.GaussianBlur(12))
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g = Image.new("RGBA", (W, H), (230, 40, 50, 0))
    g.putalpha(glow.point(lambda v: min(255, int(v * 1.6))))
    out.alpha_composite(g)
    txt = Image.new("RGBA", (W, H), (255, 244, 234, 0))
    txt.putalpha(mask)
    out.alpha_composite(txt)
    return out


# ───────────────────────────────────────────────────────────────── score ──


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


class Mix:
    def __init__(self):
        self.n = int(DUR * SR)
        self.dry = np.zeros((2, self.n))
        self.send = np.zeros((2, self.n))

    def add(self, start, sig, gain=1.0, pan=0.0, rev=0.0):
        i0 = int(start * SR)
        if i0 >= self.n:
            return
        sig = sig[: self.n - i0]
        th = (pan + 1) * math.pi / 4
        for ch, g in enumerate((math.cos(th), math.sin(th))):
            self.dry[ch, i0:i0 + len(sig)] += sig * gain * g * (1 - rev * 0.5)
            self.send[ch, i0:i0 + len(sig)] += sig * gain * g * rev


RNG_A = np.random.default_rng(2024)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def lowpass(x, fc, order=2):
    b, a = butter(order, min(fc, SR * 0.45) / (SR / 2))
    return lfilter(b, a, x)


def highpass(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), btype="high")
    return lfilter(b, a, x)


def bandpass(x, lo, hi, order=2):
    b, a = butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band")
    return lfilter(b, a, x)


def pad_chord(notes, dur, cutoff):
    t = tt(dur + 0.8)
    sig = np.zeros_like(t)
    for m in notes:
        for det in (-0.09, 0.0, 0.08):
            f = mtof(m + det)
            sig += 2 * ((f * t + RNG_A.uniform()) % 1) - 1
    sig = lowpass(sig / (3 * len(notes)), cutoff)
    env = np.clip(t / 0.35, 0, 1) * np.clip((dur + 0.8 - t) / 0.8, 0, 1)
    return sig * env


def koto(m, dur=1.6, bright=0.55):
    """Karplus–Strong plucked string, a little koto-ish."""
    f = mtof(m)
    N = int(SR / f)
    n = int(dur * SR)
    buf = np.zeros(n + N + 1)
    exc = lfilter([bright], [1, -(1 - bright)], RNG_A.uniform(-1, 1, N))
    buf[1:N + 1] = exc
    decay = 0.996
    for s in range(N + 1, n + N + 1, N):
        e = min(s + N, n + N + 1)
        buf[s:e] = decay * 0.5 * (buf[s - N:e - N] + buf[s - N - 1:e - N - 1])
    out = buf[1:n + 1]
    out *= np.clip((dur - np.arange(n) / SR) / 0.2, 0, 1)
    return out


def flute(m, dur):
    t = tt(dur + 0.15)
    f = mtof(m)
    vib = 1 + 0.007 * np.sin(2 * np.pi * 5.4 * t) * np.clip((t - 0.18) / 0.3, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    sig = np.sin(ph) + 0.22 * np.sin(2 * ph) + 0.07 * np.sin(3 * ph)
    breath = bandpass(RNG_A.normal(0, 1, len(t)), f * 1.5, min(f * 4, 16000)) * 0.12
    env = np.clip(t / 0.07, 0, 1) * np.clip((dur + 0.15 - t) / 0.15, 0, 1) * (1 - 0.15 * t / (dur + 0.15))
    return (sig + breath) * env


def kick(big=1.0):
    t = tt(0.5 * big)
    f = 45 + 85 * np.exp(-t * 32)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8 / big)
    return s + RNG_A.normal(0, 1, len(t)) * np.exp(-t * 300) * 0.15


def snare():
    t = tt(0.3)
    noise = bandpass(RNG_A.normal(0, 1, len(t)), 1200, 7000) * np.exp(-t * 17) * 0.8
    return noise + np.sin(2 * np.pi * 186 * t) * np.exp(-t * 26) * 0.5


def hat(open_=False):
    t = tt(0.35 if open_ else 0.08)
    return highpass(RNG_A.normal(0, 1, len(t)), 7500) * np.exp(-t * (9 if open_ else 55)) * 0.5


def crash():
    t = tt(3.5)
    return highpass(RNG_A.normal(0, 1, len(t)), 4200) * np.exp(-t * 1.5)


def boom():
    t = tt(3.2)
    f = 26 + 44 * np.exp(-t * 2.2)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.2)
    return np.tanh(2.4 * s) / np.tanh(2.4)


def sword_ring():
    t = tt(2.5)
    s = np.zeros_like(t)
    for f, dcy, g in ((2960, 2.2, 1.0), (4430, 2.8, 0.7), (5890, 3.6, 0.5), (7330, 4.4, 0.35), (1480, 1.6, 0.4)):
        s += g * np.sin(2 * np.pi * f * t * (1 + 0.0015 * np.sin(2 * np.pi * 6 * t))) * np.exp(-t * dcy)
    return s * np.clip(t / 0.004, 0, 1)


def whoosh(dur):
    t = tt(dur)
    n = RNG_A.normal(0, 1, len(t))
    lo, hi = bandpass(n, 400, 1800), highpass(n, 2500)
    p = t / dur
    return (lo * (1 - p) + hi * p) * np.sin(np.pi * p) ** 2


def compose():
    mix = Mix()
    F = [53, 57, 60, 64]  # Fmaj7
    G = [55, 59, 62, 64]  # G6
    Em = [52, 55, 59, 62]  # Em7
    Am = [57, 60, 64, 67]  # Am7
    Fadd9 = [53, 57, 60, 64, 67]
    Cadd9 = [48, 55, 62, 64, 67]
    prog = [F, G, Em, Am, F, G, Em, Am, Fadd9, Cadd9]
    roots = [41, 43, 40, 45, 41, 43, 40, 45, 41, 36]

    # pads
    for b, ch in enumerate(prog):
        cutoff = 900 if b < 4 else (1900 if b < 8 else 2600)
        gain = 0.85 if b < 4 else (0.55 if b < 8 else 0.75)
        mix.add(b * BAR, pad_chord(ch, BAR, cutoff), gain, 0.0, rev=0.5)

    # koto arpeggio: eighths, sixteenths in the build bar, slow falling notes at the end
    pat8 = [0, 1, 2, 3, 4, 3, 2, 1]
    for b in range(8):
        tones = [m + 12 for m in prog[b]] + [prog[b][0] + 24]
        steps, dt = (16, BEAT / 4) if b == 7 else (8, BEAT / 2)
        for k in range(steps):
            idx = pat8[k % 8]
            g = (0.5 if b < 4 else 0.26) * (0.8 + 0.4 * (k % 2 == 0))
            if b == 7:
                g *= 0.6 + 0.8 * k / steps
                if k >= 15:
                    continue
            mix.add(b * BAR + k * dt, koto(tones[idx]), g, pan=-0.35 if k % 2 else 0.35, rev=0.35)
    for k, idx in enumerate([4, 3, 2, 1, 0, 1]):
        tones = [m + 12 for m in Cadd9]
        mix.add(9 * BAR + k * BEAT * 0.66 + 0.1, koto(tones[idx], 2.2, 0.45), 0.3, pan=0.3 * (-1) ** k, rev=0.55)

    # bass
    for b in range(4, 8):
        r = roots[b]
        pat = [r, r, r + 12, r, r, r + 12, r, r + 7]
        for k, m in enumerate(pat):
            if b == 7 and k >= 4:
                break
            t = tt(0.24)
            f = mtof(m)
            s = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 5) * np.clip(t / 0.005, 0, 1)
            s *= np.clip((0.24 - t) / 0.03, 0, 1)
            mix.add(b * BAR + k * BEAT / 2, s, 0.55)
    for b, dur in ((8, BAR), (9, BAR)):
        t = tt(dur)
        f = mtof(roots[b])
        s = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 0.9)
        s *= np.clip(t / 0.02, 0, 1) * np.clip((dur - t) / 0.2, 0, 1)
        mix.add(b * BAR, s, 0.5)

    # drums (bars 5–8)
    for b in range(4, 7):
        t0 = b * BAR
        for bt in (0, 1.5, 2.5):
            mix.add(t0 + bt * BEAT, kick(), 0.9)
        for bt in (1, 3):
            mix.add(t0 + bt * BEAT, snare(), 0.45, rev=0.2)
        for k in range(8):
            mix.add(t0 + k * BEAT / 2, hat(k == 7), 0.18 if k % 2 else 0.12, pan=0.25)
    t0 = 7 * BAR  # build bar: kick on every beat and an accelerating snare roll
    for bt in range(4):
        mix.add(t0 + bt * BEAT, kick(), 0.85)
    roll = [0, 0.5, 1, 1.5] + [2 + 0.25 * k for k in range(4)] + [3 + 0.125 * k for k in range(6)]
    for j, bt in enumerate(roll):
        mix.add(t0 + bt * BEAT, snare(), 0.25 + 0.4 * j / len(roll), rev=0.25)
    # riser into the cut, then a hard stop an eighth note before it
    t = tt(3.875)
    p = t / t[-1]
    n = RNG_A.normal(0, 1, len(t))
    riser = (lowpass(n, 700) * (1 - p) + highpass(n, 1500) * p) * p ** 2.2 * 0.5
    riser += np.sin(2 * np.pi * np.cumsum(160 * 2 ** (p * 2.6)) / SR) * p ** 2 * 0.12
    riser *= np.clip((t[-1] - t) / 0.01, 0, 1)
    mix.add(12.0, riser, 1.0, rev=0.3)

    # melody (shakuhachi-flavoured flute), bars 5–10
    mel = [(69, 1), (72, .5), (74, .5), (76, 1.5), (74, .5),
           (74, 1), (72, .5), (74, .5), (79, 1.5), (76, .5),
           (76, 1), (74, .5), (76, .5), (79, 1), (81, 1),
           (81, 1.5), (79, .5), (76, 1), (None, 1),
           (79, 2), (76, 2),
           (74, 1), (72, 3)]
    pos = 4 * BAR
    for m, beats in mel:
        dur = beats * BEAT
        if m is not None:
            mix.add(pos, flute(m, dur * 0.95), 0.2, pan=-0.1, rev=0.45)
        pos += dur

    # the cut
    mix.add(T_SLASH - 0.12, whoosh(0.2), 0.5, pan=0.4)
    mix.add(T_SLASH, kick(2.0), 1.2)
    mix.add(T_SLASH, boom(), 0.9)
    mix.add(T_SLASH, crash(), 0.28, rev=0.4)
    mix.add(T_SLASH, sword_ring(), 0.11, pan=0.2, rev=0.6)
    mix.add(T_SLASH + 0.02, whoosh(0.5), 0.35, pan=-0.4, rev=0.3)

    # reverb: stereo decaying-noise impulse response
    irt = tt(2.4)
    wet = np.zeros_like(mix.dry)
    for ch in range(2):
        ir = lowpass(RNG_A.normal(0, 1, len(irt)), 6000) * np.exp(-irt * 3.0)
        ir[: int(0.012 * SR)] = 0  # pre-delay
        ir /= np.sqrt(np.sum(ir ** 2))
        wet[ch] = fftconvolve(mix.send[ch], ir)[: mix.n] * 0.9
    out = mix.dry + wet
    out = highpass(out, 25)
    out /= np.max(np.abs(out)) + 1e-9
    out = np.tanh(1.6 * out) / np.tanh(1.6)
    t = np.arange(mix.n) / SR
    out *= np.clip(t / 0.05, 0, 1) * (1 - np.array([ramp(x, 18.6, 19.98) for x in t[::441]]).repeat(441)[: mix.n])
    out *= 0.93
    pcm = (out.T * 32767).astype(np.int16)
    with wave.open(TMP_WAV, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


# ────────────────────────────────────────────────────────────────── main ──


def main():
    if "--stills" in sys.argv:
        scene = Scene()
        want = [4.0, 9.0, 12.5, 16.08, 16.3, 17.9]
        for i in range(NF):
            t = i / FPS
            if not want:
                break
            frame = scene.render(i)  # every frame: the petal simulation is sequential
            hit = [w for w in want if abs(t - w) < 0.5 / FPS]
            if hit:
                want.remove(hit[0])
                Image.fromarray(frame).save(os.path.join(HERE, f".still-{t:05.2f}.png"))
                print("still", t, flush=True)
        return

    print("composing score…", flush=True)
    compose()
    scene = Scene()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    writer = imageio_ffmpeg.write_frames(
        OUT, (W, H), fps=FPS, codec="libx264", quality=None, pix_fmt_out="yuv420p",
        output_params=["-crf", "22", "-preset", "slow", "-movflags", "+faststart", "-b:a", "192k", "-shortest"],
        audio_path=TMP_WAV, audio_codec="aac", macro_block_size=16,
    )
    writer.send(None)
    for i in range(NF):
        writer.send(scene.render(i))
        if i % 48 == 0:
            print(f"frame {i}/{NF}", flush=True)
    writer.close()
    os.remove(TMP_WAV)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
