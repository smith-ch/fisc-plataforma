import { BadRequestException } from '@nestjs/common';
import { DEFAULT_SETTINGS } from './settings.defaults';
import { MAX_SETTING_BYTES, sanitizeSetting } from './settings.validation';

describe('sanitizeSetting', () => {
  it.each(Object.keys(DEFAULT_SETTINGS))('acepta los valores por defecto de la sección %s tal cual', (key) => {
    expect(sanitizeSetting(key, DEFAULT_SETTINGS[key])).toEqual(DEFAULT_SETTINGS[key]);
  });

  it('descarta los campos que la sección no conoce', () => {
    const out = sanitizeSetting('brand', { name: 'F.I.S.C.', __proto__x: 1, role: 'admin', evil: { a: 1 } });
    expect(out).toEqual({ name: 'F.I.S.C.' });
  });

  it('permite guardar solo algunos campos', () => {
    expect(sanitizeSetting('hero', { title: 'Nuevo título' })).toEqual({ title: 'Nuevo título' });
  });

  it.each([null, [], 'texto', 5, true, undefined])('rechaza un cuerpo que no es un objeto (%p)', (body) => {
    expect(() => sanitizeSetting('brand', body)).toThrow(BadRequestException);
  });

  it('rechaza una sección desconocida', () => {
    expect(() => sanitizeSetting('nada', {})).toThrow(BadRequestException);
  });

  it('rechaza campos con un tipo distinto al esperado', () => {
    expect(() => sanitizeSetting('brand', { name: 123 })).toThrow(/name/);
    expect(() => sanitizeSetting('hero', { highlights: 'no es lista' })).toThrow(/highlights/);
    expect(() => sanitizeSetting('about', { stats: { value: 1 } })).toThrow(/stats/);
    expect(() => sanitizeSetting('brand', { name: null })).toThrow(BadRequestException);
  });

  it('rechaza contenido demasiado grande', () => {
    expect(() => sanitizeSetting('brand', { name: 'x'.repeat(MAX_SETTING_BYTES) })).toThrow(/grande/);
  });
});
