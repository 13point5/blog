# Opus 5.5 in Clay

A 1:44 stop-motion showcase: a real three.js scene made to look like hand-animated clay.

- `opus-5.5-stop-motion.mp4`: the video (1080p, 12 poses/sec shown "on twos" at 24 fps)
- `index.html`: the whole set, characters and animation. Clay comes from noise-displaced "lumpy" geometry plus a fingerprint bump map. Every object gets a tiny per-pose jitter ("boil"), and the lighting flickers slightly, like a hand-cranked shoot.
- `tts.py`: Kokoro narration, plus a 12 fps loudness envelope that drives the host's lip-sync
- `music.py`: marimba/pizzicato score plus foley (pops, plops, bonks) timed from `events.json`, which the page exports
- `render.js`: headless Chromium (WebGL via SwiftShader) renders each pose and pipes it to ffmpeg

Rebuild: `npm install && python3 tts.py && node render.js events && python3 music.py && node render.js seg 0 <poses> out.mp4`, then mux `mix.wav`.
