import { access, readFile, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';

async function collectHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtml(path));
    else if (entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

function targetPath(value, htmlFile) {
  const clean = value.split('#')[0]?.split('?')[0] || '';
  if (!clean) return null;
  const relative = clean.startsWith('/')
    ? resolve('dist', `.${clean}`)
    : resolve(dirname(htmlFile), clean);
  if (extname(relative)) return relative;
  return relative.endsWith('/') ? resolve(relative, 'index.html') : resolve(relative, 'index.html');
}

const failures = [];
for (const htmlFile of await collectHtml(resolve('dist'))) {
  const html = await readFile(htmlFile, 'utf8');
  const ids = new Set([...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]));
  const values = [...html.matchAll(/\s(?:href|src|srcset)=["']([^"']+)["']/g)].map((match) => match[1]);
  for (const rawValue of values) {
    const value = rawValue.trim().split(/\s+/)[0] || '';
    if (/^(https?:|mailto:|tel:|data:)/.test(value)) {
      try { new URL(value); } catch { failures.push(`${htmlFile}: invalid external URL ${value}`); }
      continue;
    }
    if (value.startsWith('#')) {
      if (!ids.has(value.slice(1))) failures.push(`${htmlFile}: missing fragment ${value}`);
      continue;
    }
    const path = targetPath(value, htmlFile);
    if (!path) continue;
    try { await access(path, constants.F_OK); } catch { failures.push(`${htmlFile}: missing ${value}`); }
  }
}

if (failures.length > 0) throw new Error(failures.join('\n'));
console.log('All rendered internal links and assets resolve; external URLs are syntactically valid.');
