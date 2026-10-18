import { Logger } from '@nestjs/common';
import { existsSync, readdirSync, statSync } from 'fs';
import { unlink } from 'fs/promises';
import { join, relative, resolve, sep } from 'path';
import { DataSource } from 'typeorm';
import { BillingDocument, OrderPhoto, Payment, Project, ServiceItem, SiteSetting, Testimonial } from '../entities';
import { UPLOAD_DIR } from './upload.options';

const PREFIX = '/uploads/';
const log = new Logger('Uploads');

/** Ruta absoluta del archivo si la URL pública apunta a `uploads/` (y no se sale de esa carpeta); `null` si es externa o inválida. */
export function uploadPathFromUrl(url: string | null | undefined, dir = UPLOAD_DIR): string | null {
  if (!url || !url.startsWith(PREFIX)) return null;
  let rel: string;
  try {
    rel = decodeURIComponent(url.slice(PREFIX.length).split(/[?#]/)[0]);
  } catch {
    return null;
  }
  const root = resolve(dir);
  const abs = resolve(root, rel);
  return rel && abs.startsWith(root + sep) ? abs : null;
}

/** Borra el archivo subido al que apunta `url`. Nunca lanza: un archivo ya ausente o un fallo de disco no deben romper el borrado de la fila. */
export async function removeUploadedFile(url: string | null | undefined, dir = UPLOAD_DIR): Promise<boolean> {
  const path = uploadPathFromUrl(url, dir);
  if (!path) return false;
  try {
    await unlink(path);
    return true;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') log.warn(`No se pudo borrar ${url}: ${(e as Error).message}`);
    return false;
  }
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)]));
}

/** Todas las URLs `/uploads/...` que la base de datos sigue usando (fotos, documentos, comprobantes, catálogo, portafolio, testimonios y ajustes). */
export async function referencedUploads(ds: DataSource): Promise<Set<string>> {
  const found = new Set<string>();
  const add = (v: unknown) => {
    for (const m of String(v ?? '').matchAll(/\/uploads\/[^"'\s)\\]+/g)) found.add(decodeURIComponent(m[0].split(/[?#]/)[0]));
  };
  const columns: [Parameters<DataSource['getRepository']>[0], string[]][] = [
    [OrderPhoto, ['url']], [BillingDocument, ['fileUrl']], [Payment, ['receiptUrl']], [ServiceItem, ['imageUrl']],
    [Testimonial, ['avatarUrl']], [Project, ['beforeUrl', 'afterUrl']],
  ];
  for (const [entity, cols] of columns) {
    const rows = await ds.getRepository(entity).find({ select: cols as never });
    for (const r of rows) for (const c of cols) add((r as Record<string, unknown>)[c]);
  }
  for (const s of await ds.getRepository(SiteSetting).find()) add(JSON.stringify(s.value));
  return found;
}

export interface OrphanFile { path: string; url: string; bytes: number }

/**
 * Archivos de `uploads/` que ninguna fila referencia. `minAgeHours` protege las subidas recientes
 * que aún no se han guardado en la base (el formulario puede estar abierto).
 */
export async function findOrphanUploads(ds: DataSource, opts: { dir?: string; minAgeHours?: number; now?: number } = {}): Promise<OrphanFile[]> {
  const dir = resolve(opts.dir ?? UPLOAD_DIR);
  const minAge = (opts.minAgeHours ?? 24) * 3600_000;
  const now = opts.now ?? Date.now();
  const used = await referencedUploads(ds);
  const orphans: OrphanFile[] = [];
  for (const path of walk(dir)) {
    const url = PREFIX + relative(dir, path).split(sep).join('/');
    const st = statSync(path);
    if (!used.has(url) && now - st.mtimeMs >= minAge) orphans.push({ path, url, bytes: st.size });
  }
  return orphans;
}
