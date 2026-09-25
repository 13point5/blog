"""Render still frames for QA: python stills.py scene:offset ... (or absolute seconds)."""
import base64, json, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

HERE = Path(__file__).parent.resolve()
OUT = HERE / "build" / "stills"
tl = json.loads((HERE / "build/timeline.json").read_text())
starts = {s["id"]: s["start"] for s in tl["scenes"]}

def to_t(spec):
    if ":" in spec:
        sid, off = spec.split(":")
        return starts[sid] + float(off)
    return float(spec)

OUT.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--allow-file-access-from-files"])
    pg = b.new_page(viewport={"width": 1920, "height": 1080})
    logs = []
    pg.on("console", lambda m: logs.append(m.text))
    pg.on("pageerror", lambda e: logs.append("ERROR " + str(e)))
    pg.goto((HERE / "index.html").as_uri() + "?render")
    pg.evaluate("document.fonts.ready")
    pg.wait_for_timeout(300)
    for spec in sys.argv[1:]:
        t = to_t(spec)
        data = pg.evaluate(f"frameJPEG({t}, 0.9)")
        fn = OUT / (spec.replace(":", "_") + ".jpg")
        fn.write_bytes(base64.b64decode(data.split(",")[1]))
        print(fn)
    for l in sorted(set(logs)): print("LOG", l, file=sys.stderr)
    b.close()
