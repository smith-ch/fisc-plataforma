export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PageQuery {
  page?: string | number;
  limit?: string | number;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const toInt = (v: unknown, fallback: number) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 1 ? n : fallback;
};

/** Normaliza `page` y `limit` de la query: página ≥ 1 y tamaño entre 1 y 100 (20 por defecto). */
export function parsePage(q: PageQuery = {}, defaultLimit = DEFAULT_PAGE_SIZE) {
  const limit = Math.min(toInt(q.limit, defaultLimit), MAX_PAGE_SIZE);
  const page = toInt(q.page, 1);
  return { page, limit, skip: (page - 1) * limit };
}

export function toPaged<T>(items: T[], total: number, page: number, limit: number): Paged<T> {
  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}
