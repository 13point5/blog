# Renders notes.json (the score) + events.json (foley cues exported by the page) + narration -> mix.wav
import json, numpy as np, soundfile as sf
from scipy.signal import lfilter, butter, sosfilt
SR = 44100
tl = json.load(open("timeline.json")); sc = json.load(open("notes.json")); events = json.load(open("events.json"))
T = tl["total"]; N = int(T * SR); rng = np.random.default_rng(3); t_all = np.arange(N) / SR
f = lambda m: 440 * 2 ** ((m - 69) / 12)
lp1 = lambda x, a: lfilter([a], [1, a - 1], x)
def add(buf, sig, at, g=1.0):
    i = int(round(at * SR))
    if i < 0 or i >= len(buf): return
    j = min(len(buf), i + len(sig)); buf[i:j] += g * sig[: j - i]
tt = lambda d: np.arange(int(d * SR)) / SR

def marimba(m, d=.9, bright=1.0):
    t = tt(d); fr = f(m)
    body = np.sin(2*np.pi*fr*t) * np.exp(-t * (5 + fr / 300))
    ov = .45 * bright * np.sin(2*np.pi*fr*3.93*t) * np.exp(-t*28) + .12 * bright * np.sin(2*np.pi*fr*9.2*t) * np.exp(-t*70)
    click = lp1(rng.standard_normal(len(t)), .5) * np.exp(-t*400) * .15
    return (body + ov + click) * np.minimum(1, t * 2000)
def pizz(m, d=.45):
    t = tt(d); fr = f(m)
    return (np.sin(2*np.pi*fr*t) + .5*np.sin(2*np.pi*fr*2*t) + .2*np.sin(2*np.pi*fr*3*t)) * np.exp(-t*8) * np.minimum(1, t*300)
def block(freq, d=.07):
    t = tt(d); return (np.sin(2*np.pi*freq*t) + .3*np.sin(2*np.pi*freq*2.7*t)) * np.exp(-t*80)
def shaker(d=.06):
    n = rng.standard_normal(int(d*SR)); n = sosfilt(butter(2, 5000, 'hp', fs=SR, output='sos'), n); return n * np.exp(-tt(d)*70) * .6

music = np.zeros(N); feat = np.zeros(N)
for n in sc["notes"]:
    i, g = n["i"], n["g"]
    if i == "pizz": add(music, pizz(n["m"]), n["t"], g)
    elif i == "block": add(music, block(n["f"]), n["t"], g)
    elif i == "shaker": add(music, shaker(), n["t"], g)
    elif i == "stab": add(music, marimba(n["m"], .35, .6), n["t"], g)
    elif i == "mel": add(feat if n.get("feat") else music, marimba(n["m"], 1.1, 1.2), n["t"], g)
# a touch of room on the music
def room(x):
    out = x.copy()
    for dly, g in [(.023, .25), (.041, .18), (.067, .12), (.097, .08)]:
        d = int(dly * SR); out[d:] += g * lp1(x[:-d], .35)
    return out
music = room(music); feat = room(feat)

sfx = np.zeros(N)
def s_pop():   t = tt(.14); return np.sin(2*np.pi*(350 + 1400*t/.14)*t) * np.exp(-t*30) * .5
def s_thud():
    t = tt(.22); n = lp1(rng.standard_normal(len(t)), .08)
    return (np.sin(2*np.pi*(120*np.exp(-t*12)+60)*t)*.9 + n*.5) * np.exp(-t*24) * .7
def s_tick():  return block(2400, .05) * .35
def s_clack():
    fr = 1700 + rng.random() * 500; t = tt(.06); n = sosfilt(butter(2, [1200, 5000], 'bp', fs=SR, output='sos'), rng.standard_normal(len(t)))
    return (block(fr, .06) * .5 + n * .6) * np.exp(-t*60) * .5
def s_zip():   t = tt(.45); return np.sin(2*np.pi*(300 + 1600*(t/.45)**2)*t) * np.sin(np.pi*t/.45) * .22
def s_bonk():  t = tt(.7); return np.sin(2*np.pi*(220 + 90*np.sin(2*np.pi*9*t)*np.exp(-t*4))*t) * np.exp(-t*5) * .6
def s_strike():
    out = np.zeros(int(1.0*SR))
    for k in range(5):
        t = tt(.25); fr = 600 + rng.random()*900; s = (np.sin(2*np.pi*fr*t) + .4*sosfilt(butter(2, [800, 4000], 'bp', fs=SR, output='sos'), rng.standard_normal(len(t)))) * np.exp(-t*25) * .35
        i = int(k * .05 * SR + rng.random() * .03 * SR); out[i:i+len(s)] += s
    return out
def s_confetti():
    out = np.zeros(int(1.2*SR))
    for k in range(14):
        t = tt(.3); fr = 1800 + rng.random()*2500; s = np.sin(2*np.pi*fr*t) * np.exp(-t*25) * .12; i = int(rng.random()*.9*SR); out[i:i+len(s)] += s
    return out
SND = {'pop': s_pop, 'thud': s_thud, 'tick': s_tick, 'clack': s_clack, 'zip': s_zip, 'bonk': s_bonk, 'strike': s_strike, 'confetti': s_confetti}
last = {}
evs = sorted(events)
for t, k in evs:
    if t - last.get(k, -9) < (.03 if k == 'clack' else .09): continue
    last[k] = t
    dens = sum(1 for u, kk in evs if kk == k and abs(u - t) < .3)          # busy moments: many quieter hits, not a wall of noise
    add(sfx, SND[k](), t, .55 * (.85 + .3 * rng.random()) / np.sqrt(max(1, dens / 2)))

voice, vsr = sf.read("narration.wav")
voice = np.interp(np.arange(N) / SR * vsr, np.arange(len(voice)), voice)
e = np.convolve(np.abs(voice), np.ones(int(.25*SR)) / int(.25*SR), mode="same")
duck = lp1(1 - .55 * np.clip(e / .04, 0, 1), .0004)
duckf = lp1(1 - .35 * np.clip(e / .04, 0, 1), .0004)          # the featured marimba ducks less: it's the point of that scene
fade = np.minimum(1, t_all / 1.0) * np.minimum(1, (T - t_all) / 2.5)
# gentle voice presence lift
voice = voice + .25 * sosfilt(butter(2, [2500, 6000], 'bp', fs=SR, output='sos'), voice)
mix = voice + (music * duck + feat * duckf) * fade * 1.15 + sfx * .8
mix /= max(1.0, np.abs(mix).max() / .95)
sf.write("mix_raw.wav", mix.astype(np.float32), SR)
print("ok", round(T, 2))
