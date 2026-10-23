// Mueve los videos de marketing (marketing/videos/) a una carpeta local fuera del repositorio y dice dónde están.
// Ver docs/videos-de-marketing.md.
//
//   node scripts/videos.mjs ruta                       # muestra la carpeta de videos que se usa
//   node scripts/videos.mjs mover                      # simulacro: lista qué se movería, sin tocar nada
//   node scripts/videos.mjs mover --aplicar            # copia a la carpeta externa, verifica y borra marketing/videos/
//   node scripts/videos.mjs mover --destino=D:\fisc-videos --aplicar
//
// Carpeta externa, en este orden: --destino=RUTA, variable FISC_VIDEOS_DIR, o `fisc-videos` junto a la carpeta del repositorio.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const flag = (name) => process.argv.includes(`--${name}`);
const comando = process.argv[2];

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origen = join(repo, 'marketing', 'videos');

/** Carpeta del repositorio principal (si esto es un worktree, la del repo original), para que `fisc-videos` quede junto a ella. */
function repoPrincipal() {
  try {
    const comun = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: repo, encoding: 'utf8' }).trim();
    return dirname(comun);
  } catch {
    return repo;
  }
}

const destino = resolve(arg('destino') || process.env.FISC_VIDEOS_DIR || join(dirname(repoPrincipal()), 'fisc-videos'));

/** Lista de archivos (ruta relativa y tamaño), recursiva. */
function archivos(base, rel = '') {
  const dir = join(base, rel);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const r = join(rel, e.name);
    return e.isDirectory() ? archivos(base, r) : [{ rel: r, size: statSync(join(base, r)).size }];
  });
}
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

if (comando === 'ruta') {
  console.log(destino);
} else if (comando === 'mover') {
  const lista = archivos(origen);
  if (!lista.length) {
    console.log(`No hay videos en ${origen}. Si ya se movieron, están en: ${destino}`);
    process.exit(0);
  }
  const total = lista.reduce((s, f) => s + f.size, 0);
  console.log(`${lista.length} archivos, ${mb(total)}\n  de:  ${origen}\n  a:   ${destino}`);
  if (!flag('aplicar')) {
    console.log('\nSimulacro: no se tocó nada. Agrega --aplicar para copiar, verificar y borrar el origen.');
    process.exit(0);
  }
  cpSync(origen, destino, { recursive: true, force: false, errorOnExist: false });
  const copiados = new Map(archivos(destino).map((f) => [f.rel, f.size]));
  const faltan = lista.filter((f) => copiados.get(f.rel) !== f.size);
  if (faltan.length) {
    console.error(`La copia no coincide en ${faltan.length} archivos (p. ej. ${faltan[0].rel}). No se borró nada del origen.`);
    process.exit(1);
  }
  rmSync(origen, { recursive: true, force: true });
  console.log(`Listo: ${lista.length} archivos verificados en ${destino}; se borró ${origen}.`);
} else {
  console.error('Uso: node scripts/videos.mjs ruta | mover [--destino=RUTA] [--aplicar]');
  process.exit(1);
}
