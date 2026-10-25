import { mkdir, rm, readdir, copyFile, open, writeFile, access } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist');
const site = join(root, 'site', 'index.html');

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await copyFile(site, join(out, 'index.html'));

const catalog = [];
const seen = new Set();

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}
async function head(path) {
  const file = await open(path, 'r');
  try {
    const buffer = Buffer.alloc(8192);
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
    return buffer.toString('utf8', 0, bytesRead);
  } finally { await file.close(); }
}
function field(text, name) {
  const match = text.match(new RegExp('^' + name + ':\\s*(.+)$', 'm'));
  if (!match) return '';
  let val = match[1].trim();
  if (val.startsWith('"') && val.endsWith('"')) {
    try { val = JSON.parse(val); } catch { val = val.slice(1, -1).replace(/\\\"/g, '"'); }
  } else if (val.startsWith("'") && val.endsWith("'")) {
    val = val.slice(1, -1);
  }
  return val;
}
function clean(s) { return String(s ?? '').replace(/\\s+/g, ' ').trim().slice(0, 280); }
async function add(path, category, label) {
  if (seen.has(path) || !path.endsWith('.md')) return;
  const full = join(root, path);
  if (!(await exists(full))) return;
  seen.add(path);
  let front = '';
  try { front = await head(full); } catch { return; }
  const metadata = front.startsWith('---') ? front.split(/\n---\s*\n/, 2)[0] : front;
  const title = clean(label || field(metadata, 'titulo') || path.split('/').at(-1).replace(/\.md$/, '').replace(/-/g, ' '));
  const subtitle = clean(field(metadata, 'ementa') || field(metadata, 'tipo') || (category === 'amazonas' ? 'Legislação do Amazonas' : 'Legislação federal'));
  const number = clean(field(metadata, 'numero'));
  const year = path.match(/\/(18|19|20)\d{2}\//)?.[0].replaceAll('/', '') || '';
  catalog.push({ id: path, title, subtitle, cat: category, path, number, year, glyph: category === 'constitucional' ? '⚖' : '§' });
}
async function collect(folder, category, limit) {
  const dir = join(root, folder);
  if (!(await exists(dir))) return;
  const entries = (await readdir(dir)).filter(f => f.endsWith('.md')).sort().reverse().slice(0, limit);
  for (const file of entries) await add(folder + '/' + file, category);
}

await add('constituicao.md', 'constitucional', 'Constituição Federal de 1988');
await add('estaduais/AM/constituicao/2018/constituicao-do-estado-1-2018-id10048.md', 'amazonas', 'Constituição do Estado do Amazonas');

const codes = [
  ['federal/decretos-lei/1940/del-2848-1940-12-07.md', 'Código Penal'],
  ['federal/decretos-lei/1941/del-3689-1941-10-03.md', 'Código de Processo Penal'],
  ['federal/decretos-lei/1969/del-1001-1969-10-21.md', 'Código Penal Militar'],
  ['federal/decretos-lei/1969/del-1002-1969-10-21.md', 'Código de Processo Penal Militar']
];
for (const [path, label] of codes) await add(path, 'federal', label);

const landmark = {
  1984: [7210],
  1990: [8069, 8078],
  1995: [9099],
  1997: [9503],
  2002: [10406],
  2006: [11340, 11343],
  2013: [12850],
  2015: [13105],
  2019: [13869, 13964],
  2021: [14133]
};
for (const [year, numbers] of Object.entries(landmark)) {
  const folder = 'federal/leis-ordinarias/' + year;
  if (!(await exists(join(root, folder)))) continue;
  const entries = await readdir(join(root, folder));
  for (const number of numbers) {
    const name = entries.find(f => f.startsWith('lei-' + number + '-' + year + '-') && f.endsWith('.md'));
    if (name) await add(folder + '/' + name, 'federal');
  }
}
const federalYears = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2015, 2013, 2011, 2006, 2002, 1997, 1995, 1990];
for (const year of federalYears) await collect('federal/leis-ordinarias/' + year, 'federal', 120);
for (const year of [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019]) await collect('federal/leis-complementares/' + year, 'federal', 30);
for (const year of [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015]) await collect('estaduais/AM/leis-ordinarias/' + year, 'amazonas', 90);

await writeFile(join(out, 'catalogo.json'), JSON.stringify(catalog), 'utf8');
console.log('DireitoMobile: build concluído. ' + catalog.length + ' normas no catálogo parcial.');
console.log('Saída: dist/index.html e dist/catalogo.json');
