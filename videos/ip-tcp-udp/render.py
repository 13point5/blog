"""Render the full video: frames from index.html via headless Chromium -> ffmpeg, muxed with narration.

python render.py [--fps 30] [--workers 4] [--start S --end E] [--out build/ip-tcp-udp.mp4]
"""
import argparse, base64, json, subprocess, sys, time
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import imageio_ffmpeg

HERE = Path(__file__).parent.resolve()
BUILD = HERE / "build"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
CHROMIUM = "/opt/pw-browsers/chromium"


def render_chunk(args):
    idx, f0, f1, fps, out = args
    from playwright.sync_api import sync_playwright
    enc = subprocess.Popen([FFMPEG, "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(fps), "-c:v", "mjpeg",
                            "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
                            "-r", str(fps), str(out)], stdin=subprocess.PIPE)
    t0 = time.time()
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROMIUM, args=["--allow-file-access-from-files"])
        pg = b.new_page(viewport={"width": 1920, "height": 1080})
        pg.goto((HERE / "index.html").as_uri() + "?render")
        pg.evaluate("document.fonts.ready")
        pg.wait_for_timeout(300)
        for f in range(f0, f1):
            data = pg.evaluate(f"frameJPEG({f / fps:.5f}, 0.93)")
            enc.stdin.write(base64.b64decode(data.split(",", 1)[1]))
            if (f - f0) % 900 == 0:
                done = f - f0
                print(f"[chunk {idx}] {done}/{f1 - f0} frames, {time.time() - t0:.0f}s", flush=True)
        b.close()
    enc.stdin.close()
    enc.wait()
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--start", type=float, default=0)
    ap.add_argument("--end", type=float, default=None)
    ap.add_argument("--out", default=str(BUILD / "ip-tcp-udp.mp4"))
    a = ap.parse_args()
    dur = json.loads((BUILD / "timeline.json").read_text())["duration"]
    end = a.end or dur
    F0, F1 = int(a.start * a.fps), int(end * a.fps)
    n = a.workers
    step = (F1 - F0 + n - 1) // n
    chunks = [(i, F0 + i * step, min(F1, F0 + (i + 1) * step), a.fps, BUILD / f"chunk{i}.mp4") for i in range(n)]
    t0 = time.time()
    with ProcessPoolExecutor(n) as ex:
        outs = list(ex.map(render_chunk, chunks))
    print(f"frames done in {time.time() - t0:.0f}s")
    lst = BUILD / "chunks.txt"
    lst.write_text("".join(f"file '{o}'\n" for o in outs))
    subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst),
                    "-ss", str(a.start), "-t", str(end - a.start), "-i", str(BUILD / "narration.wav"),
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "2", "-c:a", "aac", "-b:a", "96k",
                    "-movflags", "+faststart", "-shortest", a.out], check=True)
    print("wrote", a.out)


if __name__ == "__main__":
    main()
