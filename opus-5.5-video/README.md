# Opus 5.5, Explained

A 2:54 Vox-style explainer video, produced end to end in a cloud container.

- `opus-5.5-explained.mp4`: the final 1080p30 video
- `script.json`: narration script, split into scenes
- `tts.py`: narrates each line with [Kokoro](https://github.com/thewh1teagle/kokoro-onnx) (open-source TTS) and writes `timeline.json`
- `music.py`: procedural lo-fi bed plus whoosh/pop SFX, ducked under the voice, written to `mix.wav`
- `index.html`: every scene as a deterministic web page; `render(t)` draws any moment
- `render.js`: headless Chromium screenshots each frame and pipes it into ffmpeg

Rebuild: `python3 tts.py && python3 music.py && node render.js seg 0 <frames> out.mp4`, then mux `mix.wav`.
Kokoro model files (`kokoro-v1.0.onnx`, `voices-v1.0.bin`) go in `../voices/`.
