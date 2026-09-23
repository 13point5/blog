# labelled contact sheets: python3 sheet.py [cols] [thumb_w]  -> sheets/sheet_XX.jpg
import sys, glob, os
from PIL import Image, ImageDraw, ImageFont
cols = int(sys.argv[1]) if len(sys.argv) > 1 else 3; tw = int(sys.argv[2]) if len(sys.argv) > 2 else 640; th = tw * 9 // 16
files = sorted(glob.glob('stills/*.jpg')); per = cols * 4
os.makedirs('sheets', exist_ok=True); [os.remove(f) for f in glob.glob('sheets/*')]
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
for s in range(0, len(files), per):
    chunk = files[s:s + per]; im = Image.new('RGB', (cols * tw, ((len(chunk) - 1) // cols + 1) * th), 'white')
    for i, f in enumerate(chunk):
        t = Image.open(f).resize((tw, th), Image.LANCZOS); im.paste(t, ((i % cols) * tw, (i // cols) * th))
        d = ImageDraw.Draw(im); lab = os.path.basename(f)[1:-4].lstrip('0') + 's'; x, y = (i % cols) * tw + 6, (i // cols) * th + 6
        d.rectangle([x, y, x + 12 * len(lab) + 8, y + 26], fill='black'); d.text((x + 4, y + 2), lab, font=font, fill='yellow')
    im.save(f'sheets/sheet_{s // per:02d}.jpg', quality=88)
print(sorted(os.listdir('sheets')))
