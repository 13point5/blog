# Procedural lo-fi bed + transition SFX, ducked under narration -> mix.wav
import json, numpy as np, soundfile as sf

SR = 44100
tl = json.load(open("timeline.json"))
T = tl["total"]
N = int(T * SR)
rng = np.random.default_rng(7)
t_all = np.arange(N) / SR

def lp(x, a):  # one-pole low-pass
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc += a * (x[i] - acc); y[i] = acc
    return y

def add(buf, sig, at):
    i = int(at * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(sig)); buf[i:j] += sig[: j - i]

BPM = 92; beat = 60 / BPM; bar = 4 * beat
music = np.zeros(N, np.float32)

# drums
kl = int(0.35 * SR); kt = np.arange(kl) / SR
kick = np.sin(2 * np.pi * (48 + 90 * np.exp(-kt * 30)) * kt) * np.exp(-kt * 9)
sl = int(0.25 * SR); st = np.arange(sl) / SR
snare = lp(rng.standard_normal(sl), 0.35) * np.exp(-st * 22) * 0.55
hl = int(0.06 * SR); ht = np.arange(hl) / SR
hat_n = rng.standard_normal(hl); hat = (hat_n - lp(hat_n, 0.3)) * np.exp(-ht * 70) * 0.18

# chords: Fmaj7  Em7  Dm7  Cmaj7 (voiced mid-low)
chords = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]
f = lambda m: 440 * 2 ** ((m - 69) / 12)
pl = int(bar * SR); pt = np.arange(pl) / SR
env = np.minimum(1, pt / 0.4) * np.minimum(1, (bar - pt) / 0.5)
pads = []
for ch in chords:
    s = sum(np.sin(2 * np.pi * f(m) * pt) + 0.5 * np.sin(2 * np.pi * f(m) * 1.003 * pt) +
            0.15 * np.sin(2 * np.pi * f(m) * 2 * pt) for m in ch)
    pads.append((s * env * 0.05).astype(np.float32))
# plucky arpeggio notes
def pluck(m, dur=0.5):
    n = int(dur * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f(m) * tt) + 0.3 * np.sin(2 * np.pi * f(m) * 3 * tt) * np.exp(-tt * 12)) * np.exp(-tt * 6) * 0.07

nbars = int(T / bar) + 1
for b in range(nbars):
    t0 = b * bar
    ch = chords[b % 4]
    add(music, pads[b % 4], t0)
    drums_on = 1 <= b < nbars - 2
    for q in range(4):
        tb = t0 + q * beat
        if drums_on:
            if q in (0, 2): add(music, kick * 0.5, tb)
            if q == 2 and b % 2: add(music, kick * 0.35, tb + beat / 2)
            if q in (1, 3): add(music, snare, tb)
            add(music, hat, tb); add(music, hat * 0.6, tb + beat / 2 + 0.012)  # slight swing
        arp = [ch[0] + 12, ch[2] + 12, ch[1] + 12, ch[3] + 12]
        add(music, pluck(arp[q]), tb + (beat / 2 if b % 2 else 0))
# vinyl crackle
crk = np.zeros(N, np.float32)
idx = rng.integers(0, N, int(T * 12)); crk[idx] = rng.uniform(-0.25, 0.25, len(idx))
music += lp(crk, 0.5) * 0.4 + lp(rng.standard_normal(N), 0.02).astype(np.float32) * 0.01

# SFX: whoosh on every scene change, soft pop on every line
sfx = np.zeros(N, np.float32)
wl = int(0.7 * SR); wt = np.arange(wl) / SR
wn = rng.standard_normal(wl)
whoosh = np.zeros(wl)
acc = 0.0
for i in range(wl):  # sweeping low-pass cutoff
    a = 0.02 + 0.5 * np.sin(np.pi * wt[i] / 0.7) ** 2
    acc += a * (wn[i] - acc); whoosh[i] = acc
whoosh *= np.sin(np.pi * wt / 0.7) ** 2 * 0.35
pl2 = int(0.12 * SR); p2 = np.arange(pl2) / SR
pop = np.sin(2 * np.pi * (900 * np.exp(-p2 * 25) + 300) * p2) * np.exp(-p2 * 40) * 0.12
for sc in tl["scenes"]:
    if sc["start"] > 0: add(sfx, whoosh, sc["start"] - 0.3)
    for ln in sc["lines"]:
        add(sfx, pop, sc["start"] + ln["start"] - 0.05)

# duck music under the voice
voice, vsr = sf.read("narration.wav")
voice = np.interp(np.arange(N) / SR * vsr, np.arange(len(voice)), voice).astype(np.float32)
envv = np.abs(voice)
k = int(0.25 * SR)
envv = np.convolve(envv, np.ones(k) / k, mode="same")
duck = 1 - 0.55 * np.clip(envv / 0.04, 0, 1)
duck = lp(duck, 0.0005)
fade = np.minimum(1, t_all / 1.5) * np.minimum(1, (T - t_all) / 3.0)
mix = voice * 1.0 + music * duck * fade * 0.9 + sfx
mix /= max(1.0, np.abs(mix).max() / 0.95)
sf.write("mix.wav", mix.astype(np.float32), SR)
print("ok", T)
