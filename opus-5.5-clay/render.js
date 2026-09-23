// usage: node render.js stills t1,t2,... | node render.js events | node render.js seg <startPose> <endPose> <out.mp4>
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const FF = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';
const SPS = 12;
(async () => {
  const [mode, a, b, out] = process.argv.slice(2);
  const SSQ = process.env.SS || '1.5', POSTQ = process.env.POST || '1';
  const port = 8700 + Math.floor(Math.random() * 200);
  const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: __dirname, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: +SSQ }); page.setDefaultTimeout(600000);
  const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await page.goto(`http://127.0.0.1:${port}/index.html?ss=${SSQ}&post=${POSTQ}`);
  try { await page.waitForFunction(() => window.READY === true, null, { timeout: 900000 }); }
  catch (e) { console.error('not ready', errs); process.exit(1); }
  if (mode === 'events') fs.writeFileSync('events.json', JSON.stringify(await page.evaluate(() => window.EVENTS)));
  else if (mode === 'stills') {
    fs.mkdirSync('stills', { recursive: true });
    for (const t of a.split(',').map(Number)) {
      await page.evaluate(t => render(t), t);
      await page.screenshot({ path: `stills/t${t.toFixed(1).padStart(6, '0')}.jpg`, type: 'jpeg', quality: 80 });
    }
  } else {
    const ff = spawn(FF, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(SPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', '24', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = +a; f < +b; f++) {
      await page.evaluate(t => render(t), f / SPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 93, timeout: 600000 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (f % 60 === 0) console.log(out, f);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  if (errs.length) console.error(errs);
  await browser.close(); srv.kill();
})();
