#!/usr/bin/env node
// Guard the driving behavior inherited from demo03. Run from the repository checkout:
// node demo04/tools/check-parity.mjs
// Requires the adjacent demo03 source tree; no npm dependencies or API calls.
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const referenceRoot = new URL('../../demo03/', import.meta.url);
const editionRoot = new URL('../', import.meta.url);
const failures = [];
let checked = 0;

async function filesUnder(root, directory) {
  const entries = await readdir(new URL(`${directory}/`, root), { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await filesUnder(root, path));
    else if (entry.isFile()) files.push(path);
    else throw new Error(`Unexpected non-regular file: ${path}`);
  }
  return files;
}

const digest = bytes => createHash('sha256').update(bytes).digest('hex').slice(0, 12);
async function compare(path) {
  const [reference, edition] = await Promise.all([
    readFile(new URL(path, referenceRoot)),
    readFile(new URL(path, editionRoot))
  ]);
  checked++;
  if (reference.equals(edition)) return;
  // Permit only the one human-readable startup label to identify demo04.
  // The rest of server.mjs, including routes, prompts and validation, must match.
  if (path === 'server.mjs') {
    const label03 = 'console.log(`Jev Drives (demo03) listening on ${port}`)';
    const label04 = 'console.log(`Jev Drives (demo04) listening on ${port}`)';
    const source = reference.toString('utf8');
    if (source.split(label03).length === 2 && edition.equals(Buffer.from(source.replace(label03, label04)))) return;
  }
  failures.push(`${path}: changed (demo03 ${digest(reference)}, demo04 ${digest(edition)})`);
}

try {
  const paths = ['questions.mjs', 'schema.mjs', 'server.mjs', 'tools/probe.mjs'];
  for (const directory of ['sim', 'tests']) {
    const [reference, edition] = await Promise.all([
      filesUnder(referenceRoot, directory), filesUnder(editionRoot, directory)
    ]);
    const expected = new Set(reference), actual = new Set(edition);
    for (const path of reference) {
      if (!actual.has(path)) failures.push(`${path}: missing from demo04`);
      else paths.push(path);
    }
    for (const path of edition) if (!expected.has(path)) failures.push(`${path}: added to demo04`);
  }
  for (const path of paths) await compare(path);
  // The renderer may change, but the browser's API and simulation clocks must not.
  const [referenceApp, editionApp] = await Promise.all([
    readFile(new URL('public/app.mjs', referenceRoot), 'utf8'),
    readFile(new URL('public/app.mjs', editionRoot), 'utf8')
  ]);
  for (const [start, end] of [
    ['async function decide()', 'let last = performance.now()'],
    ['function frame(now)', 'function postedLimit()']
  ]) {
    const block = source => {
      const from = source.indexOf(start), to = source.indexOf(end, from);
      if (from < 0 || to < 0) throw new Error(`Missing browser loop boundary: ${start}`);
      return source.slice(from, to).trim();
    };
    if (block(referenceApp) !== block(editionApp)) failures.push(`public/app.mjs: ${start} differs from demo03`);
  }
} catch (error) {
  failures.push(error.message);
}

if (failures.length) {
  console.error(`Driving parity FAILED (${checked} files checked):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Driving parity passed: ${checked} files match demo03; only the server startup label may differ.`);
  console.log('Covered: all simulation files, questions, schema, server, all tests/fixtures, and the headless probe.');
  console.log('Browser decision-request and simulation-frame loops also match demo03 exactly.');
}
