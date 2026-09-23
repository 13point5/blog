# Bouncy stop-motion score (marimba, pizzicato bass, woodblock) + foley from the page's events -> mix.wav
import json, numpy as np, soundfile as sf

SR = 44100
tl = json.load(open("timeline.json")); events = json.load(open("events.json"))
T = tl["total"]; N = int(T * SR)
rng = np.random.default_rng(3)
t_all = np.arange(N) / SR
f = lambda m: 440 * 2 ** ((m - 69) / 12)

def lp(x, a):
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y
def add(buf, sig, at, g=1.0):
    i = int(at * SR)
    if i < 0 or i >= len(buf): return
    j = min(len(buf), i + len(sig)); buf[i:j] += g * sig[: j - i]
def env_t(dur): n = int(dur * SR); return np.arange(n) / SR

def marimba(m, dur=.6):
    t = env_t(dur); fr = f(m)
    return (np.sin(2*np.pi*fr*t) + .35*np.sin(2*np.pi*fr*4*t)*np.exp(-t*30) + .15*np.sin(2*np.pi*fr*10*t)*np.exp(-t*60)) * np.exp(-t*7)
def pizz(m, dur=.4):
    t = env_t(dur); fr = f(m)
    return (np.sin(2*np.pi*fr*t) + .5*np.sin(2*np.pi*fr*2*t) + .2*np.sin(2*np.pi*fr*3*t)) * np.exp(-t*9) * np.minimum(1, t*300)
def block(freq=1800, dur=.06):
    t = env_t(dur); return np.sin(2*np.pi*freq*t) * np.exp(-t*90)
def shaker(dur=.05):
    n = rng.standard_normal(int(dur*SR)); n = n - lp(n, .4); return n * np.exp(-env_t(dur)*80) * .5

BPM = 112; beat = 60 / BPM; bar = 4 * beat
music = np.zeros(N, np.float32)
# C  G  Am F  (bouncy major)
prog = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]
melody = [[72, None, 76, 74, 72, None, 67, None], [71, None, 74, None, 71, 69, 67, None],
          [69, None, 72, 71, 69, None, 76, None], [77, 76, 74, None, 72, None, None, None]]
nb = int(T / bar) + 1
for b in range(nb):
    t0 = b * bar; ch = prog[b % 4]; mel = melody[b % 4]
    full = 1 <= b < nb - 1
    for q in range(4):
        tb = t0 + q * beat
        add(music, pizz(ch[0] - 12 if q % 2 == 0 else ch[2] - 24), tb, .22)
        add(music, block(1500 if q % 2 else 2100), tb + (beat/2 if q % 2 else 0), .10 if full else 0)
        for e in range(2): add(music, shaker(), tb + e * beat / 2 + .01, .05 if full else 0)
        # offbeat chord stabs
        for m in ch: add(music, marimba(m + 12, .3), tb + beat / 2, .035)
    if b % 8 in (2, 3, 6, 7) or b == 0:  # melody enters every other phrase, so it doesn't fight the voice
        for i, m in enumerate(mel):
            if m: add(music, marimba(m, .5), t0 + i * beat / 2, .07)

# foley
sfx = np.zeros(N, np.float32)
def s_pop():
    t = env_t(.14); return np.sin(2*np.pi*(350 + 1400*t/.14)*t) * np.exp(-t*30) * .5
def s_thud():
    t = env_t(.22); n = lp(rng.standard_normal(len(t)), .08)
    return (np.sin(2*np.pi*(120*np.exp(-t*12)+60)*t)*.9 + n*1.5) * np.exp(-t*22) * .7   # soft clay "plop"
def s_tick():
    return block(2400, .05) * .35
def s_zip():
    t = env_t(.45); return np.sin(2*np.pi*(300 + 1600*(t/.45)**2)*t) * np.sin(np.pi*t/.45) * .22
def s_bonk():
    t = env_t(.7); return np.sin(2*np.pi*(220 + 90*np.sin(2*np.pi*9*t)*np.exp(-t*4))*t) * np.exp(-t*5) * .6
def s_confetti():
    out = np.zeros(int(1.2*SR))
    for k in range(14):
        t = env_t(.3); fr = 1800 + rng.random()*2500
        s = np.sin(2*np.pi*fr*t) * np.exp(-t*25) * .12; i = int(rng.random()*.9*SR); out[i:i+len(s)] += s
    return out
SND = {'pop': s_pop, 'thud': s_thud, 'tick': s_tick, 'zip': s_zip, 'bonk': s_bonk, 'confetti': s_confetti}
last = {}
for t, k in sorted(events):
    if t - last.get(k, -9) < .05: continue      # thin out simultaneous hits
    last[k] = t
    add(sfx, SND[k](), t, .55 * (0.85 + .3 * rng.random()))

voice, vsr = sf.read("narration.wav")
voice = np.interp(np.arange(N) / SR * vsr, np.arange(len(voice)), voice).astype(np.float32)
e = np.convolve(np.abs(voice), np.ones(int(.25*SR)) / int(.25*SR), mode="same")
duck = lp(1 - .5 * np.clip(e / .04, 0, 1), .0005)
fade = np.minimum(1, t_all / 1.0) * np.minimum(1, (T - t_all) / 2.5)
mix = voice + music * duck * fade * 1.1 + sfx * .8
mix /= max(1.0, np.abs(mix).max() / .95)
sf.write("mix.wav", mix.astype(np.float32), SR)
print("ok")
