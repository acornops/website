import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const assetDirectory = resolve('dist/_astro');
const assets = await readdir(assetDirectory);
const scripts = assets.filter((asset) => asset.endsWith('.js'));
let total = 0;

for (const script of scripts) {
  total += gzipSync(await readFile(resolve(assetDirectory, script))).byteLength;
}

const limit = 140 * 1024;
if (total > limit) {
  throw new Error(`Initial JavaScript is ${(total / 1024).toFixed(1)} KiB gzip, above the 140 KiB budget.`);
}

console.log(`Initial JavaScript: ${(total / 1024).toFixed(1)} KiB gzip of 140 KiB.`);
