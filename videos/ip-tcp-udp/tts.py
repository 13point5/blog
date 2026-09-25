"""Generate narration with Kokoro-82M and write build/narration.wav + build/timeline.json.

Uses the ONNX export of Kokoro (github.com/thewh1teagle/kokoro-onnx). Model
files are expected in $KOKORO_DIR (default: ./models):
  kokoro-v1.0.onnx, voices-v1.0.bin
"""

import hashlib
import json
import os
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

from script import SCENES, lines

HERE = Path(__file__).parent
BUILD = HERE / "build"
CACHE = BUILD / "tts"
MODELS = Path(os.environ.get("KOKORO_DIR", HERE / "models"))
VOICE = os.environ.get("VOICE", "af_heart")
SPEED = float(os.environ.get("SPEED", "1.0"))

LEAD_IN = 1.2      # silence before the first line
LINE_GAP = 0.45    # between lines in a scene
SCENE_GAP = 1.1    # extra breathing room between scenes
TAIL = 2.5
# Some scenes need extra time for their animation to finish after the last line.
SCENE_PAD = {"intro": 0.6, "handshake": 0.8, "reliable": 1.0, "usecases": 0.8,
             "call": 1.0, "decide": 1.2, "recap": 1.5}


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    kokoro = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
    sr = 24000
    chunks, t = [np.zeros(int(LEAD_IN * sr), dtype=np.float32)], LEAD_IN
    timeline = []
    for scene in SCENES:
        sid = scene[0]
        s_start = t
        cues = []
        for i, (caption, say) in enumerate(lines(scene)):
            key = hashlib.sha1(f"{VOICE}|{SPEED}|{say}".encode()).hexdigest()[:16]
            wav = CACHE / f"{key}.wav"
            if not wav.exists():
                samples, sr = kokoro.create(say, voice=VOICE, speed=SPEED, lang="en-us")
                sf.write(wav, samples, sr)
            samples, sr = sf.read(wav, dtype="float32")
            dur = len(samples) / sr
            cues.append({"start": round(t - s_start, 3), "end": round(t - s_start + dur, 3), "text": caption, "say": say})
            chunks.append(samples)
            t += dur
            gap = LINE_GAP if i < len(scene[1]) - 1 else SCENE_GAP + SCENE_PAD.get(sid, 0)
            chunks.append(np.zeros(int(gap * sr), dtype=np.float32))
            t += gap
            print(f"{sid:12s} {i:2d} {dur:6.2f}s  {caption[:60]}")
        timeline.append({"id": sid, "start": round(s_start, 3), "end": round(t, 3), "cues": cues})
    chunks.append(np.zeros(int(TAIL * sr), dtype=np.float32))
    t += TAIL
    audio = np.concatenate(chunks)
    sf.write(BUILD / "narration.wav", audio, sr)
    (BUILD / "timeline.json").write_text(json.dumps({"duration": round(t, 3), "scenes": timeline}, indent=1))
    (BUILD / "timeline.js").write_text("window.TIMELINE = " + json.dumps({"duration": round(t, 3), "scenes": timeline}) + ";\n")
    print(f"total {t/60:.1f} min")


if __name__ == "__main__":
    main()
