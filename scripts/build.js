import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const entry = 'Solsolbaram_Jump_obstacle_names.html';

// Native browser modules need no bundling or third-party build dependencies.
await mkdir(output, { recursive: true });
for (const item of ['src', 'styles', 'assets', entry]) {
  await cp(path.join(root, item), path.join(output, item), { recursive: true });
}
await writeFile(path.join(output, 'index.html'), await readFile(path.join(root, entry)));
console.log('Build complete: dist/ (index.html and original HTML entry)');
