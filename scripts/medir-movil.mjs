// Mide el rendimiento en móvil con Lighthouse 12 y escribe una tabla Markdown con la mediana de N corridas por página.
// Ver docs/medicion-movil.md.
//
// Uso (con el sitio ya levantado, p. ej. `npm run build && npm start`):
//   node scripts/medir-movil.mjs [--base=http://localhost:3000] [--paginas=/,/servicios,/solicitar] [--corridas=3] [--etiqueta=base]
//
// Variables: CHROME_PATH = ruta del ejecutable de Chrome/Chromium (si Lighthouse no lo encuentra solo).
// Lighthouse usa por defecto el perfil móvil: Moto G Power emulado, red 4G lenta simulada y CPU 4x más lenta.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const arg = (name, fallback) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=') ?? fallback;
const base = arg('base', 'http://localhost:3000').replace(/\/$/, '');
const paginas = arg('paginas', '/,/servicios,/solicitar').split(',');
const corridas = Number(arg('corridas', 3));
const etiqueta = arg('etiqueta', 'medicion');
const out = join(tmpdir(), 'fisc-medir-movil');
mkdirSync(out, { recursive: true });

const mediana = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const kb = (n) => `${Math.round(n / 1024)} kB`;
const sec = (ms) => `${(ms / 1000).toFixed(1)} s`;

function corrida(pagina, i) {
  const archivo = join(out, `${etiqueta}-${pagina.replace(/\W+/g, '_') || 'home'}-${i}.json`);
  const r = spawnSync(
    'npx',
    ['--yes', 'lighthouse@12', base + pagina, '--quiet', '--only-categories=performance', '--output=json', `--output-path=${archivo}`,
      '--chrome-flags=--headless=new --no-sandbox'],
    { stdio: ['ignore', 'ignore', 'inherit'], shell: process.platform === 'win32', env: process.env },
  );
  if (r.status !== 0) throw new Error(`Lighthouse falló en ${pagina} (corrida ${i})`);
  const j = JSON.parse(readFileSync(archivo, 'utf8'));
  const a = j.audits;
  const reqs = a['network-requests'].details.items;
  const suma = (tipo) => reqs.filter((x) => x.resourceType === tipo).reduce((s, x) => s + x.transferSize, 0);
  const hilo = a['mainthread-work-breakdown']?.numericValue ?? 0;
  return {
    puntaje: Math.round(j.categories.performance.score * 100),
    lcp: a['largest-contentful-paint'].numericValue,
    tbt: a['total-blocking-time'].numericValue,
    cls: a['cumulative-layout-shift'].numericValue,
    js: suma('Script'),
    imagenes: suma('Image'),
    total: a['total-byte-weight'].numericValue,
    hilo,
  };
}

const filas = [];
for (const p of paginas) {
  const rs = [];
  for (let i = 1; i <= corridas; i++) {
    process.stderr.write(`${p} · corrida ${i}/${corridas}\n`);
    rs.push(corrida(p, i));
  }
  const m = (k) => mediana(rs.map((r) => r[k]));
  filas.push(`| \`${p}\` | ${m('puntaje')} | ${sec(m('lcp'))} | ${Math.round(m('tbt'))} ms | ${m('cls').toFixed(3)} | ${kb(m('js'))} | ${kb(m('imagenes'))} | ${kb(m('total'))} | ${sec(m('hilo'))} |`);
}

const tabla = [
  `Medición «${etiqueta}» · ${new Date().toISOString().slice(0, 10)} · ${base} · mediana de ${corridas} corridas · Lighthouse 12 móvil`,
  '',
  '| Página | Rendimiento | LCP | TBT | CLS | JS transferido | Imágenes | Peso total | Hilo principal |',
  '|---|---|---|---|---|---|---|---|---|',
  ...filas,
  '',
].join('\n');
writeFileSync(join(out, `${etiqueta}.md`), tabla);
console.log(tabla);
