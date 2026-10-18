'use client';

import { CrudPage, Field } from '@/components/admin/CrudPage';

const FIELDS: Field[] = [
  { key: 'title', label: 'Título', type: 'text', required: true },
  { key: 'category', label: 'Categoría', type: 'text', placeholder: 'Pintura, Plomería…' },
  { key: 'description', label: 'Descripción', type: 'textarea', full: true },
  { key: 'beforeUrl', label: 'Foto "Antes"', type: 'image' },
  { key: 'afterUrl', label: 'Foto "Después"', type: 'image' },
  { key: 'sortOrder', label: 'Orden', type: 'number' },
  { key: 'active', label: 'Visible en la web', type: 'bool' },
];

const DEFAULTS = { title: '', category: '', description: '', beforeUrl: '', afterUrl: '', sortOrder: 0, active: true };

export default function ProjectsPage() {
  return (
    <CrudPage
      title="Portafolio"
      subtitle="Trabajos con comparador antes / después que se muestran en la landing."
      endpoint="/admin/projects"
      fields={FIELDS}
      defaults={DEFAULTS}
      render={(row) => (
        <div className="flex items-center gap-3">
          {(row.afterUrl || row.beforeUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={(row.afterUrl || row.beforeUrl) as string} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
          ) : <div className="h-12 w-16 shrink-0 rounded-lg bg-ink-900/10" />}
          <div className="min-w-0">
            <p className="truncate font-semibold">{row.title as string}</p>
            <p className="truncate text-sm text-ink-900/55">{(row.category as string) || 'Sin categoría'}</p>
          </div>
        </div>
      )}
    />
  );
}
