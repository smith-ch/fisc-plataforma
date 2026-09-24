'use client';

import { Eye, EyeOff, ThumbsDown, ThumbsUp } from 'lucide-react';
import { AdminTitle } from '@/components/admin/ui';
import { Empty, Spinner, Stars } from '@/components/ui/bits';
import { api } from '@/lib/api';
import { date } from '@/lib/constants';
import type { Review } from '@/lib/types';
import { useApi } from '@/lib/useApi';

const SUBSCORES = [
  { k: 'punctuality', label: 'Puntualidad' },
  { k: 'quality', label: 'Calidad' },
  { k: 'cleanliness', label: 'Limpieza' },
  { k: 'communication', label: 'Comunicación' },
] as const;

export default function ReviewsPage() {
  const { data: reviews, loading, reload } = useApi<Review[]>('/admin/reviews');

  async function toggle(r: Review) {
    try { await api(`/admin/reviews/${r.id}`, { method: 'PATCH', body: { published: !r.published } }); reload(); } catch { /* noop */ }
  }

  const avg = reviews?.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div>
      <AdminTitle title="Evaluaciones" subtitle="Reseñas que los clientes dejan al completar una orden.">
        {!!reviews?.length && <span className="badge bg-amber-100 text-amber-800">★ {avg.toFixed(1)} promedio · {reviews.length} evaluaciones</span>}
      </AdminTitle>

      {loading && !reviews ? <Spinner /> : !reviews?.length ? <Empty>Todavía no hay evaluaciones.</Empty> : (
        <div className="grid gap-3">
          {reviews.map((r) => (
            <div key={r.id} className={`card p-5 ${!r.published ? 'opacity-60' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} size="h-4 w-4" />
                    {r.wouldRecommend ? <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" /> : <ThumbsDown className="h-3.5 w-3.5 text-rose-500" />}
                  </div>
                  <p className="mt-1 text-sm font-semibold">{r.order?.contactName ?? 'Cliente'} {r.order?.code && <span className="font-normal text-ink-900/45">· {r.order.code}</span>}</p>
                  <p className="text-xs text-ink-900/45">{date(r.createdAt, true)}</p>
                </div>
                <button onClick={() => toggle(r)} className="btn-ghost btn-sm">
                  {r.published ? <><EyeOff className="h-3.5 w-3.5" /> Ocultar</> : <><Eye className="h-3.5 w-3.5" /> Publicar</>}
                </button>
              </div>
              {r.comment && <p className="mt-3 text-sm text-ink-900/75">“{r.comment}”</p>}
              <div className="mt-3 flex flex-wrap gap-4">
                {SUBSCORES.map((s) => {
                  const v = r[s.k];
                  return v ? <span key={s.k} className="text-xs text-ink-900/50">{s.label}: <b className="text-ink-900/70">{v}/5</b></span> : null;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
