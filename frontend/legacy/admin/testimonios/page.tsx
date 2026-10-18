'use client';

import { Star } from 'lucide-react';
import { CrudPage, Field } from '@/components/admin/CrudPage';

const FIELDS: Field[] = [
  { key: 'name', label: 'Nombre', type: 'text', required: true },
  { key: 'company', label: 'Empresa / cargo', type: 'text' },
  { key: 'rating', label: 'Estrellas (1-5)', type: 'number' },
  { key: 'text', label: 'Testimonio', type: 'textarea', required: true, full: true },
  { key: 'avatarUrl', label: 'Foto', type: 'image' },
  { key: 'sortOrder', label: 'Orden', type: 'number' },
  { key: 'active', label: 'Visible en la web', type: 'bool' },
];

const DEFAULTS = { name: '', company: '', rating: 5, text: '', avatarUrl: '', sortOrder: 0, active: true };

export default function TestimonialsPage() {
  return (
    <CrudPage
      title="Testimonios"
      subtitle="Reseñas de clientes que se muestran en la landing."
      endpoint="/admin/testimonials"
      fields={FIELDS}
      defaults={DEFAULTS}
      render={(row) => (
        <div className="flex items-center gap-3">
          {row.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.avatarUrl as string} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
          ) : <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-900/10 text-sm font-bold uppercase">{(row.name as string)?.slice(0, 2)}</div>}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{row.name as string} {row.company ? <span className="font-normal text-ink-900/50">· {row.company as string}</span> : null}</p>
            <p className="truncate text-sm text-ink-900/55">{row.text as string}</p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3.5 w-3.5 ${i < Number(row.rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-ink-900/15'}`} />
            ))}
          </div>
        </div>
      )}
    />
  );
}
