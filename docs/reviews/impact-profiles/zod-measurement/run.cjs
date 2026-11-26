// Usage: node run.cjs <case,case,...> [--guarded | --message]
// Loads dist/ in Chromium and reports parse time and the memory each failed result keeps.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const dist = path.join(__dirname, 'dist');
const names = (process.argv[2] || 'lexicon,protectedResource,authServer,didDocument,didServices').split(',');
const mode = process.argv[3] || '';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.route('http://bench.local/**', (route) => {
    const p = new URL(route.request().url()).pathname;
    const file = path.join(dist, p === '/' ? 'index.html' : p);
    route.fulfill({ body: fs.readFileSync(file), contentType: file.endsWith('.js') ? 'text/javascript' : 'text/html' });
  });
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  await page.goto('http://bench.local/');
  await page.waitForFunction(() => typeof window.run === 'function');
  if (mode === '--message') await page.evaluate(() => { window.withMessage = true; });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('HeapProfiler.enable');
  for (const name of names) {
    for (let rep = 0; rep < 2; rep++) {
      await page.evaluate(() => window.clear());
      await cdp.send('HeapProfiler.collectGarbage');
      const before = (await cdp.send('Runtime.getHeapUsage')).usedSize;
      const res = await page.evaluate(([n, guarded]) => guarded ? window.runGuarded(n) : window.run(n), [name, mode === '--guarded']);
      await cdp.send('HeapProfiler.collectGarbage');
      const after = (await cdp.send('Runtime.getHeapUsage')).usedSize;
      console.log(name, rep, JSON.stringify(res), 'retainedMB', ((after - before) / 1048576).toFixed(1));
    }
  }
  await browser.close();
})();
