import { BadRequestException } from '@nestjs/common';
import { DEFAULT_SETTINGS } from './settings.defaults';

export const MAX_SETTING_BYTES = 200 * 1024;

const kind = (v: unknown) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v);

/**
 * Valida el cuerpo de `PUT /admin/settings/:key` contra la forma de los valores por defecto de esa sección:
 * debe ser un objeto (no un arreglo ni un valor suelto), no pasar de 200 kB, y solo conserva los campos que la
 * sección conoce, cada uno con el mismo tipo que su valor por defecto.
 */
export function sanitizeSetting(key: string, body: unknown): Record<string, unknown> {
  const defaults = DEFAULT_SETTINGS[key];
  if (!defaults) throw new BadRequestException('Sección de configuración desconocida');
  if (kind(body) !== 'object') throw new BadRequestException('El contenido debe ser un objeto');
  if (Buffer.byteLength(JSON.stringify(body)) > MAX_SETTING_BYTES) throw new BadRequestException('El contenido es demasiado grande');

  const input = body as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const field of Object.keys(defaults)) {
    if (!(field in input)) continue;
    if (kind(input[field]) !== kind(defaults[field])) {
      throw new BadRequestException(`El campo "${field}" tiene un tipo inválido (se esperaba ${kind(defaults[field])})`);
    }
    out[field] = input[field];
  }
  return out;
}
