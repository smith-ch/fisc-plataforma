'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Paged } from '@/lib/types';

/** Paginador de los listados del panel: "1–20 de 134" con anterior/siguiente. No se muestra si todo cabe en una página. */
export function Pager({ data, onPage }: { data: Pick<Paged<unknown>, 'total' | 'page' | 'limit' | 'pages'>; onPage: (page: number) => void }) {
  if (data.total <= data.limit) return null;
  const from = (data.page - 1) * data.limit + 1;
  const to = Math.min(data.page * data.limit, data.total);
  return (
    <nav aria-label="Paginación" className="mt-5 flex items-center justify-between gap-3 text-sm">
      <p className="text-ink-900/55">{from}–{to} de {data.total}</p>
      <div className="flex items-center gap-2">
        <button onClick={() => onPage(data.page - 1)} disabled={data.page <= 1} className="btn-ghost btn-sm" aria-label="Página anterior">
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>
        <span className="text-xs text-ink-900/50">Página {data.page} de {data.pages}</span>
        <button onClick={() => onPage(data.page + 1)} disabled={data.page >= data.pages} className="btn-ghost btn-sm" aria-label="Página siguiente">
          Siguiente <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
