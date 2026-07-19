import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const baseUrl = process.env.CONSOLE_URL || 'http://127.0.0.1:4186';
const outputDirectory = resolve('public/images/proof');

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/google-chrome',
  headless: true
});

const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  colorScheme: 'light',
  reducedMotion: 'reduce',
  deviceScaleFactor: 1
});

const captureReplacements = [
  ['Ning', 'Demo Operator'],
  ['ning@fixture.acornops.dev', 'operator@example.invalid'],
  ['Singapore Production', 'Production Cluster'],
  ['AcornOps Fixture Lab', 'AcornOps Demo Workspace']
];

async function anonymizeCapture() {
  await page.evaluate((replacements) => {
    const replaceFixtureValues = (value) => {
      let nextValue = value;
      for (const [source, replacement] of replacements) nextValue = nextValue.replaceAll(source, replacement);
      return nextValue;
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      node.nodeValue = replaceFixtureValues(node.nodeValue || '');
      node = walker.nextNode();
    }
    for (const element of document.querySelectorAll('[placeholder], [aria-label], [title]')) {
      for (const attribute of ['placeholder', 'aria-label', 'title']) {
        const value = element.getAttribute(attribute);
        if (value) element.setAttribute(attribute, replaceFixtureValues(value));
      }
    }
  }, captureReplacements);
}

async function saveCapture(name) {
  await anonymizeCapture();
  const png = await page.screenshot({ animations: 'disabled', fullPage: false });
  const source = sharp(png).resize({ width: 1280, withoutEnlargement: true });
  await Promise.all([
    source.clone().avif({ quality: 52, effort: 6 }).toFile(resolve(outputDirectory, `${name}.avif`)),
    source.clone().webp({ quality: 82, effort: 6 }).toFile(resolve(outputDirectory, `${name}.webp`))
  ]);
}

try {
  await page.goto(`${baseUrl}/workspaces/fixture-workspace/overview`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.body.innerText.includes('AcornOps Fixture Lab'));
  await saveCapture('workspace-overview');

  await page.goto(`${baseUrl}/workspaces/fixture-workspace/kubernetes-clusters/fixture-cluster/chat?session=fixture-session`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.body.innerText.includes('Why is the payments worker restarting?'));
  const disclosure = page.getByRole('button', { name: /show run details/i });
  await disclosure.waitFor();
  await saveCapture('assistant-answer');
  await disclosure.click();
  await page.getByRole('button', { name: /hide run details/i }).waitFor();
  await saveCapture('run-trace');
} finally {
  await browser.close();
}
