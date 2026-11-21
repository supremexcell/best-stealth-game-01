// Hand-in program for the "Galeri Senja" entry (Node 22, standard library
// only). It takes the game and screenshots that sit beside this file and
// writes them to the output directory the grader reads, together with the
// dossier the judge reads — the summary built by the vendored make.fun
// library from the files themselves.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Both runs must write byte-identical output, so nothing here depends on
// the clock, the environment, or the order files happen to be listed in.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

// Every file under a directory, as paths relative to it, in sorted order.
function listFiles(dir, base = dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...listFiles(full, base));
    else if (entry.isFile()) found.push(full.slice(base.length + 1));
  }
  return found.sort();
}

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Byte-verify the copy before the dossier is built: every file the grader
// will read must be byte-identical to the file beside this program, so a
// truncated or partial copy fails loudly here instead of silently reaching
// the judge with a broken game or a missing screenshot.
for (const rel of listFiles(join(repoRoot, 'game'))) {
  const src = join(repoRoot, 'game', rel);
  const dst = join(outputDir, 'game', rel);
  if (!existsSync(dst) || sha256(src) !== sha256(dst)) {
    throw new Error(`copy mismatch: game/${rel} did not copy byte-identically`);
  }
}
for (const rel of listFiles(join(repoRoot, 'screenshots'))) {
  const src = join(repoRoot, 'screenshots', rel);
  const dst = join(outputDir, 'screenshots', rel);
  if (!existsSync(dst) || sha256(src) !== sha256(dst)) {
    throw new Error(`copy mismatch: screenshots/${rel} did not copy byte-identically`);
  }
}

// The scorer's caps, from the kit's reference/gate.json: text_max_bytes is
// the only one that shapes the dossier's bytes; the rest refuse an entry
// the scorer would refuse anyway (more than 4 screenshots, or one over
// 256 KiB; game/ over 993 files or 48 MiB in all, or a path under game/
// over 1000 bytes; game/ shares /output's own 1000-entry cap with
// screenshots/ and dossier.json).
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// The dossier is the judge's only read of the source outline, so confirm
// it landed and is non-empty before this program reports success.
const dossierPath = join(outputDir, 'dossier.json');
if (!existsSync(dossierPath) || statSync(dossierPath).size === 0) {
  throw new Error('dossier.json was not written');
}
console.log(`Wrote ${dossierPath}`);
