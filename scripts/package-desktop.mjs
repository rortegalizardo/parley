#!/usr/bin/env node
import { mkdtemp, cp, rm, mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { packager } from '@electron/packager';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const electron = JSON.parse(await readFile(path.join(root, 'node_modules/electron/package.json'), 'utf8'));
const stage = await mkdtemp(path.join(os.tmpdir(), 'parley-desktop-'));
try {
  const manifest = { ...pkg, scripts: {}, devDependencies: undefined };
  await writeFile(path.join(stage, 'package.json'), JSON.stringify(manifest, null, 2));
  // Explicit allowlist: no rooms, logs, credentials, git history, or test data.
  for (const item of ['desktop', 'bin', 'lib', 'ui', 'parley.mjs', 'LICENSE'])
    await cp(path.join(root, item), path.join(stage, item), { recursive: true });
  const copied = new Set();
  async function copyDependency(name, from = root) {
    // Resolve transitive packages relative to their parent, including nesting.
    let source;
    let cursor = from;
    while (true) {
      const candidate = path.join(cursor, 'node_modules', name);
      try { await readFile(path.join(candidate, 'package.json')); source = candidate; break; } catch {}
      const parent = path.dirname(cursor);
      if (parent === cursor) throw new Error(`Missing production dependency ${name}`);
      cursor = parent;
    }
    if (copied.has(source)) return;
    copied.add(source);
    const target = path.join(stage, path.relative(root, source));
    await mkdir(path.dirname(target), { recursive: true });
    await cp(source, target, { recursive: true });
    const dep = JSON.parse(await readFile(path.join(source, 'package.json'), 'utf8'));
    for (const child of Object.keys(dep.dependencies || {})) await copyDependency(child, source);
  }
  for (const name of Object.keys(pkg.dependencies || {})) await copyDependency(name);
  const outputs = await packager({ dir: stage, out: path.join(root, 'release'), name: 'Parley', platform: process.platform, arch: process.arch, electronVersion: electron.version, appVersion: pkg.version, appBundleId: 'local.parley.desktop', overwrite: true, asar: { unpack: '**/*' }, prune: false, ignore: [/\.DS_Store$/], ...(process.platform === 'darwin' ? { icon: path.join(root, 'desktop/icon.icns') } : {}) });
  console.log(`Desktop export: ${outputs[0]}`);
} finally { await rm(stage, { recursive: true, force: true }); }
