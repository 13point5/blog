# The score, as data. Writes notes.json (used by both the audio mixer and the clay marimba on screen)
import json
tl = json.load(open("timeline.json"))
T = tl["total"]; sc = {s["id"]: s for s in tl["scenes"]}
BPM = 112; beat = 60 / BPM; bar = 4 * beat
prog = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]            # C  G  Am  F
melody = [[72, None, 76, 74, 72, None, 67, None], [71, None, 74, None, 71, 69, 67, None],
          [69, None, 72, 71, 69, None, 76, None], [77, 76, 74, None, 72, None, None, None]]
ms = sc["music"]; feat0 = ms["start"] + .2; feat1 = ms["start"] + ms["dur"] - .3
solo = ms["start"] + ms["lines"][1]["start"] + ms["lines"][1]["dur"]
notes = []
nb = int(T / bar) + 1
for b in range(nb):
    t0 = b * bar; ch = prog[b % 4]; full = 1 <= b < nb - 1
    featured = feat0 - bar < t0 < feat1
    for q in range(4):
        tb = t0 + q * beat
        notes.append({"t": tb, "m": ch[0] - 12 if q % 2 == 0 else ch[2] - 24, "i": "pizz", "g": .22})
        if full:
            notes.append({"t": tb + (beat / 2 if q % 2 else 0), "m": 0, "i": "block", "f": 1500 if q % 2 else 2100, "g": .10})
            for e in range(2): notes.append({"t": tb + e * beat / 2 + .01, "m": 0, "i": "shaker", "g": .05})
        for m in ch: notes.append({"t": tb + beat / 2, "m": m + 12, "i": "stab", "g": .03 if featured else .035})
    if featured or b % 8 in (2, 3, 6, 7) or b == 0:
        for i, m in enumerate(melody[b % 4]):
            tn = t0 + i * beat / 2; fe = featured and feat0 <= tn < feat1
            if m: notes.append({"t": tn, "m": m, "i": "mel", "g": (.2 if tn > solo - .2 else .12) if fe else .065, "feat": fe})
notes = [n for n in notes if n["t"] < T]
json.dump({"bpm": BPM, "feat": [feat0, feat1], "solo": solo, "notes": notes}, open("notes.json", "w"))
tl["notes"] = [[round(n["t"], 4), n["m"]] for n in notes if n["i"] == "mel" and n.get("feat")]
open("timeline.js", "w").write("const TL = " + json.dumps(tl, ensure_ascii=False) + ";")
print(len(notes), "notes;", len(tl["notes"]), "featured melody notes", round(feat0, 2), round(feat1, 2))
