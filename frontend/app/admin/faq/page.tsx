'use client';

import { CrudPage, Field } from '@/components/admin/CrudPage';

const FIELDS: Field[] = [
  { key: 'question', label: 'Pregunta', type: 'text', required: true, full: true },
  { key: 'answer', label: 'Respuesta', type: 'textarea', required: true, full: true },
  { key: 'sortOrder', label: 'Orden', type: 'number' },
  { key: 'active', label: 'Visible en la web', type: 'bool' },
];

const DEFAULTS = { question: '', answer: '', sortOrder: 0, active: true };

export default function FaqPage() {
  return (
    <CrudPage
      title="Preguntas frecuentes"
      subtitle="El acordeón de dudas comunes que aparece en la landing."
      endpoint="/admin/faqs"
      fields={FIELDS}
      defaults={DEFAULTS}
      render={(row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold">{row.question as string}</p>
          <p className="truncate text-sm text-ink-900/55">{row.answer as string}</p>
        </div>
      )}
    />
  );
}
