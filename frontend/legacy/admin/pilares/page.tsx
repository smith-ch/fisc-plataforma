'use client';

import { CrudPage, Field } from '@/components/admin/CrudPage';
import { ServiceIcon } from '@/components/Icon';

const FIELDS: Field[] = [
  { key: 'code', label: 'Código', type: 'text', required: true, placeholder: 'A, B, C…' },
  { key: 'title', label: 'Título', type: 'text', required: true, full: true },
  { key: 'description', label: 'Descripción', type: 'textarea' },
  { key: 'icon', label: 'Ícono', type: 'icon' },
  { key: 'color', label: 'Color', type: 'color' },
  { key: 'sortOrder', label: 'Orden', type: 'number' },
  { key: 'active', label: 'Visible en la web', type: 'bool' },
];

const DEFAULTS = { code: '', title: '', description: '', icon: '', color: '#3E4A52', sortOrder: 0, active: true };

export default function PillarsPage() {
  return (
    <CrudPage
      title="Pilares"
      subtitle="Las grandes categorías de servicio que agrupan el catálogo."
      endpoint="/admin/pillars"
      fields={FIELDS}
      defaults={DEFAULTS}
      render={(row) => (
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ backgroundColor: (row.color as string) || '#3E4A52' }}>
            <ServiceIcon name={row.icon as string} className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{row.code as string} · {row.title as string}</p>
            <p className="truncate text-sm text-ink-900/55">{(row.description as string) || 'Sin descripción'}</p>
          </div>
        </div>
      )}
    />
  );
}
