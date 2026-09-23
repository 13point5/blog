# Opus 5.5 in Clay (v2)

A 2:52 stop-motion-style showcase, rendered in three.js: 3D modeling, procedural worlds, physics, code, data, music, languages, agentic problem-solving, and a "making of my voice" scene.

- The full-quality master (1080p, 12 poses per second shown on twos at 24 fps, 401 MB) is too large for a normal Git file, so it isn't committed here.
- `index.html`: every set, character and animation. Clay is noise-displaced geometry with a fingerprint bump map, finished with ambient occlusion, bloom, tilt-shift depth of field, stop-motion "boil", iris wipes and film grain.
- `script.json`: the narration. The languages scene uses Kokoro's native voices (es, fr, it, pt-br, hi, ja); the Japanese line is fed as hand-corrected phonemes.
- `tts.py`: narration plus a 12 fps mouth envelope for the host's lip-sync
- `compose.py`: the score as data (`notes.json`). The same notes drive the audio and the clay marimba's mallets.
- `mix.py`: synthesizes the score, adds foley from `events.json` (exported by the page), ducks under the voice, then loudness-normalizes to -16 LUFS
- `render.js`: headless Chromium (WebGL through SwiftShader) renders each pose and pipes it to ffmpeg. `qa.sh` and `sheet.py` build labelled QA contact sheets.
