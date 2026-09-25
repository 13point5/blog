"""Compose QA stills into 2x2 contact sheets: python sheet.py name spec1 spec2 spec3 spec4"""
import subprocess, sys
from PIL import Image, ImageDraw
name, specs = sys.argv[1], sys.argv[2:]
subprocess.run([sys.executable, "stills.py", *specs], check=True, stdout=subprocess.DEVNULL)
ims = [Image.open(f"build/stills/{s.replace(':','_')}.jpg").resize((960, 540)) for s in specs]
sheet = Image.new("RGB", (1920, 540 * ((len(ims) + 1) // 2)), "black")
d = ImageDraw.Draw(sheet)
for i, im in enumerate(ims):
    x, y = (i % 2) * 960, (i // 2) * 540
    sheet.paste(im, (x, y)); d.text((x + 8, y + 8), specs[i], fill="yellow")
sheet.save(f"build/stills/sheet_{name}.jpg", quality=88)
print(f"build/stills/sheet_{name}.jpg")
