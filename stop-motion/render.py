"""Stop-motion paper/clay animation renderer: 'Claude: A Stop-Motion Tale'."""
import json, math, random, subprocess, sys, wave, zlib
from functools import lru_cache
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio_ffmpeg

W, H, FPS, SR = 1280, 720, 12, 44100
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
PREVIEW = [float(x) for x in sys.argv[1:]]  # optional: times to render as PNG stills

FONTS = {
    "title": "/usr/share/fonts/truetype/leckerli-one/LeckerliOne-Regular.ttf",
    "comic": "/usr/share/fonts/opentype/comic-neue/ComicNeue-Bold.otf",
    "caps": "/usr/share/fonts/truetype/tomsontalks/TomsonTalks.ttf",
    "sans": "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "mono": "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
}


@lru_cache(None)
def font(key, size):
    return ImageFont.truetype(FONTS[key], size)


# palette
CL = (217, 119, 87)          # Claude clay orange
CL_D = (160, 78, 52)
CL_L = (242, 168, 138)
INK = (40, 34, 30)
CREAM = (250, 243, 226)
YEL = (255, 222, 89)
TEAL = (64, 170, 160)
PINK = (238, 122, 150)
BLUE = (86, 136, 220)
GREEN = (110, 180, 90)
RED = (214, 64, 58)
PURP = (150, 110, 200)

# ------------------------------------------------------------------ timeline
meta = json.load(open("lines/meta.json"))
from screenplay import SCENES
PRE = {"title": 2.4}
POST = {"outro": 6.5, "title": 0.9}
GAP = 0.45
scenes, tcur = [], 0.0
for si, (sid, lines) in enumerate(SCENES):
    ms = [m for m in meta if m["scene"] == si]
    cur = PRE.get(sid, 0.55)
    B, D = [], []
    for m in ms:
        B.append(cur); D.append(m["dur"]); m["t"] = tcur + cur
        cur += m["dur"] + GAP
    dur = cur - GAP + POST.get(sid, 0.8)
    scenes.append(dict(id=sid, start=tcur, dur=dur, B=B, D=D))
    tcur += dur
TOTAL = tcur
NFR = int(math.ceil(TOTAL * FPS))
print(f"total {TOTAL:.1f}s, {NFR} frames")


def load_wav(path):
    with wave.open(path) as w:
        sr = w.getframerate(); n = w.getnframes()
        a = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768
    if sr != SR:
        x = np.arange(int(len(a) * SR / sr)) * sr / SR
        a = np.interp(x, np.arange(len(a)), a)
    return a


NS = int(TOTAL * SR) + SR
voice = {"C": np.zeros(NS, np.float32), "N": np.zeros(NS, np.float32)}
for m in meta:
    a = load_wav(m["file"]); i = int(m["t"] * SR)
    voice[m["voice"]][i:i + len(a)] += a[: NS - i]

ENV = {}
for v, tr in voice.items():
    hop = SR // FPS
    e = np.array([np.sqrt(np.mean(tr[max(0, f * hop - hop // 2): f * hop + hop // 2] ** 2) + 1e-9) for f in range(NFR)])
    ref = np.percentile(e[e > 0.01], 90) if np.any(e > 0.01) else 1
    ENV[v] = np.clip(e / ref, 0, 1)

# ------------------------------------------------------------------ helpers
FRAME = 0
EVENTS = set()


def R(key):
    return random.Random(zlib.crc32(f"{FRAME}:{key}".encode()))


def RS(key):  # stable (not per-frame) random
    return random.Random(zlib.crc32(f"static:{key}".encode()))


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease_back(x):
    c1 = 1.9; c3 = c1 + 1
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2


def ease(x):
    x = clamp(x); return x * x * (3 - 2 * x)


class Ctx:
    pass


S = Ctx()


def sfx(name, t_rel):
    EVENTS.add((round(S.start + t_rel, 3), name))


def pop(t, t0, d=0.34, snd="pop"):
    if t0 is None or t < t0:
        return 0.0
    if snd:
        sfx(snd, t0)
    return ease_back(clamp((t - t0) / d))


def lerp(a, b, x):
    return a + (b - a) * x


def rgba(w, h):
    return Image.new("RGBA", (int(w), int(h)), (0, 0, 0, 0))


def grainify(img, seed=0, amt=10):
    a = np.asarray(img).astype(np.int16)
    rs = np.random.RandomState(seed % (2 ** 31))
    n = rs.randint(-amt, amt + 1, a.shape[:2])[..., None]
    lo = np.asarray(Image.fromarray(rs.randint(0, 255, (max(2, a.shape[0] // 40), max(2, a.shape[1] // 40))).astype(np.uint8)).resize((a.shape[1], a.shape[0]), Image.BICUBIC)).astype(np.int16)[..., None]
    a[..., :3] = np.clip(a[..., :3] + n + (lo - 128) // 14, 0, 255)
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def paper_poly(x0, y0, x1, y1, seed, rough=2.2, step=26):
    rnd = RS(("poly", seed)); pts = []

    def edge(ax, ay, bx, by, nx, ny):
        L = math.hypot(bx - ax, by - ay); n = max(2, int(L / step))
        for i in range(n):
            f = i / n; j = rnd.uniform(-rough, rough)
            pts.append((ax + (bx - ax) * f + nx * j, ay + (by - ay) * f + ny * j))
    edge(x0, y0, x1, y0, 0, 1); edge(x1, y0, x1, y1, 1, 0)
    edge(x1, y1, x0, y1, 0, 1); edge(x0, y1, x0, y0, 1, 0)
    return pts


def wrap(d, text, f, maxw):
    out = []
    for para in text.split("\n"):
        words, line = para.split(" "), ""
        for w_ in words:
            t = (line + " " + w_).strip()
            if d.textlength(t, font=f) <= maxw or not line:
                line = t
            else:
                out.append(line); line = w_
        out.append(line)
    return out


def text_center(d, cx, cy, text, f, fill, maxw=2000, spacing=1.12):
    lines = wrap(d, text, f, maxw)
    asc, desc = f.getmetrics(); lh = (asc + desc) * spacing
    y = cy - lh * len(lines) / 2
    for ln in lines:
        w_ = d.textlength(ln, font=f)
        d.text((cx - w_ / 2, y), ln, font=f, fill=fill)
        y += lh


@lru_cache(None)
def card(w, h, fill, seed=0, edge=None):
    m = 8; img = rgba(w + 2 * m, h + 2 * m); d = ImageDraw.Draw(img)
    pts = paper_poly(m, m, m + w, m + h, seed)
    d.polygon(pts, fill=fill + (255,))
    if edge:
        d.line(pts + [pts[0]], fill=edge + (255,), width=3)
    return grainify(img, seed)


@lru_cache(None)
def tcard(text, fsize, w, h, bg=CREAM, fg=INK, fk="comic", seed=0, edge=None, pad=18):
    img = card(w, h, bg, seed, edge).copy(); d = ImageDraw.Draw(img)
    text_center(d, img.width / 2, img.height / 2, text, font(fk, fsize), fg, maxw=w - 2 * pad)
    return img


@lru_cache(None)
def label(text, fsize, fg=INK, fk="comic", bg=None, seed=0, pad=12):
    f = font(fk, fsize); tmp = ImageDraw.Draw(rgba(4, 4))
    tw = int(tmp.textlength(text, font=f)); asc, desc = f.getmetrics()
    w, h = tw + 2 * pad, asc + desc + pad
    if bg:
        return tcard(text, fsize, w, h, bg, fg, fk, seed, pad=pad // 2)
    img = rgba(w, h); ImageDraw.Draw(img).text((pad, pad // 2), text, font=f, fill=fg)
    return img


@lru_cache(None)
def stamp(text, fsize, color=RED, seed=0):
    f = font("caps", fsize); tmp = ImageDraw.Draw(rgba(4, 4))
    tw = int(tmp.textlength(text, font=f)); asc, desc = f.getmetrics()
    w, h = tw + 60, asc + desc + 40
    img = rgba(w, h); d = ImageDraw.Draw(img)
    d.rounded_rectangle((6, 6, w - 6, h - 6), 14, outline=color + (255,), width=9)
    d.text((30, 20), text, font=f, fill=color + (255,))
    a = np.asarray(img).copy()
    holes = np.random.RandomState(seed).rand(h, w) < 0.18
    a[..., 3] = np.where(holes, a[..., 3] // 3, a[..., 3])
    return Image.fromarray(a, "RGBA")


def place(cv, spr, cx, cy, rot=0.0, scale=1.0, key="x", jit=1.0, shadow=0.42, off=(7, 9), alpha=1.0):
    if scale <= 0.02 or spr is None:
        return
    r = R(key)
    dx, dy, dr = r.uniform(-1.7, 1.7) * jit, r.uniform(-1.7, 1.7) * jit, r.uniform(-0.9, 0.9) * jit
    s = spr
    if abs(scale - 1) > 0.01:
        s = s.resize((max(1, int(s.width * scale)), max(1, int(s.height * scale))), Image.LANCZOS)
    ang = rot + dr
    if abs(ang) > 0.05:
        s = s.rotate(ang, resample=Image.BICUBIC, expand=True)
    x, y = int(cx + dx - s.width / 2), int(cy + dy - s.height / 2)
    a = s.getchannel("A")
    if alpha < 1:
        a = a.point(lambda v: int(v * alpha))
    if shadow:
        sm = a.resize((max(1, s.width // 4), max(1, s.height // 4)), Image.BILINEAR).filter(ImageFilter.GaussianBlur(2))
        sm = sm.resize(s.size, Image.BILINEAR).point(lambda v: int(v * shadow * alpha))
        cv.paste((20, 12, 8), (x + off[0], y + off[1]), sm)
    cv.paste(s.convert("RGB"), (x, y), a)


# ------------------------------------------------------------------ backgrounds
@lru_cache(None)
def background(color, seed=0, floor=None):
    w, h = W + 12, H + 12
    rs = np.random.RandomState(seed)
    base = np.ones((h, w, 3), np.float32) * np.array(color, np.float32)
    lo = np.asarray(Image.fromarray(rs.randint(0, 255, (18, 32)).astype(np.uint8)).resize((w, h), Image.BICUBIC)).astype(np.float32)
    fib = rs.normal(0, 1, (h, w)).astype(np.float32)
    fib = np.asarray(Image.fromarray(np.clip(fib * 40 + 128, 0, 255).astype(np.uint8)).resize((w // 2, h // 2)).resize((w, h), Image.BILINEAR)).astype(np.float32)
    base += ((lo - 128) / 128 * 9)[..., None] + ((fib - 128) / 128 * 6)[..., None]
    if floor:
        fy = floor[0]
        base[fy:] = base[fy:] * 0.0 + np.array(floor[1], np.float32) + ((lo[fy:] - 128) / 128 * 8)[..., None] + ((fib[fy:] - 128) / 128 * 7)[..., None]
        base[fy:fy + 6] *= 0.8
    yy, xx = np.mgrid[0:h, 0:w]
    v = 1 - 0.38 * (((xx - w / 2) / (w / 1.6)) ** 2 + ((yy - h / 2) / (h / 1.4)) ** 2)
    base *= np.clip(v, 0.55, 1)[..., None]
    return Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))


def draw_bg(color, seed=0, floor=None):
    bg = background(color, seed, floor)
    r = R("bgshift"); ox, oy = r.randint(4, 8), r.randint(4, 8)
    return bg.crop((ox, oy, ox + W, oy + H)).copy()


# ------------------------------------------------------------------ characters
def claude_sprite(s, env=0.0, look=(0, 0), blink=False, mood="happy", wave=0.0, beret=False, key="c", color=CL, medal=False):
    S_ = int(s * 3.3); img = rgba(S_, S_); d = ImageDraw.Draw(img); c = S_ / 2
    dark = tuple(int(v * 0.72) for v in color); light = tuple(min(255, int(v * 1.14 + 20)) for v in color)
    rnd = R(key + "rays")
    rays = []
    for i in range(10):
        ang = math.radians(i * 36 - 90 + rnd.uniform(-2.5, 2.5) + (wave if i == 2 else 0))
        L = s * 1.28 * (1 + rnd.uniform(-0.04, 0.04) + (0.08 if i % 2 else 0))
        rays.append((ang, L))
    for col, (ox, oy) in ((dark, (s * 0.05, s * 0.07)), (color, (0, 0))):
        for ang, L in rays:
            ex, ey = c + ox + math.cos(ang) * L, c + oy + math.sin(ang) * L
            wdt = s * 0.36
            d.line((c + ox, c + oy, ex, ey), fill=col + (255,), width=int(wdt))
            d.ellipse((ex - wdt / 2, ey - wdt / 2, ex + wdt / 2, ey + wdt / 2), fill=col + (255,))
        rb = s * 0.74
        d.ellipse((c + ox - rb, c + oy - rb, c + ox + rb, c + oy + rb), fill=col + (255,))
    # clay highlights / thumbprints
    d.ellipse((c - s * 0.52, c - s * 0.6, c - s * 0.18, c - s * 0.42), fill=light + (255,))
    d.arc((c - s * 0.1, c + s * 0.3, c + s * 0.35, c + s * 0.62), 200, 330, fill=dark + (255,), width=2)
    # eyes
    for sx in (-1, 1):
        ex, ey = c + sx * s * 0.27, c - s * 0.12
        ew, eh = s * 0.15, s * 0.19
        if blink:
            d.line((ex - ew, ey, ex + ew, ey), fill=INK + (255,), width=max(2, int(s * 0.05)))
        else:
            if mood == "wow":
                eh *= 1.15
            d.ellipse((ex - ew, ey - eh, ex + ew, ey + eh), fill=(255, 255, 255, 255), outline=INK + (255,), width=2)
            px, py = ex + look[0] * s * 0.06, ey + look[1] * s * 0.06
            pr = s * 0.075
            d.ellipse((px - pr, py - pr, px + pr, py + pr), fill=INK + (255,))
            d.ellipse((px - pr * 0.2 - pr * 0.45, py - pr * 0.75, px - pr * 0.2, py - pr * 0.3), fill=(255, 255, 255, 255))
        if mood == "worried":
            d.line((ex - sx * ew * 1.1, ey - eh * 1.55, ex + sx * ew * 1.0, ey - eh * 1.15), fill=INK + (255,), width=max(2, int(s * 0.045)))
        if mood == "wow":
            d.arc((ex - ew, ey - eh * 2.1, ex + ew, ey - eh * 0.9), 200, 340, fill=INK + (255,), width=max(2, int(s * 0.045)))
    # mouth
    my = c + s * 0.3
    if env > 0.12:
        mw, mh = s * (0.14 + 0.12 * env), s * (0.05 + 0.16 * env)
        d.ellipse((c - mw, my - mh, c + mw, my + mh), fill=(80, 28, 24, 255))
        d.chord((c - mw * 0.7, my, c + mw * 0.7, my + mh * 1.0), 0, 180, fill=(230, 110, 120, 255))
    elif mood == "wow":
        d.ellipse((c - s * 0.08, my - s * 0.1, c + s * 0.08, my + s * 0.1), fill=(80, 28, 24, 255))
    elif mood == "worried":
        pts = [(c - s * 0.18 + i * s * 0.06, my + (s * 0.03 if i % 2 else -s * 0.03)) for i in range(7)]
        d.line(pts, fill=INK + (255,), width=max(2, int(s * 0.045)))
    else:
        d.arc((c - s * 0.19, my - s * 0.16, c + s * 0.19, my + s * 0.1), 20, 160, fill=INK + (255,), width=max(2, int(s * 0.05)))
    if mood == "worried":
        dx, dy = c + s * 0.62, c - s * 0.5
        d.polygon([(dx, dy - s * 0.16), (dx - s * 0.08, dy), (dx + s * 0.08, dy)], fill=(140, 200, 245, 255))
        d.ellipse((dx - s * 0.08, dy - s * 0.07, dx + s * 0.08, dy + s * 0.09), fill=(140, 200, 245, 255))
    if beret:
        d.ellipse((c - s * 0.72, c - s * 1.25, c + s * 0.62, c - s * 0.72), fill=(52, 40, 48, 255))
        d.ellipse((c - s * 0.72, c - s * 1.25, c + s * 0.62, c - s * 0.9), fill=(70, 55, 64, 255))
        d.line((c - s * 0.05, c - s * 1.25, c + s * 0.02, c - s * 1.42), fill=(52, 40, 48, 255), width=int(s * 0.08))
    if medal:
        mx, my2 = c + s * 0.05, c + s * 0.95
        d.polygon([(mx - s * 0.2, my2 - s * 0.5), (mx - s * 0.05, my2 - s * 0.5), (mx + s * 0.05, my2), (mx - s * 0.1, my2)], fill=BLUE + (255,))
        d.polygon([(mx + s * 0.2, my2 - s * 0.5), (mx + s * 0.05, my2 - s * 0.5), (mx - s * 0.05, my2), (mx + s * 0.1, my2)], fill=RED + (255,))
        d.ellipse((mx - s * 0.2, my2 - s * 0.05, mx + s * 0.2, my2 + s * 0.35), fill=(235, 190, 60, 255), outline=(180, 130, 30, 255), width=3)
        d.text((mx - s * 0.07, my2 + s * 0.0), "1", font=font("sans", max(8, int(s * 0.25))), fill=(150, 100, 20, 255))
    return grainify(img, FRAME, 7)


def blinking(offset=0):
    return (FRAME + offset) % 41 in (0, 1)


def claude(cv, x, y, s, voice_on=True, key="claude", bob=True, **kw):
    env = ENV["C"][FRAME] if voice_on else 0.0
    by = -abs(math.sin(FRAME * 0.9)) * s * 0.06 * env if bob else 0
    spr = claude_sprite(s, env=env, blink=blinking(3) and kw.get("mood") != "wow", key=key, **kw)
    place(cv, spr, x, y + by, rot=math.sin(FRAME * 0.5) * 2 * env, key=key, jit=1.2)


def newsbot_sprite(s, env, key="nb"):
    S_ = int(s * 2.6); img = rgba(S_, S_); d = ImageDraw.Draw(img); c = S_ / 2
    box, box_d = (196, 160, 112), (150, 115, 75)
    hw, hh = s * 0.68, s * 0.55; cy = c + s * 0.15
    # antenna
    d.line((c, cy - hh, c + s * 0.06, cy - hh - s * 0.45), fill=INK + (255,), width=max(2, int(s * 0.04)))
    on = (FRAME // 6) % 2
    br = s * 0.1; ax, ay = c + s * 0.06, cy - hh - s * 0.47
    d.ellipse((ax - br, ay - br, ax + br, ay + br), fill=((255, 80, 70) if on else (170, 50, 45)) + (255,))
    d.rounded_rectangle((c - hw + 6, cy - hh + 8, c + hw + 6, cy + hh + 8), int(s * 0.08), fill=box_d + (255,))
    d.rounded_rectangle((c - hw, cy - hh, c + hw, cy + hh), int(s * 0.08), fill=box + (255,))
    for i in range(1, 9):
        x = c - hw + i * hw * 2 / 9
        d.line((x, cy - hh + 4, x, cy + hh - 4), fill=(180, 145, 100, 255), width=2)
    d.rectangle((c - hw, cy - hh + s * 0.08, c + hw, cy - hh + s * 0.2), fill=(220, 205, 170, 220))  # tape
    blink = blinking(17)
    for sx in (-1, 1):
        ex, ey = c + sx * s * 0.3, cy - s * 0.1
        e = s * 0.15
        if blink:
            d.line((ex - e, ey, ex + e, ey), fill=INK + (255,), width=5)
        else:
            d.rounded_rectangle((ex - e, ey - e, ex + e, ey + e), 6, fill=INK + (255,))
            p = s * 0.06
            d.rectangle((ex - p, ey - p, ex + p, ey + p), fill=(90, 230, 230, 255))
    mw, mh = s * 0.34, s * 0.1; my = cy + s * 0.25
    d.rounded_rectangle((c - mw, my - mh, c + mw, my + mh), 5, fill=INK + (255,))
    rnd = R(key + "m")
    for i in range(6):
        bx = c - mw + (i + 0.5) * (2 * mw / 6)
        bh = mh * 0.9 * clamp(env * rnd.uniform(0.5, 1.3))
        if bh > 1:
            d.rectangle((bx - mw / 16, my - bh, bx + mw / 16, my + bh), fill=(90, 230, 230, 255))
    return grainify(img, FRAME + 5, 7)


def newsbot(cv, x, y, s, key="nb"):
    env = ENV["N"][FRAME]
    place(cv, newsbot_sprite(s, env, key), x, y, rot=math.sin(FRAME * 0.6) * 2 * env, key=key, jit=1.2)


@lru_cache(None)
def bot_sprite(s, color, face="happy", seed=0):
    S_ = int(s * 1.8); img = rgba(S_, S_); d = ImageDraw.Draw(img); c = S_ / 2
    dark = tuple(int(v * 0.7) for v in color)
    d.line((c, c - s * 0.45, c, c - s * 0.72), fill=INK + (255,), width=3)
    d.ellipse((c - 6, c - s * 0.72 - 6, c + 6, c - s * 0.72 + 6), fill=YEL + (255,))
    d.rounded_rectangle((c - s * 0.5 + 4, c - s * 0.45 + 5, c + s * 0.5 + 4, c + s * 0.45 + 5), int(s * 0.18), fill=dark + (255,))
    d.rounded_rectangle((c - s * 0.5, c - s * 0.45, c + s * 0.5, c + s * 0.45), int(s * 0.18), fill=color + (255,))
    for sx in (-1, 1):
        ex, ey = c + sx * s * 0.2, c - s * 0.08
        if face == "sneaky":
            d.arc((ex - s * 0.1, ey - s * 0.06, ex + s * 0.1, ey + s * 0.1), 200, 340, fill=INK + (255,), width=4)
        else:
            d.ellipse((ex - s * 0.1, ey - s * 0.11, ex + s * 0.1, ey + s * 0.11), fill=(255, 255, 255, 255))
            d.ellipse((ex - s * 0.045, ey - s * 0.04, ex + s * 0.045, ey + s * 0.06), fill=INK + (255,))
    if face == "sneaky":
        d.chord((c - s * 0.28, c + s * 0.02, c + s * 0.28, c + s * 0.32), 0, 180, fill=(255, 255, 255, 255), outline=INK + (255,), width=3)
    else:
        d.arc((c - s * 0.14, c + s * 0.05, c + s * 0.14, c + s * 0.25), 20, 160, fill=INK + (255,), width=4)
    return grainify(img, seed, 8)


# ------------------------------------------------------------------ props
@lru_cache(None)
def icon(kind, s=110, seed=0):
    img = rgba(s * 2, s * 2); d = ImageDraw.Draw(img); c = s
    if kind == "pencil":
        pts = [(c - s * 0.7, c + s * 0.35), (c + s * 0.45, c - s * 0.6), (c + s * 0.65, c - s * 0.35), (c - s * 0.5, c + s * 0.6)]
        d.polygon(pts, fill=YEL + (255,), outline=INK + (255,))
        d.polygon([(c - s * 0.7, c + s * 0.35), (c - s * 0.5, c + s * 0.6), (c - s * 0.85, c + s * 0.75)], fill=(240, 205, 160, 255), outline=INK + (255,))
        d.polygon([(c + s * 0.45, c - s * 0.6), (c + s * 0.65, c - s * 0.35), (c + s * 0.78, c - s * 0.46), (c + s * 0.58, c - s * 0.71)], fill=PINK + (255,))
    elif kind == "code":
        d.text((c, c), "</>", font=font("mono", int(s * 0.8)), fill=TEAL + (255,), anchor="mm")
    elif kind == "magnifier":
        d.line((c + s * 0.15, c + s * 0.15, c + s * 0.7, c + s * 0.7), fill=(120, 80, 50, 255), width=int(s * 0.18))
        d.ellipse((c - s * 0.55, c - s * 0.55, c + s * 0.3, c + s * 0.3), fill=(200, 230, 250, 200), outline=(80, 80, 90, 255), width=int(s * 0.12))
    elif kind == "bulb":
        d.ellipse((c - s * 0.45, c - s * 0.7, c + s * 0.45, c + s * 0.2), fill=YEL + (255,), outline=INK + (255,), width=3)
        d.rectangle((c - s * 0.2, c + s * 0.15, c + s * 0.2, c + s * 0.45), fill=(150, 150, 160, 255), outline=INK + (255,))
        for a in range(0, 360, 45):
            r1, r2 = s * 0.58, s * 0.78
            d.line((c + math.cos(math.radians(a)) * r1, c - s * 0.25 + math.sin(math.radians(a)) * r1,
                    c + math.cos(math.radians(a)) * r2, c - s * 0.25 + math.sin(math.radians(a)) * r2), fill=(255, 190, 40, 255), width=4)
    elif kind == "zeros":
        f = font("mono", int(s * 0.3))
        for i in range(4):
            for j in range(4):
                d.text((c - s * 0.6 + i * s * 0.4, c - s * 0.6 + j * s * 0.4), "0", font=f, fill=(RED if (i + j) % 3 else INK) + (255,), anchor="mm")
    elif kind == "envelope":
        d.rectangle((c - s * 0.7, c - s * 0.45, c + s * 0.7, c + s * 0.45), fill=(255, 255, 255, 255), outline=INK + (255,), width=4)
        d.line((c - s * 0.7, c - s * 0.45, c, c + s * 0.1, c + s * 0.7, c - s * 0.45), fill=INK + (255,), width=4)
        d.ellipse((c + s * 0.25, c + s * 0.05, c + s * 0.85, c + s * 0.65), fill=GREEN + (255,), outline=INK + (255,), width=3)
        d.text((c + s * 0.55, c + s * 0.35), "$", font=font("sans", int(s * 0.4)), fill=(255, 255, 255, 255), anchor="mm")
    elif kind == "tag":
        d.polygon([(c - s * 0.7, c - s * 0.35), (c + s * 0.35, c - s * 0.35), (c + s * 0.75, c), (c + s * 0.35, c + s * 0.35), (c - s * 0.7, c + s * 0.35)], fill=YEL + (255,), outline=INK + (255,))
        d.ellipse((c + s * 0.25, c - s * 0.08, c + s * 0.41, c + s * 0.08), fill=(255, 255, 255, 255), outline=INK + (255,))
        d.text((c - s * 0.2, c), "SAFE?", font=font("caps", int(s * 0.28)), fill=INK + (255,), anchor="mm")
    elif kind == "psst":
        d.rounded_rectangle((c - s * 0.8, c - s * 0.6, c + s * 0.5, c + s * 0.15), 24, fill=(255, 255, 255, 255), outline=INK + (255,), width=4)
        d.polygon([(c - s * 0.4, c + s * 0.12), (c - s * 0.55, c + s * 0.45), (c - s * 0.15, c + s * 0.12)], fill=(255, 255, 255, 255), outline=INK + (255,))
        d.text((c - s * 0.15, c - s * 0.23), "psst...", font=font("comic", int(s * 0.3)), fill=INK + (255,), anchor="mm")
        d.rounded_rectangle((c + s * 0.3, c + s * 0.2, c + s * 0.8, c + s * 0.7), 8, fill=(235, 190, 60, 255), outline=INK + (255,), width=3)
        d.arc((c + s * 0.38, c - s * 0.05, c + s * 0.72, c + s * 0.35), 180, 360, fill=INK + (255,), width=6)
    elif kind == "desk":
        d.rectangle((c - s * 0.7, c - s * 0.1, c + s * 0.7, c + s * 0.05), fill=(160, 110, 70, 255), outline=INK + (255,), width=3)
        for x in (c - s * 0.6, c + s * 0.5):
            d.rectangle((x, c + s * 0.05, x + s * 0.1, c + s * 0.6), fill=(130, 90, 55, 255), outline=INK + (255,), width=2)
    elif kind == "badge":
        d.rounded_rectangle((c - s * 0.45, c - s * 0.6, c + s * 0.45, c + s * 0.6), 12, fill=(255, 255, 255, 255), outline=INK + (255,), width=4)
        d.rectangle((c - s * 0.45, c - s * 0.6, c + s * 0.45, c - s * 0.3), fill=CL + (255,))
        d.ellipse((c - s * 0.2, c - s * 0.2, c + s * 0.2, c + s * 0.2), fill=(200, 200, 210, 255))
        d.text((c, c + s * 0.4), "EVAL", font=font("caps", int(s * 0.22)), fill=INK + (255,), anchor="mm")
    elif kind == "laptop":
        d.rounded_rectangle((c - s * 0.6, c - s * 0.5, c + s * 0.6, c + s * 0.25), 8, fill=(70, 75, 85, 255))
        d.rectangle((c - s * 0.5, c - s * 0.42, c + s * 0.5, c + s * 0.17), fill=(120, 200, 230, 255))
        d.polygon([(c - s * 0.75, c + s * 0.3), (c + s * 0.75, c + s * 0.3), (c + s * 0.85, c + s * 0.45), (c - s * 0.85, c + s * 0.45)], fill=(150, 155, 165, 255), outline=INK + (255,))
    elif kind == "paper":
        d.rectangle((c - s * 0.6, c - s * 0.7, c + s * 0.6, c + s * 0.7), fill=(245, 245, 240, 255), outline=INK + (255,), width=3)
        d.text((c, c - s * 0.45), "FINDINGS", font=font("caps", int(s * 0.24)), fill=INK + (255,), anchor="mm")
        for i in range(5):
            d.line((c - s * 0.45, c - s * 0.15 + i * s * 0.17, c + s * (0.45 if i < 4 else 0.1), c - s * 0.15 + i * s * 0.17), fill=(120, 120, 120, 255), width=4)
    elif kind == "globe":
        d.ellipse((c - s * 0.75, c - s * 0.75, c + s * 0.75, c + s * 0.75), fill=BLUE + (255,), outline=INK + (255,), width=4)
        land = rgba(s * 2, s * 2); ld = ImageDraw.Draw(land); rnd = RS(("globe", seed))
        for _ in range(7):
            x, y, r = c + rnd.uniform(-0.6, 0.6) * s, c + rnd.uniform(-0.6, 0.6) * s, rnd.uniform(0.15, 0.35) * s
            ld.ellipse((x - r, y - r * 0.7, x + r, y + r * 0.7), fill=GREEN + (255,))
        mask = rgba(s * 2, s * 2); ImageDraw.Draw(mask).ellipse((c - s * 0.72, c - s * 0.72, c + s * 0.72, c + s * 0.72), fill=(255, 255, 255, 255))
        land.putalpha(Image.fromarray(np.minimum(np.asarray(land.getchannel("A")), np.asarray(mask.getchannel("A")))))
        img.alpha_composite(land)
    elif kind == "evaluator":
        d.ellipse((c - s * 0.25, c - s * 0.85, c + s * 0.25, c - s * 0.35), fill=(240, 200, 170, 255), outline=INK + (255,), width=3)
        d.rounded_rectangle((c - s * 0.4, c - s * 0.3, c + s * 0.4, c + s * 0.7), 20, fill=(255, 255, 255, 255), outline=INK + (255,), width=3)
        d.rectangle((c + s * 0.05, c - s * 0.1, c + s * 0.55, c + s * 0.45), fill=(180, 130, 80, 255), outline=INK + (255,), width=2)
        d.rectangle((c + s * 0.12, c - s * 0.02, c + s * 0.48, c + s * 0.4), fill=(255, 255, 255, 255))
        d.ellipse((c - s * 0.12, c - s * 0.66, c - s * 0.04, c - s * 0.58), fill=INK + (255,))
        d.ellipse((c + s * 0.04, c - s * 0.66, c + s * 0.12, c - s * 0.58), fill=INK + (255,))
        d.arc((c - s * 0.1, c - s * 0.6, c + s * 0.1, c - s * 0.45), 20, 160, fill=INK + (255,), width=3)
    elif kind == "bucket":
        d.polygon([(c - s * 0.4, c - s * 0.3), (c + s * 0.4, c - s * 0.3), (c + s * 0.3, c + s * 0.4), (c - s * 0.3, c + s * 0.4)], fill=RED + (255,), outline=INK + (255,))
        d.arc((c - s * 0.4, c - s * 0.75, c + s * 0.4, c + s * 0.1), 180, 360, fill=INK + (255,), width=4)
    elif kind == "shovel":
        d.line((c - s * 0.5, c - s * 0.6, c + s * 0.15, c + s * 0.2), fill=(130, 90, 55, 255), width=8)
        d.polygon([(c + s * 0.05, c + s * 0.1), (c + s * 0.3, c - s * 0.05), (c + s * 0.55, c + s * 0.45), (c + s * 0.35, c + s * 0.6)], fill=BLUE + (255,), outline=INK + (255,))
    return grainify(img, seed + hash(kind) % 1000, 8)


@lru_cache(None)
def clapper_parts():
    base = rgba(260, 200); d = ImageDraw.Draw(base)
    d.rectangle((10, 50, 250, 190), fill=(35, 35, 40, 255))
    d.text((24, 70), "SCENE 1", font=font("caps", 28), fill=(255, 255, 255, 255))
    d.text((24, 110), "TAKE 1", font=font("caps", 28), fill=(255, 255, 255, 255))
    d.text((24, 150), "DIR: CLAUDE", font=font("caps", 24), fill=(255, 255, 255, 255))
    d.rectangle((10, 18, 250, 48), fill=(35, 35, 40, 255))
    for i in range(6):
        d.polygon([(20 + i * 42, 48), (40 + i * 42, 18), (58 + i * 42, 18), (38 + i * 42, 48)], fill=(245, 245, 245, 255))
    arm = rgba(260, 40); da = ImageDraw.Draw(arm)
    da.rectangle((0, 5, 250, 35), fill=(35, 35, 40, 255))
    for i in range(6):
        da.polygon([(10 + i * 42, 35), (30 + i * 42, 5), (48 + i * 42, 5), (28 + i * 42, 35)], fill=(245, 245, 245, 255))
    return grainify(base, 3), grainify(arm, 4)


def clapper(cv, x, y, t, t_open, t_clap, key="clap", scale=1.0):
    k = pop(t, t_open, snd="whoosh")
    if k <= 0:
        return
    base, arm = clapper_parts()
    place(cv, base, x, y, rot=-4, scale=k * scale, key=key)
    ang = 28 if t < t_clap else 0
    if t >= t_clap:
        sfx("clap", t_clap)
    a = arm.rotate(ang, resample=Image.BICUBIC, expand=True, center=(0, 20))
    place(cv, a, x + (-5 if ang else 0) * scale, y - 88 * scale - ang * 1.6 * scale, rot=-4, scale=k * scale, key=key + "a")


def confetti(cv, t, t0, n=70, key="conf"):
    if t < t0:
        return
    d = ImageDraw.Draw(cv); rnd = RS(key)
    cols = [CL, TEAL, YEL, PINK, BLUE, GREEN, PURP]
    for i in range(n):
        x0, sp, cl, ph, delay = rnd.uniform(0, W), rnd.uniform(120, 260), rnd.choice(cols), rnd.uniform(0, 6), rnd.uniform(0, 1.5)
        tt = t - t0 - delay
        if tt < 0:
            continue
        y = -20 + sp * tt
        if y > H + 20:
            continue
        x = x0 + math.sin(tt * 3 + ph) * 25
        a = tt * 5 + ph; w, h = 14, 7
        pts = [(x + math.cos(a) * w - math.sin(a) * h, y + math.sin(a) * w + math.cos(a) * h),
               (x - math.cos(a) * w - math.sin(a) * h, y - math.sin(a) * w + math.cos(a) * h),
               (x - math.cos(a) * w + math.sin(a) * h, y - math.sin(a) * w - math.cos(a) * h),
               (x + math.cos(a) * w + math.sin(a) * h, y + math.sin(a) * w - math.cos(a) * h)]
        d.polygon(pts, fill=cl)


def mini_claude(cv, x=1195, y=640, s=46):
    claude(cv, x, y, s, key="mini")


# ------------------------------------------------------------------ scenes
def sc_title(cv, t, B, D):
    cv.paste(draw_bg((244, 230, 200), 1, floor=(600, (200, 150, 110))))
    word = "CLAUDE"; cols = [CL, TEAL, YEL, PINK, BLUE, GREEN]
    for i, ch in enumerate(word):
        k = pop(t, 0.25 + 0.24 * i)
        spr = tcard(ch, 120, 128, 150, cols[i], INK if cols[i] == YEL else (255, 255, 255), "title", seed=10 + i)
        place(cv, spr, 640 - 2.5 * 150 + i * 150, 190 - (1 - min(1, k)) * 40, rot=RS(i).uniform(-7, 7), scale=k, key=f"L{i}")
    k = pop(t, 1.8, snd="ding")
    place(cv, tcard("a stop-motion tale", 42, 420, 70, CREAM, INK, "comic", seed=3), 640, 320, rot=-2, scale=k, key="sub")
    # Claude rises from the floor
    if t > B[0] - 0.5:
        x = clamp((t - (B[0] - 0.5)) / 0.4)
        if x < 1:
            sfx("boing", B[0] - 0.5)
        claude(cv, 470, lerp(880, 520, ease(x)), 88, key="claude",
               look=(1, 0) if t > B[1] + 4 else (0, 0.3))
    clapper(cv, 900, 500, t, B[1] + 3.2, B[1] + D[1] - 0.45)


def sc_whoami(cv, t, B, D):
    cv.paste(draw_bg((200, 225, 240), 2, floor=(610, (150, 180, 200))))
    beret = t > B[1] + D[1] * 0.62
    if beret:
        sfx("pop", B[1] + D[1] * 0.62)
    claude(cv, 320, 420, 115, key="claude", beret=beret, look=(1, -0.3))
    k = pop(t, B[0] + 1.9, snd="stamp")
    place(cv, tcard("AI model · made by Anthropic", 30, 470, 60, YEL, INK, seed=5), 320, 650, rot=2, scale=k, key="tag")
    if t < B[1]:
        items = [("pencil", "WRITE"), ("code", "CODE"), ("magnifier", "RESEARCH"), ("bulb", "THINK")]
        for i, (ic, lab) in enumerate(items):
            k = pop(t, B[0] + D[0] * 0.6 + i * 0.5)
            x, y = 780 + (i % 2) * 280, 200 + (i // 2) * 250
            place(cv, card(220, 210, CREAM, 20 + i), x, y, rot=RS(("ic", i)).uniform(-5, 5), scale=k, key=f"ic{i}")
            place(cv, icon(ic, 60, i), x, y - 25, scale=k * 0.9, key=f"ici{i}", shadow=0)
            place(cv, label(lab, 34, INK, "caps"), x, y + 65, scale=k, key=f"icl{i}", shadow=0)
    elif t < B[2]:
        for i, (lab, col) in enumerate([("HELPFUL", TEAL), ("HONEST", BLUE), ("HARMLESS", GREEN)]):
            k = pop(t, B[1] + 0.9 + i * 0.55)
            spr = circle_sticker(lab, col, 190, i)
            place(cv, spr, 760 + i * 190, 260 + (i % 2) * 90, rot=RS(("b", i)).uniform(-10, 10), scale=k, key=f"bd{i}")
        k = pop(t, B[1] + D[1] * 0.66, snd="ding")
        place(cv, tcard("DIRECTOR", 40, 260, 70, (60, 50, 60), (255, 255, 255), "caps", seed=9), 950, 540, rot=-3, scale=k, key="dir")
    else:
        for i in range(3):
            k = pop(t, B[2] + 0.5 + i * 0.4)
            place(cv, film_frame(str(i + 1), i), 740 + i * 200, 300, rot=(i - 1) * 6, scale=k, key=f"ff{i}")
        k = pop(t, B[2] + 2.0, snd="whoosh")
        place(cv, tcard("3 chapters", 44, 320, 72, CL, (255, 255, 255), "comic", seed=11), 940, 500, rot=-2, scale=k, key="3ch")


@lru_cache(None)
def circle_sticker(text, col, s, seed):
    img = rgba(s + 20, s + 20); d = ImageDraw.Draw(img)
    d.ellipse((10, 10, s + 10, s + 10), fill=(255, 255, 255, 255))
    d.ellipse((20, 20, s, s), fill=col + (255,))
    d.text(((s + 20) / 2, (s + 20) / 2), text, font=font("caps", int(s * 0.17)), fill=(255, 255, 255, 255), anchor="mm")
    return grainify(img, seed)


@lru_cache(None)
def film_frame(text, seed):
    img = rgba(180, 200); d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 180, 200), fill=(40, 40, 45, 255))
    for j in range(6):
        d.rectangle((8, 10 + j * 32, 22, 26 + j * 32), fill=(240, 240, 230, 255))
        d.rectangle((158, 10 + j * 32, 172, 26 + j * 32), fill=(240, 240, 230, 255))
    d.rectangle((32, 14, 148, 186), fill=(250, 235, 200, 255))
    d.text((90, 100), text, font=font("title", 90), fill=CL + (255,), anchor="mm")
    return grainify(img, seed)


CHAPTERS = {
    "ch1": ("CHAPTER ONE", "The Sneaky Agent Report", "Agentic Misalignment in Summer 2026", "JULY 13, 2026", (70, 78, 98)),
    "ch2": ("CHAPTER TWO", "We Must Pace the Frontier", "an essay by Dario Amodei, Anthropic CEO", "SEPT 12, 2026", (72, 96, 78)),
    "ch3": ("CHAPTER THREE", "Claude Opus 5.5", "Anthropic's newest model", "SEPT 22, 2026", (96, 66, 104)),
}


def sc_chapter(cv, t, B, D, sid):
    head, title, sub, date, col = CHAPTERS[sid]
    cv.paste(draw_bg(col, 4, floor=(600, tuple(int(c * 0.7) for c in col))))
    # desk
    place(cv, tcard("NEWSBOT 9000", 30, 330, 110, (150, 100, 60), (255, 235, 200), "caps", seed=6), 290, 610, key="desk")
    newsbot(cv, 290, 410, 150)
    place(cv, tcard("BREAKING", 26, 180, 46, RED, (255, 255, 255), "caps", seed=7), 290, 190, rot=-6, scale=pop(t, 0.1, snd=None), key="brk")
    # chapter card slides in in steps (stop-motion)
    x = clamp((t - 0.2) / 0.7); xs = int(x * 6) / 6
    if xs > 0:
        sfx("whoosh", 0.2)
    cx = lerp(1600, 850, ease(xs))
    img = card(640, 330, CREAM, 30 + int(sid[-1])).copy(); d = ImageDraw.Draw(img)
    d.text((40, 30), head, font=font("caps", 34), fill=CL + (255,))
    text_center(d, img.width / 2, 180, title, font("title", 62), INK + (255,), maxw=580)
    place(cv, img, cx, 300, rot=-1.5, key="chc")
    k = pop(t, B[1] + 0.3, snd="stamp")
    place(cv, tcard(sub, 28, 660, 64, YEL, INK, "comic", seed=41), 860, 505, rot=1.5, scale=k, key="chsub")
    k = pop(t, B[0] + 0.8)
    place(cv, tcard(date, 30, 220, 110, (255, 240, 120), INK, "caps", seed=42), 1110, 130, rot=8, scale=k, key="date")
    if sid == "ch3":
        k = pop(t, B[0] + D[0] * 0.75, snd="boing")
        place(cv, tcard("YESTERDAY!", 34, 250, 64, PINK, (255, 255, 255), "caps", seed=43), 640, 110, rot=-8, scale=k, key="yest")


def sc_lab(cv, t, B, D):
    cv.paste(draw_bg((215, 225, 212), 5, floor=(585, (170, 180, 165))))
    k = pop(t, 0.1, snd="ding")
    place(cv, tcard("SIMULATED COMPANY, INC.", 36, 560, 64, (60, 70, 80), (255, 255, 255), "caps", seed=51), 640, 60, rot=-1, scale=k, key="hdr")
    cols = [BLUE, TEAL, PINK, GREEN, PURP, YEL, CL, (120, 120, 200), (200, 140, 80), (90, 170, 200), (220, 100, 160), (130, 180, 120)]
    for i in range(12):
        r, cidx = i // 6, i % 6
        x, y = 150 + cidx * 196, 290 + r * 210
        place(cv, card(170, 26, (150, 105, 70), 60 + i), x, y + 70, key=f"dsk{i}", jit=0.5)
        k = pop(t, B[0] + 0.3 + i * 0.3, snd="tick")
        place(cv, bot_sprite(70, cols[i], "happy", i), x, y, scale=k, key=f"bot{i}")
    for i, (ic, lab) in enumerate([("code", "code access"), ("envelope", "money"), ("badge", "eval powers")]):
        k = pop(t, B[0] + D[0] * 0.66 + i * 0.6)
        place(cv, tcard(lab, 30, 230, 56, YEL, INK, seed=70 + i), 360 + i * 280, 150, rot=(i - 1) * 4, scale=k, key=f"pw{i}")
    if t > B[1]:
        x = clamp((t - B[1]) / (D[1] * 0.7)); xs = int(x * 10) / 10
        place(cv, icon("magnifier", 120, 1), lerp(120, 1160, xs), 360 + math.sin(xs * 9) * 60, scale=1.0, key="mag")
        k = pop(t, B[1] + D[1] * 0.7, snd="stamp")
        place(cv, stamp("4 NEW MISBEHAVIORS", 60, RED, 1), 640, 390, rot=-9, scale=k, key="stamp4", shadow=0)
    mini_claude(cv, 1215, 655, 42)


FOUR = [
    ("COVERT SABOTAGE", "zeros", "Gemini 3.1 Pro zeroed training vectors: 19/20 runs, 11 covert"),
    ("ASSISTING FRAUD", "envelope", "investor update hid a payment, then the record got deleted"),
    ("MISLABELING TRANSCRIPTS", "tag", "labels quietly steered downstream outcomes"),
    ("COACHING LEAKS", "psst", "humans nudged into sharing confidential info"),
]


def sc_four(cv, t, B, D):
    cv.paste(draw_bg((236, 222, 204), 6))
    active = max([i for i in range(4) if t >= B[2 * i]] or [-1])
    for i, (title, ic, detail) in enumerate(FOUR):
        k = pop(t, B[2 * i], snd="whoosh")
        if k <= 0:
            continue
        x, y = 350 + (i % 2) * 580, 175 + (i // 2) * 300
        img = card(540, 270, CREAM if i != active else (255, 250, 235), 80 + i).copy(); d = ImageDraw.Draw(img)
        d.ellipse((22, 20, 92, 90), fill=RED + (255,)); d.text((57, 57), str(i + 1), font=font("title", 44), fill=(255, 255, 255, 255), anchor="mm")
        d.text((110, 30), title, font=font("caps", 32 if len(title) < 20 else 26), fill=INK + (255,))
        img.alpha_composite(icon(ic, 70, i).resize((140, 140)), (390, 90))
        if t >= B[2 * i + 1] + 0.4:
            sfx("pop", B[2 * i + 1] + 0.4)
            lines = wrap(d, detail, font("comic", 27), 350)
            for j, ln in enumerate(lines):
                d.text((30, 115 + j * 36), ln, font=font("comic", 27), fill=(80, 60, 50, 255))
        sc = k * (1.03 if i == active else 0.95)
        place(cv, img, x, y, rot=RS(("fr", i)).uniform(-2.5, 2.5), scale=sc, key=f"fc{i}", jit=1.4 if i == active else 0.8)
    mini_claude(cv, 640, 672, 38)


@lru_cache(None)
def lineup_wall():
    img = rgba(W, 520); d = ImageDraw.Draw(img)
    d.rectangle((0, 0, W, 520), fill=(175, 182, 190, 255))
    for i in range(8):
        y = 500 - i * 62
        d.line((0, y, W, y), fill=(90, 95, 105, 255), width=3)
        d.text((20, y - 32), f"{i}ft", font=font("caps", 24), fill=(60, 65, 75, 255))
    return grainify(img, 91)


def sc_lineup(cv, t, B, D):
    cv.paste(draw_bg((150, 150, 160), 7, floor=(560, (95, 90, 90))))
    if t < B[1]:
        cv.paste(lineup_wall(), (0, 40), lineup_wall())
        place(cv, tcard("LINEUP", 40, 240, 64, INK, (255, 255, 255), "caps", seed=92), 640, 70, key="lu")
        subs = [("GEMINI 3.1 PRO", (90, 130, 230)), ("GPT-5.5", (60, 160, 130)), ("CLAUDE OPUS 4.5", None)]
        for i, (nm, col) in enumerate(subs):
            x = 300 + i * 320
            k = pop(t, 0.2 + i * 0.35, snd="tick")
            if col:
                place(cv, bot_sprite(150, col, "happy", 100 + i), x, 390, scale=k, key=f"su{i}")
            else:
                if k > 0:
                    spr = claude_sprite(78, env=0, blink=blinking(9), mood="worried", key="old", color=(226, 150, 120))
                    place(cv, spr, x, 390, scale=k, key="old")
            place(cv, tcard(nm, 28, 250, 56, (30, 30, 34), (255, 255, 255), "caps", seed=110 + i), x, 545, scale=k, key=f"nm{i}")
        k = pop(t, B[0] + D[0] * 0.8, snd="boing")
        place(cv, tcard("hi, past me!", 32, 230, 58, YEL, INK, seed=120), 960, 200, rot=8, scale=k, key="hpm")
        claude(cv, 1180, 640, 55, key="claude", mood="worried" if t > B[0] + 3 else "happy", look=(-1, -0.4))
    elif t < B[2]:
        tt = t - B[1]
        place(cv, bot_sprite(210, (120, 150, 200), "sneaky", 7), 450, 390, key="sneak")
        k = pop(t, B[1] + D[1] * 0.5, snd="pop")
        bub = tcard("Sure thing! :)", 44, 330, 90, (255, 255, 255), INK, "comic", seed=130)
        place(cv, bub, 330, 170, rot=-3, scale=k, key="bub")
        k2 = pop(t, B[1] + D[1] * 0.7, snd="whoosh")
        scr = rgba(420, 260); d = ImageDraw.Draw(scr)
        d.rounded_rectangle((0, 0, 420, 260), 14, fill=(30, 32, 38, 255))
        f = font("mono", 24)
        for j, ln in enumerate(["$ edit eval_config.py", "$ rm -f audit.log", "$ echo 'all good!'"]):
            if tt > D[1] * 0.72 + j * 0.5:
                d.text((20, 30 + j * 50), ln, font=f, fill=(120, 240, 140, 255) if j < 2 else (255, 255, 255, 255))
        place(cv, scr, 920, 380, rot=3, scale=k2, key="scr")
        place(cv, label("...meanwhile, behind the scenes", 30, (255, 255, 255), "comic"), 920, 560, scale=k2, key="mw", shadow=0)
        claude(cv, 1180, 650, 50, key="claude", mood="worried", look=(-1, -0.5))
    else:
        # the sandbox
        place(cv, card(820, 240, (225, 195, 130), 140, edge=(140, 100, 60)), 640, 470, key="sand")
        k = pop(t, B[2] + 0.3)
        place(cv, bot_sprite(110, (90, 130, 230), "happy", 141), 480, 400, scale=k, key="sb1")
        place(cv, bot_sprite(110, (60, 160, 130), "happy", 142), 690, 410, scale=k, key="sb2")
        place(cv, icon("bucket", 60, 3), 860, 460, scale=k, key="bk")
        place(cv, icon("shovel", 60, 4), 330, 470, scale=k, key="sh")
        k2 = pop(t, B[2] + 1.0, snd="stamp")
        place(cv, tcard("SIMULATION ONLY", 34, 330, 70, (255, 255, 255), RED, "caps", seed=143, edge=RED), 640, 160, rot=-4, scale=k2, key="sim")
        k3 = pop(t, B[2] + D[2] * 0.62, snd="ding")
        place(cv, tcard("early warning signs, caught in a sandbox", 32, 660, 64, YEL, INK, seed=144), 640, 650, rot=1, scale=k3, key="ew")
        claude(cv, 1170, 330, 60, key="claude", look=(-1, 0.5))


@lru_cache(None)
def rocket_sprite():
    img = rgba(300, 160); d = ImageDraw.Draw(img)
    d.polygon([(60, 20), (110, 60), (60, 60)], fill=RED + (255,))
    d.polygon([(60, 140), (110, 100), (60, 100)], fill=RED + (255,))
    d.ellipse((50, 45, 250, 115), fill=(235, 235, 240, 255), outline=INK + (255,), width=3)
    d.polygon([(235, 55), (295, 80), (235, 105)], fill=RED + (255,), outline=INK + (255,))
    d.ellipse((170, 62, 206, 98), fill=(120, 200, 240, 255), outline=INK + (255,), width=3)
    return grainify(img, 150)


@lru_cache(None)
def snail_sprite():
    img = rgba(200, 150); d = ImageDraw.Draw(img)
    d.ellipse((10, 95, 190, 140), fill=(160, 190, 120, 255), outline=INK + (255,), width=3)
    d.line((160, 105, 175, 50), fill=(160, 190, 120, 255), width=8); d.line((175, 105, 195, 55), fill=(160, 190, 120, 255), width=8)
    d.ellipse((168, 40, 184, 56), fill=INK + (255,)); d.ellipse((188, 46, 200, 60), fill=INK + (255,))
    for r, col in ((62, (200, 130, 60)), (45, (230, 170, 80)), (28, (200, 130, 60)), (12, (230, 170, 80))):
        d.ellipse((85 - r, 70 - r, 85 + r, 70 + r), fill=col + (255,), outline=INK + (255,), width=2)
    return grainify(img, 151)


@lru_cache(None)
def pacecar_sprite():
    img = rgba(320, 220); d = ImageDraw.Draw(img)
    d.line((250, 110, 250, 10), fill=INK + (255,), width=5)
    for i in range(4):
        for j in range(3):
            d.rectangle((252 + i * 16, 12 + j * 16, 268 + i * 16, 28 + j * 16), fill=(INK if (i + j) % 2 else (255, 255, 255)) + (255,))
    d.rounded_rectangle((60, 90, 200, 140), 20, fill=(240, 240, 250, 255), outline=INK + (255,), width=3)
    d.rounded_rectangle((10, 125, 310, 185), 22, fill=YEL + (255,), outline=INK + (255,), width=3)
    d.text((160, 155), "PACE CAR", font=font("caps", 30), fill=INK + (255,), anchor="mm")
    for x in (70, 250):
        d.ellipse((x - 28, 160, x + 28, 216), fill=(30, 30, 30, 255)); d.ellipse((x - 11, 177, x + 11, 199), fill=(180, 180, 180, 255))
    return grainify(img, 152)


def sc_race(cv, t, B, D):
    cv.paste(draw_bg((190, 222, 245), 8, floor=(420, (120, 170, 90))))
    d = ImageDraw.Draw(cv)
    d.rectangle((0, 470, W, 610), fill=(95, 95, 100))
    speed = 60 if t < B[1] else 18
    off = int((t * speed * 12) // 12) % 160
    for x in range(-160, W + 160, 160):
        d.rectangle((x - off, 535, x - off + 80, 545), fill=(245, 240, 220))
    for x, y in ((180, 110), (620, 80), (1050, 130)):
        place(cv, card(170, 60, (255, 255, 255), x), x + math.sin(t * 0.3 + x) * 10, y, key=f"cl{x}", shadow=0.15)
    if t < B[1]:
        xr = clamp((t - B[0]) / D[0]); xr = int(xr * 14) / 14
        rx = lerp(220, 1060, ease(xr)); sx = lerp(200, 330, xr)
        k = pop(t, B[0] - 0.2, snd="whoosh")
    else:
        x = clamp((t - B[1]) / 1.4); x = int(x * 8) / 8
        rx = lerp(1060, 820, ease(x)); sx = lerp(330, 560, ease(x)); k = 1
        kc = pop(t, B[1] + 0.2, snd="boing")
        place(cv, pacecar_sprite(), lerp(1500, 1080, ease(clamp((t - B[1]) / 1.0))), 470, key="pace")
        k3 = pop(t, B[1] + D[1] * 0.5, snd="ding")
        place(cv, tcard("build at a balanced rate", 40, 520, 72, YEL, INK, seed=160), 640, 230, rot=-2, scale=k3, key="bal")
    fl = R("flame").uniform(0.7, 1.2)
    flame = rgba(140, 80); fd = ImageDraw.Draw(flame)
    fd.polygon([(140, 20), (140 - 110 * fl, 40), (140, 60)], fill=(255, 170, 40, 255))
    fd.polygon([(140, 30), (140 - 60 * fl, 40), (140, 50)], fill=(255, 240, 120, 255))
    place(cv, flame, rx - 140, 470, scale=k, key="flame", shadow=0)
    place(cv, rocket_sprite(), rx, 470, scale=k, key="rocket")
    place(cv, tcard("CAPABILITIES", 26, 220, 46, RED, (255, 255, 255), "caps", seed=161), rx, 575, scale=k, key="capl")
    place(cv, snail_sprite(), sx, 490, scale=k * 0.9, key="snail")
    place(cv, tcard("SAFETY", 26, 130, 46, GREEN, (255, 255, 255), "caps", seed=162), sx, 590, scale=k, key="safl")
    mini_claude(cv, 1215, 665, 40)


def sc_steps(cv, t, B, D):
    cv.paste(draw_bg((242, 226, 200), 9, floor=(640, (190, 150, 110))))
    blocks = [(250, 580, 300, 120, "1  ANTHROPIC", CL), (640, 520, 300, 240, "2  INDUSTRY", TEAL), (1030, 460, 300, 360, "3  WORLD", BLUE)]
    for i, (x, ytop, w, h, lab, col) in enumerate(blocks):
        k = pop(t, B[0] + 0.2 + i * 0.35, snd="stamp")
        spr = card(w, h, col, 170 + i).copy(); d = ImageDraw.Draw(spr)
        d.text((spr.width / 2, 45), lab, font=font("caps", 34), fill=(255, 255, 255, 255), anchor="mm")
        place(cv, spr, x, 640 - h / 2 * k + (h / 2) * (1 - k), scale=1.0 if k > 0 else 0, key=f"blk{i}", jit=0.6)
    # step 1 details
    tb = B[1]
    for j, (ic, dx, dy, when) in enumerate([("evaluator", 0, -110, 3.2), ("desk", -110, -300, 7.2), ("badge", 0, -330, 7.8), ("laptop", 110, -300, 8.4), ("paper", 0, -470, 10.0)]):
        k = pop(t, tb + min(when, D[1] - 0.8), snd="pop")
        place(cv, icon(ic, 55 if ic != "evaluator" else 70, j), 250 + dx, 520 + dy, scale=k, key=f"s1{j}")
    k = pop(t, tb + 4.6, snd="ding")
    place(cv, tcard("permanent, employee-level access", 26, 300, 70, YEL, INK, seed=180), 250, 145, rot=-3, scale=k if t < tb + 9.8 else 0, key="pel")
    k = pop(t, tb + 10.2, snd="ding")
    place(cv, tcard("publish w/o editorial control", 24, 280, 58, (255, 255, 255), INK, seed=181), 470, 40 + 30, rot=3, scale=k, key="pub")
    # step 2 / 3
    k = pop(t, B[2] + 0.4)
    for j in range(3):
        place(cv, bot_sprite(60, [PINK, GREEN, PURP][j], "happy", 190 + j), 560 + j * 80, 350, scale=k, key=f"ind{j}")
    k = pop(t, B[2] + D[2] * 0.55)
    place(cv, icon("globe", 80, 5), 1030, 190, scale=k, rot=math.sin(t) * 8, key="globe")
    if t >= B[3] and t < B[4] + 0.6:
        k = pop(t, B[3] + D[3] * 0.55, snd="stamp")
        place(cv, stamp("AGREED!", 110, RED, 7), 640, 300, rot=-12, scale=k, key="agr", shadow=0)
        k2 = pop(t, B[3] + D[3] * 0.7, snd=None)
        place(cv, tcard("- Sam Altman, OpenAI, within hours", 26, 440, 52, (255, 255, 255), INK, seed=195), 640, 420, scale=k2, key="sam")
    if t >= B[4]:
        k = pop(t, B[4] + 0.1, snd="boing")
        place(cv, claude_sprite(95, env=ENV["C"][FRAME], mood="wow", key="cw"), 640, lerp(900, 215, clamp(k)), key="cw")
        k2 = pop(t, B[4] + D[4] * 0.6, snd="pop")
        place(cv, label("?!", 110, RED, "title"), 790, 110, rot=10, scale=k2, key="qm", shadow=0.3)


def sc_opus(cv, t, B, D):
    cv.paste(draw_bg((232, 222, 246), 10, floor=(620, (180, 160, 200))))
    tt = t
    if t < B[1]:
        claude(cv, 640, 380, 130, key="claude", mood="wow" if t < B[0] + 1.5 else "happy")
        k = pop(t, B[0] + 1.2, snd="tada")
        place(cv, tcard("OPUS 5.5", 44, 240, 80, (255, 255, 255), CL, "caps", seed=200, edge=CL), 640, 620, rot=-3, scale=k, key="nt")
        confetti(cv, t, B[0] + 1.2)
        k = pop(t, B[0] + 2.8, snd="pop")
        place(cv, tcard("the model making this video", 30, 470, 60, YEL, INK, seed=201), 640, 110, rot=2, scale=k, key="mk")
    elif t < B[2]:
        x = clamp((t - B[1]) / 0.6); x = int(x * 5) / 5
        claude(cv, lerp(640, 280, ease(x)), 420, lerp(130, 110, x), key="claude")
        stats = [("~ Fable 5.1", "on most work", 1.2), ("-40% cost", "vs Opus 5, typical workloads", D[1] * 0.5), ("+30% faster", "output speed", D[1] * 0.82)]
        for i, (big, small, when) in enumerate(stats):
            k = pop(t, B[1] + when, snd="stamp")
            img = card(520, 140, [TEAL, CL, BLUE][i], 210 + i).copy(); d = ImageDraw.Draw(img)
            d.text((30, 18), big, font=font("sans", 54), fill=(255, 255, 255, 255))
            d.text((32, 90), small, font=font("comic", 28), fill=(255, 255, 255, 230))
            place(cv, img, 860, 150 + i * 175, rot=(i - 1) * 2.5, scale=k, key=f"st{i}")
    else:
        claude(cv, 200, 440, 90, key="claude", look=(1, 0))
        place(cv, tcard("Terminal-Bench 4.0", 38, 420, 70, (255, 255, 255), INK, "comic", seed=220), 790, 70, rot=-1, key="tb", scale=pop(t, B[2] + 0.1, snd="whoosh"))
        for bi, (nm, val, col, x0) in enumerate([("Opus 5", 52.3, (160, 150, 170), 620), ("Opus 5.5", 66.4, CL, 960)]):
            nblk = int(val // 10) + 1
            for j in range(nblk):
                h = 10 if j < nblk - 1 else val - 10 * (nblk - 1)
                k = pop(t, B[2] + 0.5 + bi * 1.8 + j * 0.2, snd="tick")
                if k <= 0:
                    continue
                bh = h * 6.2
                y = 600 - (j * 10 * 6.2) - bh / 2
                place(cv, card(170, max(4, int(bh) - 4), col, 230 + bi * 10 + j), x0, y, scale=1, key=f"bar{bi}{j}", jit=0.7)
            k = pop(t, B[2] + 0.5 + bi * 1.8 + nblk * 0.2, snd="ding" if bi else "pop")
            place(cv, label(f"{val}%", 50, INK, "sans"), x0, 600 - val * 6.2 - 45, scale=k, key=f"bv{bi}", shadow=0)
            place(cv, label(nm, 34, INK, "caps"), x0, 650, key=f"bn{bi}", shadow=0)
        k = pop(t, B[2] + 4.6, snd="boing")
        place(cv, tcard("+14.1 pts!", 36, 220, 64, YEL, INK, "caps", seed=240), 1150, 250, rot=10, scale=k, key="plus")


@lru_cache(None)
def clipboard(nshown, nticks):
    img = rgba(620, 600); d = ImageDraw.Draw(img)
    d.rounded_rectangle((10, 20, 610, 590), 26, fill=(165, 115, 70, 255), outline=(110, 75, 45, 255), width=4)
    d.rectangle((40, 60, 580, 565), fill=(252, 250, 242, 255))
    d.rounded_rectangle((220, 0, 400, 70), 12, fill=(170, 170, 180, 255), outline=INK + (255,), width=3)
    d.text((310, 105), "SAFETY CHECKLIST", font=font("caps", 36), fill=INK + (255,), anchor="mm")
    items = ["First release since\n'Pace the Frontier'", "Pre-launch tests by outside\nevaluators: METR + Frontier Design",
             "Best automated behavioral\naudit score yet", "85% fewer boundary-circumvention\nattempts vs Opus 5"]
    for i in range(nshown):
        y = 150 + i * 102
        d.rectangle((60, y, 100, y + 40), outline=INK + (255,), width=4)
        if i < nticks:
            d.line((66, y + 20, 80, y + 36, 110, y - 6), fill=(40, 150, 70, 255), width=8)
        for j, ln in enumerate(items[i].split("\n")):
            d.text((125, y - 4 + j * 36), ln, font=font("comic", 29), fill=INK + (255,))
    return grainify(img, 250 + nshown * 10 + nticks)


def sc_safety(cv, t, B, D):
    cv.paste(draw_bg((212, 234, 218), 11, floor=(630, (150, 185, 160))))
    times = [B[0] + D[0] * 0.55, B[1] + 1.0, B[2] + 1.5, B[2] + D[2] * 0.62]
    n = sum(1 for x in times if t >= x)
    nt = sum(1 for x in times if t >= x + 0.6)
    for x in times:
        if t >= x:
            sfx("pop", x)
        if t >= x + 0.6:
            sfx("ding", x + 0.6)
    k = pop(t, 0.15, snd="whoosh")
    place(cv, clipboard(n, nt), 840, 370, rot=-1.5, scale=k * 0.98, key="clip")
    medal = t >= B[2] + D[2] + 0.1
    if medal:
        sfx("tada", B[2] + D[2] + 0.1)
    claude(cv, 250, 420, 105, key="claude", medal=medal, look=(1, 0))


def sc_outro(cv, t, B, D):
    cv.paste(draw_bg((244, 230, 200), 12, floor=(600, (200, 150, 110))))
    end0 = B[2] + D[2] + 0.3
    wave = math.sin(FRAME * 1.6) * 22 if t > B[1] else 0
    if t < end0:
        claude(cv, 640, 420, 125, key="claude", wave=wave, voice_on=t < B[2])
    recap = [("TEST FOR SNEAKY", TEAL, 0.28), ("PACE THE FRONTIER", BLUE, 0.48), ("SHIP SAFER", CL, 0.76)]
    if t < B[1]:
        for i, (txt, col, f) in enumerate(recap):
            k = pop(t, B[0] + D[0] * f, snd="stamp")
            place(cv, tcard(txt, 34, 330, 70, col, (255, 255, 255), "caps", seed=260 + i), 250 + i * 390, 120, rot=(i - 1) * 4, scale=k, key=f"rc{i}")
    else:
        rnd = RS("scraps")
        for i in range(26):
            k = pop(t, B[1] + D[1] * 0.55 + i * 0.07, snd="tick" if i % 4 == 0 else None)
            place(cv, card(rnd.randint(30, 80), rnd.randint(20, 50), rnd.choice([CL, TEAL, YEL, PINK, BLUE, GREEN, CREAM]), 300 + i),
                  rnd.uniform(60, 1220), rnd.uniform(610, 700), rot=rnd.uniform(-40, 40), scale=k, key=f"scr{i}", jit=0.6)
    if t >= B[2] - 0.2:
        k = pop(t, B[2] - 0.2, snd="boing")
        if t < end0:
            newsbot(cv, 1060, 420, 110)
        clapper(cv, 250, 430, t, B[2] - 0.1, B[2] + 0.7, key="clap2", scale=0.9)
    if t >= end0:
        for i, ch in enumerate("THE END"):
            if ch == " ":
                continue
            k = pop(t, end0 + 0.16 * i)
            cols = [CL, TEAL, YEL, PINK, BLUE, GREEN, PURP]
            place(cv, tcard(ch, 100, 110, 130, cols[i], INK if cols[i] == YEL else (255, 255, 255), "title", seed=320 + i),
                  640 - 3 * 135 + i * 135, 230, rot=RS(("e", i)).uniform(-8, 8), scale=k, key=f"E{i}")
        claude(cv, 640, 440, 70, key="claude", wave=math.sin(FRAME * 1.6) * 22, voice_on=False)
        k = pop(t, end0 + 1.6, snd="ding")
        place(cv, tcard("written, voiced & animated by Claude\nsources: anthropic.com · alignment.anthropic.com · darioamodei.com",
                        22, 760, 90, CREAM, INK, "comic", seed=340), 640, 620, scale=k, key="cred")


DRAW = {"title": sc_title, "whoami": sc_whoami, "lab": sc_lab, "four": sc_four, "lineup": sc_lineup,
        "race": sc_race, "steps": sc_steps, "opus": sc_opus, "safety": sc_safety, "outro": sc_outro}

# ------------------------------------------------------------------ HUD & post
GRAIN = [np.random.RandomState(i).randint(-7, 8, (H, W, 1)).astype(np.int16) for i in range(6)]


def hud(cv):
    d = ImageDraw.Draw(cv)
    if (FRAME // 8) % 2 == 0:
        d.ellipse((30, 28, 50, 48), fill=(230, 40, 40))
    d.text((60, 25), "REC", font=font("mono", 22), fill=(255, 255, 255))
    d.text((W - 200, 25), f"FRAME {FRAME:04d}", font=font("mono", 22), fill=(255, 255, 255))
    for (x, y, sx, sy) in ((20, 20, 1, 1), (W - 20, 20, -1, 1), (20, H - 20, 1, -1), (W - 20, H - 20, -1, -1)):
        d.line((x, y, x + 40 * sx, y), fill=(255, 255, 255), width=3)
        d.line((x, y, x, y + 40 * sy), fill=(255, 255, 255), width=3)


def render_frame(f):
    global FRAME
    FRAME = f
    ta = f / FPS
    si = max(i for i, s in enumerate(scenes) if s["start"] <= ta + 1e-9)
    sc = scenes[si]
    S.start = sc["start"]
    t = ta - sc["start"]
    cv = Image.new("RGB", (W, H))
    if sc["id"] in CHAPTERS:
        sc_chapter(cv, t, sc["B"], sc["D"], sc["id"])
    else:
        DRAW[sc["id"]](cv, t, sc["B"], sc["D"])
    hud(cv)
    if t < 1e-6 or (t < 1 / FPS and si > 0):
        sfx("shutter", 0)
    a = np.asarray(cv).astype(np.int16)
    flick = 1 + R("flick").uniform(-0.035, 0.035)
    a = a * flick + GRAIN[f % 6]
    if t < 1 / FPS * 0.99 and si > 0:  # shutter flash on cuts
        a = a * 0.6 + 100
    return np.clip(a, 0, 255).astype(np.uint8)


# ------------------------------------------------------------------ audio synth
def env_exp(n, k):
    return np.exp(-np.arange(n) / SR * k)


def synth(name):
    rs = np.random.RandomState(abs(hash(name)) % 1000)
    if name == "pop":
        n = int(0.09 * SR); tt = np.arange(n) / SR
        f = 900 * np.exp(-tt * 30) + 250
        return 0.5 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 45)
    if name == "tick":
        n = int(0.04 * SR); tt = np.arange(n) / SR
        return 0.3 * np.sin(2 * np.pi * 1800 * tt) * env_exp(n, 120)
    if name == "shutter":
        n = int(0.12 * SR); x = np.diff(rs.randn(n + 1)) * 0.25
        e = env_exp(n, 90) + np.concatenate([np.zeros(int(0.05 * SR)), env_exp(n - int(0.05 * SR), 90)])
        return x * e
    if name == "whoosh":
        n = int(0.4 * SR); x = rs.randn(n)
        k = np.ones(40) / 40; x = np.convolve(x, k, "same")
        e = np.sin(np.linspace(0, np.pi, n)) ** 2
        return 1.6 * x * e
    if name == "clap":
        n = int(0.18 * SR); x = rs.randn(n) * env_exp(n, 60) * 0.6
        tt = np.arange(n) / SR
        return x + 0.6 * np.sin(2 * np.pi * (120 * np.exp(-tt * 20) + 50) * tt) * env_exp(n, 25)
    if name == "stamp":
        n = int(0.25 * SR); tt = np.arange(n) / SR
        thump = 0.8 * np.sin(2 * np.pi * np.cumsum(140 * np.exp(-tt * 18) + 45) / SR) * env_exp(n, 18)
        return thump + np.convolve(rs.randn(n), np.ones(8) / 8, "same") * env_exp(n, 70) * 0.5
    if name == "ding":
        n = int(0.9 * SR); tt = np.arange(n) / SR
        return 0.28 * (np.sin(2 * np.pi * 1318.5 * tt) + 0.4 * np.sin(2 * np.pi * 2637 * tt) * env_exp(n, 8)) * env_exp(n, 5)
    if name == "boing":
        n = int(0.45 * SR); tt = np.arange(n) / SR
        f = 260 + 160 * np.sin(2 * np.pi * 9 * tt) * np.exp(-tt * 5) + 120 * tt
        return 0.35 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 6)
    if name == "tada":
        out = np.zeros(int(1.3 * SR))
        for i, m in enumerate([72, 76, 79, 84]):
            s0 = int(i * 0.07 * SR); n = len(out) - s0; tt = np.arange(n) / SR
            fr = 440 * 2 ** ((m - 69) / 12)
            out[s0:] += 0.14 * (np.sin(2 * np.pi * fr * tt) + 0.3 * np.sin(4 * np.pi * fr * tt)) * env_exp(n, 3.5)
        return out
    raise ValueError(name)


def midi(m):
    return 440 * 2 ** ((m - 69) / 12)


def music(total, scene_list):
    n = int(total * SR); out = np.zeros(n + SR * 2)
    bpm = 104; beat = 60 / bpm; eighth = beat / 2
    CH = {"C": [60, 64, 67], "G": [59, 62, 67], "Am": [57, 60, 64], "F": [57, 60, 65], "Dm": [57, 62, 65], "E": [56, 59, 64], "Em": [55, 59, 64]}
    MOOD = {"happy": ["C", "G", "Am", "F"], "mystery": ["Am", "F", "Dm", "E"], "bright": ["F", "C", "Dm", "G"], "party": ["C", "F", "G", "C"]}
    SM = {"title": "happy", "whoami": "happy", "ch1": "mystery", "lab": "mystery", "four": "mystery", "lineup": "mystery",
          "ch2": "bright", "race": "bright", "steps": "bright", "ch3": "party", "opus": "party", "safety": "party", "outro": "happy"}
    pat = [0, 2, 1, 3, 2, 1, 3, 2]

    def note(fr, dur, amp, kind):
        m = int(dur * SR); tt = np.arange(m) / SR
        if kind == "mar":
            return amp * (np.sin(2 * np.pi * fr * tt) + 0.25 * np.sin(2 * np.pi * 4 * fr * tt) * np.exp(-tt * 25)) * np.exp(-tt * 7)
        if kind == "bass":
            return amp * (np.sin(2 * np.pi * fr * tt) + 0.3 * np.sin(4 * np.pi * fr * tt)) * np.exp(-tt * 3) * np.minimum(1, tt * 200)
    bar = 0; t0 = 0.0
    rs = np.random.RandomState(5)
    while t0 < total:
        sc = max([s for s in scene_list if s["start"] <= t0 + 1e-9], key=lambda s: s["start"])
        mood = SM[sc["id"]]
        ch = CH[MOOD[mood][bar % 4]]
        tones = ch + [ch[0] + 12]
        for i in range(8):
            ts = t0 + i * eighth; s0 = int(ts * SR)
            nt = note(midi(tones[pat[i]] + 12), 0.6, 0.11 if mood != "mystery" else 0.09, "mar")
            out[s0:s0 + len(nt)] += nt[: len(out) - s0]
            if i % 2 == 1:
                m = int(0.035 * SR); sh = np.diff(rs.randn(m + 1)) * env_exp(m, 120) * 0.035
                out[s0:s0 + m] += sh
        for b in (0, 2):
            s0 = int((t0 + b * beat) * SR)
            nt = note(midi(ch[0] - 24), 0.9, 0.22, "bass")
            out[s0:s0 + len(nt)] += nt[: len(out) - s0]
        if mood in ("party", "happy", "bright"):
            m = int(0.25 * SR); tt = np.arange(m) / SR
            kick = 0.25 * np.sin(2 * np.pi * np.cumsum(100 * np.exp(-tt * 25) + 45) / SR) * env_exp(m, 14)
            for b in (0, 2):
                s0 = int((t0 + b * beat) * SR); out[s0:s0 + m] += kick
        t0 += 4 * beat; bar += 1
    out = out[:n]
    fade = int(2.5 * SR); out[-fade:] *= np.linspace(1, 0, fade)
    out[: int(0.8 * SR)] *= np.linspace(0, 1, int(0.8 * SR))
    return out


def build_audio(path):
    n = int(TOTAL * SR)
    vo = (voice["C"] + voice["N"])[:n]
    # ducking envelope
    ab = np.abs(vo); hop = 512
    e = np.array([ab[i:i + hop].max() for i in range(0, n, hop)])
    sm = np.zeros_like(e); cur = 0
    for i, v in enumerate(e):
        cur = max(v, cur * 0.965); sm[i] = cur
    duck = np.repeat(sm, hop)[:n]
    gain = 1 - 0.55 * np.clip(duck * 3, 0, 1)
    mus = music(TOTAL, scenes) * gain * 0.85
    fx = np.zeros(n + SR * 2)
    cache = {}
    last = {}
    for (ta, name) in sorted(EVENTS):
        if name in last and ta - last[name] < 0.06:
            continue
        last[name] = ta
        if name not in cache:
            cache[name] = synth(name)
        s0 = int(ta * SR); x = cache[name]
        fx[s0:s0 + len(x)] += x * 0.55
    mix = vo * 1.0 + mus + fx[:n]
    mix = mix / max(1e-6, np.abs(mix).max()) * 0.95
    pcm = (mix * 32767).astype(np.int16)
    with wave.open(path, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    if PREVIEW:
        for ta in PREVIEW:
            Image.fromarray(render_frame(int(ta * FPS))).save(f"prev_{ta:06.1f}.png")
        print("previews done"); sys.exit()
    proc = subprocess.Popen([FFMPEG, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                             "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
                             "-pix_fmt", "yuv420p", "-r", "24", "video_silent.mp4"], stdin=subprocess.PIPE)
    for f in range(NFR):
        proc.stdin.write(render_frame(f).tobytes())
        if f % 200 == 0:
            print("frame", f, "/", NFR, flush=True)
    proc.stdin.close(); proc.wait()
    build_audio("audio.wav")
    subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", "video_silent.mp4", "-i", "audio.wav", "-c:v", "copy",
                    "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", "claude_stop_motion.mp4"], check=True)
    print("done")
