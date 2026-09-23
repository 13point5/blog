import json, os, subprocess, wave
from screenplay import SCENES

VOICES = {
    "C": ("voices/en-us-lessac-medium.onnx", "0.92"),
    "N": ("voices/en-us-ryan-high.onnx", "0.95"),
}
os.makedirs("lines", exist_ok=True)
meta = []
for si, (sid, lines) in enumerate(SCENES):
    for li, (v, text) in enumerate(lines):
        out = f"lines/{si:02d}_{li:02d}.wav"
        model, ls = VOICES[v]
        if not os.path.exists(out):
            subprocess.run(["python3", "-m", "piper", "-m", model, "-f", out,
                            "--length-scale", ls, "--sentence-silence", "0.25"],
                           input=text.encode(), check=True, capture_output=True)
        with wave.open(out) as w:
            dur = w.getnframes() / w.getframerate()
            sr = w.getframerate()
        meta.append({"scene": si, "line": li, "voice": v, "file": out, "dur": dur, "sr": sr})
        print(sid, li, v, round(dur, 2))
json.dump(meta, open("lines/meta.json", "w"), indent=1)
print("total speech", sum(m["dur"] for m in meta))
