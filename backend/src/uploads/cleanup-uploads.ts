import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { unlink } from 'fs/promises';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { findOrphanUploads } from './upload-files';

/**
 * Limpieza de archivos huérfanos en `uploads/`.
 *   npm run cleanup:uploads                       → solo lista (no borra nada)
 *   npm run cleanup:uploads -- --apply            → borra los huérfanos
 *   npm run cleanup:uploads -- --min-age-hours=48 → ignora archivos más recientes (24 por defecto)
 */
async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const ageArg = args.find((a) => a.startsWith('--min-age-hours='));
  const minAgeHours = ageArg ? Number(ageArg.split('=')[1]) : 24;
  if (!Number.isFinite(minAgeHours) || minAgeHours < 0) throw new Error('--min-age-hours inválido');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const orphans = await findOrphanUploads(app.get(DataSource), { minAgeHours });
    const kb = (b: number) => `${(b / 1024).toFixed(1)} kB`;
    for (const o of orphans) console.log(`${apply ? 'borrar' : 'huérfano'}  ${o.url}  ${kb(o.bytes)}`);
    const total = orphans.reduce((s, o) => s + o.bytes, 0);
    if (apply) {
      for (const o of orphans) await unlink(o.path);
      console.log(`\nBorrados ${orphans.length} archivos (${kb(total)}).`);
    } else {
      console.log(`\n${orphans.length} archivos huérfanos (${kb(total)}). Es una simulación: usa --apply para borrarlos.`);
    }
  } finally {
    await app.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
