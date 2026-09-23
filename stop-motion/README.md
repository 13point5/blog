# Claude: A Stop-Motion Tale

A 4-minute paper-and-clay style stop-motion video (12 fps, shot "on twos") about Claude, covering:

1. **Agentic Misalignment in Summer 2026** (Anthropic Alignment Science, July 13, 2026)
2. **"We Must Pace the Frontier"** (Dario Amodei, Sept 12, 2026)
3. **Claude Opus 5.5 release** (Sept 22, 2026)

Everything is generated procedurally: Pillow draws the frames, Piper TTS (offline) provides the voices, and numpy synthesizes the music and sound effects.

## Rebuild

```sh
pip install pillow numpy imageio-ffmpeg piper-tts
# Piper voices (en-us-lessac-medium, en-us-ryan-high) from github.com/rhasspy/piper releases v0.0.2 -> ./voices
# Fonts: fonts-comic-neue, fonts-leckerli-one, fonts-tomsontalks (apt)
python3 tts.py      # voice lines -> lines/
python3 render.py   # -> claude_stop_motion.mp4
python3 render.py 12 50 100   # preview stills at given seconds
```
