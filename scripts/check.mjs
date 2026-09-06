import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(new URL('.', import.meta.url).pathname, '..');
const roots = ['electron', 'renderer', 'shared', 'scripts'];
const extensions = new Set(['.js', '.cjs', '.mjs']);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (extensions.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

const files = (await Promise.all(roots.map((name) => walk(path.join(root, name))))).flat();
for (const file of files) {
  try { execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }); }
  catch (error) {
    const detail = error?.stderr?.toString?.().trim() || error?.message || 'unknown syntax error';
    throw new Error(`Syntax error in ${path.relative(root, file)}: ${detail}`);
  }
}
const required = ['electron/main.cjs','electron/preload.cjs','renderer/index.html','renderer/app.js','renderer/styles.css','shared/memory.cjs'];
for (const relative of required) await readFile(path.join(root, relative));
console.log(`Repository check passed: ${files.length} JavaScript files parsed and ${required.length} core files present.`);
