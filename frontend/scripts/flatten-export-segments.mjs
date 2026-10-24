// Pós-build do site estático (STATIC_EXPORT=1): o Next grava os segmentos de prefetch em pastas
// (__next.galaxias/$d$galaxySlug/__PAGE__.txt), mas o navegador os pede com pontos
// (__next.galaxias.$d$galaxySlug.__PAGE__.txt). Sem a cópia, cada prefetch dá 404 e a navegação fica mais lenta.
import { copyFileSync, readdirSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "out");
const SEGMENT_DIR = "__next.";

function filesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(full) : [full];
  });
}

let copied = 0;
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (!entry.name.startsWith(SEGMENT_DIR)) {
      walk(full);
      continue;
    }
    for (const file of filesUnder(full)) {
      const flat = [entry.name, ...path.relative(full, file).split(path.sep)].join(".");
      copyFileSync(file, path.join(dir, flat));
      copied += 1;
    }
  }
}

walk(OUT_DIR);
console.log(`Segmentos de prefetch copiados: ${copied}`);
