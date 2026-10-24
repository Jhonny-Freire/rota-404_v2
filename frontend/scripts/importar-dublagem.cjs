// Importa a dublagem do Bonzi para o site: lê o _indice.csv (pasta;arquivo;fala), acha cada mp3, copia para
// public/audio/bonzi/<grupo>/<nn>.mp3 e gera config/bonziVoice.ts.
// uso (na pasta frontend):  node scripts/importar-dublagem.cjs "<pasta com _indice.csv>" . --add
//   --add   lote novo POR CIMA do atual (mantém as gravações que já existem; é o modo normal)
//   --write substitui TUDO pela pasta indicada (apaga public/audio/bonzi antes)
//   sem opção: só confere (mostra linhas sem arquivo e mp3 fora do índice), sem gravar nada
const fs = require("fs");
const path = require("path");
const [SRC, FRONT, mode] = process.argv.slice(2);
const add = mode === "--add";
const write = mode === "--write" || add;

const strip = (s) => s.normalize("NFC").replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
const slug = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// todos os mp3 da dublagem, por pasta (só letras e números) + nome do arquivo
const files = new Map();
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".mp3") && !entry.name.startsWith("_")) {
      const folder = path.relative(SRC, dir).split(path.sep).join("/");
      files.set(`${strip(folder)}|${entry.name.normalize("NFC")}`, full);
    }
  }
};
walk(SRC);

const csv = fs.readFileSync(path.join(SRC, "_indice.csv"), "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
// CSV com ";" e campos entre aspas ("" = aspas dentro do campo)
function parseLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') (cell += '"'), i++;
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell === "") quoted = true;
    else if (c === ";") cells.push(cell), (cell = "");
    else cell += c;
  }
  cells.push(cell);
  return cells;
}
const rows = csv.slice(1).map((line) => {
  const [folder, file, ...rest] = parseLine(line);
  return { folder, file: file.normalize("NFC"), text: rest.join(";").trim() };
});

function groupSlug(folder) {
  const parts = folder.split(" / ");
  const last = parts[parts.length - 1];
  const g = /Internet e Web/.test(parts[0]) ? "g1" : /API REST/.test(parts[0]) ? "g2" : null;
  const code = last.match(/^(\d)\.(\d)\b/);
  if (g && code) return `${g}-${code[1]}-${code[2]}`;
  if (g) return `${g}-${slug(last)}`;
  if (/^Telas do site/.test(folder)) return `tela-${slug(parts.slice(1).join(" "))}`;
  return `comum-${slug(path.basename(last).replace(/\.tsx?$/, ""))}`;
}

const missing = [];
const entries = [];
// --add: as falas já gravadas continuam; texto já gravado não é trocado; nomes novos não colidem com os antigos
const configPath = path.join(FRONT, "config/bonziVoice.ts");
const previous = add
  ? [...fs.readFileSync(configPath, "utf8").matchAll(/^ {2}\[("(?:[^"\\]|\\.)*"), ("[^"]+")\],$/gm)].map((m) => ({
      text: JSON.parse(m[1]),
      rel: JSON.parse(m[2]),
    }))
  : [];
const takenRel = new Set(previous.map((p) => p.rel));
const knownText = new Set(previous.map((p) => p.text));
const seen = new Map();
for (const row of rows) {
  const src = files.get(`${strip(row.folder)}|${row.file}`);
  if (!src) {
    missing.push(row);
    continue;
  }
  const key = row.text;
  if (seen.has(key)) continue;
  const group = groupSlug(row.folder);
  const number = row.file.match(/^(\d+)/)?.[1] ?? String(entries.length + 1);
  if (knownText.has(key)) continue;
  let rel = `${group}/${number}.mp3`;
  for (let n = 2; takenRel.has(rel); n++) rel = `${group}/${number}-${n}.mp3`;
  takenRel.add(rel);
  seen.set(key, rel);
  entries.push({ text: row.text, rel, src });
}
const used = new Set(rows.map((r) => `${strip(r.folder)}|${r.file}`));
const orphan = [...files.keys()].filter((k) => !used.has(k));
console.log(`linhas: ${rows.length}, com arquivo: ${rows.length - missing.length}, textos únicos: ${entries.length}`);
console.log("sem arquivo:", missing.map((m) => `${m.folder} :: ${m.file}`));
console.log("mp3 fora do índice:", orphan);
const rels = new Set(entries.map((e) => e.rel));
if (rels.size !== entries.length) throw new Error("caminho repetido");

if (write) {
  const out = path.join(FRONT, "public/audio/bonzi");
  if (!add) fs.rmSync(out, { recursive: true, force: true });
  for (const e of entries) {
    fs.mkdirSync(path.dirname(path.join(out, e.rel)), { recursive: true });
    fs.copyFileSync(e.src, path.join(out, e.rel));
  }
  const body = [...previous, ...entries].map((e) => `  [${JSON.stringify(e.text)}, ${JSON.stringify(e.rel)}],`).join("\n");
  fs.writeFileSync(
    path.join(FRONT, "config/bonziVoice.ts"),
    `/**
 * Dublagem do Bonzi (23/10/2026): cada fala gravada → arquivo em public/audio/bonzi/.
 * O narrationService toca a gravação quando o texto falado é igual a uma destas falas (sem diferenciar maiúsculas,
 * aspas e espaços); fala sem gravação (com trecho que muda, como o IP sorteado) usa a voz do navegador.
 * Para regravar uma fala, substitua o mp3 com o mesmo nome. Fala nova: grave, copie e acrescente a linha aqui.
 */
export const BONZI_VOICE_DIR = "/audio/bonzi";

export const BONZI_VOICE: ReadonlyArray<readonly [text: string, file: string]> = [
${body}
];
`,
  );
  console.log("copiados:", entries.length);
}
