'use client';

import { CrudPage, Field } from '@/components/admin/CrudPage';
import { ServiceIcon } from '@/components/Icon';
import { Spinner } from '@/components/ui/bits';
import { money } from '@/lib/constants';
import type { Pillar } from '@/lib/types';
import { useApi } from '@/lib/useApi';

const DEFAULTS = {
  name: '', pillarId: null, shortDescription: '', description: '', features: [], icon: '', imageUrl: '',
  priceFrom: null, priceNote: '', featured: false, active: true, sortOrder: 0,
};

export default function ServicesPage() {
  const { data: pillars, loading } = useApi<Pillar[]>('/admin/pillars');
  if (loading && !pillars) return <Spinner />;

  const fields: Field[] = [
    { key: 'name', label: 'Nombre', type: 'text', required: true },
    { key: 'pillarId', label: 'Pilar', type: 'select', options: (pillars ?? []).map((p) => ({ value: p.id, label: `${p.code} · ${p.title}` })) },
    { key: 'shortDescription', label: 'Descripción corta', type: 'textarea', required: true, full: true, placeholder: 'Aparece en las tarjetas del catálogo' },
    { key: 'description', label: 'Descripción completa', type: 'textarea', full: true },
    { key: 'features', label: 'Qué incluye', type: 'list', full: true },
    { key: 'icon', label: 'Ícono', type: 'icon' },
    { key: 'imageUrl', label: 'Imagen', type: 'image' },
    { key: 'priceFrom', label: 'Precio desde (RD$)', type: 'number' },
    { key: 'priceNote', label: 'Nota de precio', type: 'text', placeholder: 'Ej. "Cotización a la medida"' },
    { key: 'sortOrder', label: 'Orden', type: 'number' },
    { key: 'featured', label: 'Destacado', type: 'bool' },
    { key: 'active', label: 'Visible en la web', type: 'bool' },
  ];

  return (
    <CrudPage
      title="Servicios"
      subtitle="El catálogo que ven los clientes al pedir un servicio."
      endpoint="/admin/services"
      fields={fields}
      defaults={DEFAULTS}
      toForm={(row) => ({ ...row, pillarId: (row.pillar as Pillar | null)?.id ?? null })}
      render={(row) => (
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand-ink">
            <ServiceIcon name={row.icon as string} className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{row.name as string} {row.featured ? <span className="badge bg-amber-100 text-amber-800">Destacado</span> : null}</p>
            <p className="truncate text-sm text-ink-900/55">
              {(row.pillar as Pillar | null)?.title ?? 'Sin pilar'} · {row.priceFrom ? `Desde ${money(row.priceFrom as string)}` : 'Cotización a la medida'}
            </p>
          </div>
        </div>
      )}
    />
  );
}
