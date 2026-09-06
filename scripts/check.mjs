import { readFile } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

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
  const source = await readFile(file, 'utf8');
  try {
    if (file.endsWith('.cjs')) new vm.Script(source, { filename: file });
    else if (file.endsWith('.mjs')) new vm.SourceTextModule(source, { identifier: file });
    else new vm.Script(source, { filename: file });
  } catch (error) {
    throw new Error(`Syntax error in ${path.relative(root, file)}: ${error.message}`);
  }
}
console.log(`Syntax check passed for ${files.length} JavaScript files.`);
