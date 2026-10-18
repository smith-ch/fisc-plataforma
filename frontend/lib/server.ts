import 'server-only';
import type { Pillar, Service, SiteContent } from './types';
import { FALLBACK_CONTENT } from './fallback';

const API = process.env.API_URL || 'http://localhost:4000';

/** Caché de datos (ISR): 5 min o hasta que el API llame a /api/revalidate (etiqueta `content`). */
async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}/api${path}`, { next: { revalidate: 300, tags: ['content'] } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Contenido de la landing; si el API no responde se usan valores por defecto. */
export async function getContent(): Promise<SiteContent> {
  const data = await get<SiteContent>('/content');
  if (!data) return FALLBACK_CONTENT;
  return { ...data, settings: { ...FALLBACK_CONTENT.settings, ...data.settings } };
}

export async function getCatalog(): Promise<Pillar[]> {
  return (await get<Pillar[]>('/catalog')) ?? [];
}

export async function getService(slug: string): Promise<Service | null> {
  return get<Service>(`/services/${encodeURIComponent(slug)}`);
}

/** Slugs de todos los servicios, para prerenderizar /servicios/[slug]. */
export async function getServiceSlugs(): Promise<string[]> {
  const pillars = await getCatalog();
  return pillars.flatMap((p) => (p.services ?? []).map((s) => s.slug));
}
