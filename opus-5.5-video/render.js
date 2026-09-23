// usage: node render.js stills t1,t2,...   |   node render.js seg <startFrame> <endFrame> <out.mp4>
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const FF = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';
const FPS = 30;

(async () => {
  const [mode, a, b, out] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await page.goto('file://' + __dirname + '/index.html');
  await page.evaluate(() => document.fonts.ready);
  if (errs.length) { console.error(errs); process.exit(1); }
  if (mode === 'stills') {
    fs.mkdirSync('stills', { recursive: true });
    for (const t of a.split(',').map(Number)) {
      await page.evaluate(t => render(t), t);
      await page.screenshot({ path: `stills/t${t.toFixed(1).padStart(6, '0')}.jpg`, type: 'jpeg', quality: 80 });
    }
  } else {
    const ff = spawn(FF, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = +a; f < +b; f++) {
      await page.evaluate(t => render(t), f / FPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (f % 300 === 0) console.log(out, f);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
  }
  if (errs.length) console.error(errs);
  await browser.close();
})();
