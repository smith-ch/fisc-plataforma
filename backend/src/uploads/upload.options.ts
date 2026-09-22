import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomBytes } from 'crypto';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

export const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.svg']);

/** Opciones multer: guarda en disco dentro de una subcarpeta y acepta imágenes/PDF. */
export function uploadOptions(folder: string): MulterOptions {
  const dest = join(UPLOAD_DIR, folder);
  mkdirSync(dest, { recursive: true });
  return {
    storage: diskStorage({
      destination: dest,
      filename: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`);
      },
    }),
    limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || 8) * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase();
      if (!ALLOWED.has(ext)) return cb(new BadRequestException('Formato no permitido (usa JPG, PNG, WEBP o PDF)'), false);
      cb(null, true);
    },
  };
}

/** Ruta pública del archivo guardado (servida en /uploads). */
export function publicPath(folder: string, file: Express.Multer.File): string {
  return `/uploads/${folder}/${file.filename}`;
}
