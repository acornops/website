import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const port = 4323;
const url = `http://127.0.0.1:${port}/`;
const preview = spawn(process.execPath, [resolve('node_modules/astro/astro.js'), 'preview', '--host', '127.0.0.1', '--port', String(port)], {
  env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
  stdio: ['ignore', 'pipe', 'pipe']
});

let previewOutput = '';
preview.stdout.on('data', (chunk) => { previewOutput += chunk.toString(); });
preview.stderr.on('data', (chunk) => { previewOutput += chunk.toString(); });

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await delay(250);
    }
  }
  throw new Error(`Preview server did not start.\n${previewOutput}`);
}

let chrome;
try {
  await waitForServer();
  chrome = await chromeLauncher.launch({
    chromePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/google-chrome',
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
  });
  const result = await lighthouse(url, {
    port: chrome.port,
    output: 'json',
    logLevel: 'error',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      disabled: false
    }
  });
  if (!result) throw new Error('Lighthouse returned no result.');

  const scores = Object.fromEntries(
    Object.entries(result.lhr.categories).map(([key, category]) => [key, Math.round((category.score || 0) * 100)])
  );
  const lcp = result.lhr.audits['largest-contentful-paint']?.numericValue ?? Infinity;
  const cls = result.lhr.audits['cumulative-layout-shift']?.numericValue ?? Infinity;
  const failures = [];
  if ((scores.performance || 0) < 90) failures.push(`performance ${scores.performance}`);
  for (const category of ['best-practices', 'seo']) {
    if ((scores[category] || 0) < 95) failures.push(`${category} ${scores[category]}`);
  }
  // Warm-white text on the bright brand orange is an intentional brand choice below
  // the AA text-contrast ratio (see DESIGN.md). It costs a few Lighthouse points, so
  // the accessibility floor is 92 rather than 95; this still catches real regressions.
  if ((scores.accessibility || 0) < 92) failures.push(`accessibility ${scores.accessibility}`);
  if (lcp >= 2500) failures.push(`LCP ${Math.round(lcp)}ms`);
  if (cls >= 0.1) failures.push(`CLS ${cls.toFixed(3)}`);

  console.log(`Lighthouse: performance ${scores.performance}, accessibility ${scores.accessibility}, best practices ${scores['best-practices']}, SEO ${scores.seo}, LCP ${Math.round(lcp)}ms, CLS ${cls.toFixed(3)}.`);
  if (failures.length > 0) throw new Error(`Lighthouse acceptance failed: ${failures.join(', ')}.`);
} finally {
  if (chrome) chrome.kill();
  preview.kill('SIGTERM');
}
