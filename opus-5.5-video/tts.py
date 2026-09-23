# Synthesize each script line, lay them on a timeline, write narration.wav + timeline.json
import json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

SR = 24000
GAP = 0.35        # pause between lines
LEAD = 0.6        # pause at the start of each scene
spec = json.load(open("script.json"))
k = Kokoro("../voices/kokoro.onnx", "../voices/voices.bin")

audio, t, scenes = [], 0.0, []
def pad(sec):
    global t
    audio.append(np.zeros(int(sec * SR), dtype=np.float32)); t += sec

for sc in spec["scenes"]:
    start = t
    pad(LEAD)
    lines = []
    for text in sc["lines"]:
        s, sr = k.create(text, voice=spec["voice"], speed=spec["speed"], lang="en-us")
        assert sr == SR
        s = s.astype(np.float32)
        # trim leading/trailing near-silence so timings are tight
        nz = np.where(np.abs(s) > 0.01)[0]
        s = s[max(0, nz[0] - 600): nz[-1] + 1200]
        lines.append({"text": text, "start": round(t - start, 3), "dur": round(len(s) / SR, 3)})
        audio.append(s); t += len(s) / SR
        pad(GAP)
    pad(sc["tail"])
    scenes.append({"id": sc["id"], "start": round(start, 3), "dur": round(t - start, 3), "lines": lines})
    print(sc["id"], round(t - start, 2))

sf.write("narration.wav", np.concatenate(audio), SR)
json.dump({"total": round(t, 3), "scenes": scenes}, open("timeline.json", "w"), indent=1)
print("total", round(t, 2))
