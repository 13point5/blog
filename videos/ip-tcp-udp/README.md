# IP, TCP and UDP — how they actually work (video)

A ~16 minute narrated explainer: IP addressing and routing, ports, UDP, TCP
(handshake, sequence numbers, ACKs, retransmission, flow/congestion control),
what an "established" TCP connection physically is (a `tcp_sock` record in each
kernel, keyed by the 4-tuple), what keeps it "alive" (nothing: plus keepalive,
NAT timeouts and heartbeats, RST on half-open connections), and five real
problems solved both ways (video call, multiplayer game, file download, DNS,
movie streaming), ending with QUIC / HTTP/3.

Output: `ip-tcp-udp.mp4` (1080p30, H.264 + AAC).

## How it's made

| file | what |
| --- | --- |
| `script.py` | narration, one list of lines per scene (caption text + spoken spelling) |
| `tts.py` | runs [Kokoro-82M](https://github.com/hexgrad/kokoro) (ONNX build via [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx), voice `af_heart`) per line, writes `build/narration.wav` and `build/timeline.json` with each line's start/end |
| `index.html`, `lib.js`, `scenes_*.js` | canvas animation; every frame is a pure function of time, and scenes sync to the narration via the timeline |
| `render.py` | renders frames in headless Chromium (4 parallel workers), pipes them to ffmpeg, muxes the narration |
| `stills.py`, `sheet.py` | QA helpers: render individual frames / 2×2 contact sheets |

```sh
pip install kokoro-onnx soundfile imageio-ffmpeg playwright pillow
mkdir -p models && cd models
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
cd ..
python tts.py                 # narration + timeline
python render.py              # -> build/ip-tcp-udp.mp4
```

Open `index.html` (after `tts.py`) in a browser to scrub through the animation with audio.
`render.py` expects Chromium at `/opt/pw-browsers/chromium`; change `CHROMIUM` if yours is elsewhere.
