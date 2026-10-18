import 'server-only';
import { CATALOGO } from '@/data/catalogo';
import { CONTENIDO } from '@/data/contenido';
import type { Pillar, Service, SiteContent } from './types';

// Antes estas funciones pedían los datos a un API con caché. Ahora salen de `data/` y la web se genera
// completa en el build: no hay peticiones en tiempo de ejecución. Se mantienen asíncronas para no tocar a quien las usa.

/** Contenido de la landing. */
export async function getContent(): Promise<SiteContent> {
  return CONTENIDO;
}

export async function getCatalog(): Promise<Pillar[]> {
  return CATALOGO;
}

export async function getService(slug: string): Promise<Service | null> {
  for (const pillar of CATALOGO) {
    const service = pillar.services?.find((s) => s.slug === slug);
    if (service) return { ...service, pillar: { ...pillar, services: undefined } };
  }
  return null;
}

/** Slugs de todos los servicios, para prerenderizar /servicios/[slug]. */
export async function getServiceSlugs(): Promise<string[]> {
  return CATALOGO.flatMap((p) => (p.services ?? []).map((s) => s.slug));
}
