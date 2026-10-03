// node render.js <index|id> [--stills t1,t2,...] [--out dir]
// Renders a storyboard from specs.js frame by frame (each frame is a pure function of time)
// and pipes JPEG frames into ffmpeg. Audio is muxed later by mux.sh.
const path = require('path'), fs = require('fs'), { spawn } = require('child_process');
const { chromium } = require(process.env.PW || 'playwright-core');
const specs = require(process.env.SPECS || './specs.js');
const FPS = 30;

(async () => {
  const arg = process.argv[2];
  const spec = specs.find((s, i) => s.id === arg || String(i + 1) === arg);
  const stillsArg = process.argv.indexOf('--stills');
  const stills = stillsArg > 0 ? process.argv[stillsArg + 1].split(',').map(Number) : null;
  const outDir = path.resolve(__dirname, '../out', spec.id);
  fs.mkdirSync(outDir, { recursive: true });

  const exe = fs.readdirSync(process.env.HOME + '/Library/Caches/ms-playwright').find(d => d.startsWith('chromium-'));
  const browser = await chromium.launch({ executablePath: `${process.env.HOME}/Library/Caches/ms-playwright/${exe}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing` });
  const page = await browser.newPage({ viewport: { width: spec.W, height: spec.H }, deviceScaleFactor: 1 });
  await page.addInitScript(s => { window.__SPEC = s; }, spec);
  await page.goto('file://' + path.join(__dirname, 'engine.html'));
  const total = await page.evaluate(() => window.__ready);
  const shot = async (t, opts = {}) => { await page.evaluate(t => window.render(t), t); return page.screenshot({ type: 'jpeg', quality: 94, ...opts }); };

  if (stills) {
    const dir = path.join(outDir, 'work', 'stills'); fs.mkdirSync(dir, { recursive: true });
    for (const t of stills) await shot(t, { path: path.join(dir, `t${t.toFixed(2)}.jpg`) });
    console.log('stills', dir); await browser.close(); return;
  }

  // poster: strongest settled frame, also baked in as frame 0
  const poster = await shot(spec.poster, { path: path.join(outDir, 'brag.jpg') });
  const n = Math.round(total * FPS);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(outDir, 'work', 'video.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  fs.mkdirSync(path.join(outDir, 'work'), { recursive: true });
  for (let f = 0; f < n; f++) {
    const buf = f === 0 ? poster : await shot(f / FPS);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 150 === 0) process.stdout.write(`${spec.id} ${f}/${n}\n`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  fs.writeFileSync(path.join(outDir, 'work', 'timing.json'), JSON.stringify({ total, fps: FPS, scenes: spec.scenes.map(s => ({ type: s.type, dur: s.dur })) }));
  console.log('done', spec.id, total.toFixed(2) + 's');
  await browser.close();
})();
