'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { Faq } from '@/lib/types';

/** Acordeón de preguntas frecuentes (la cabecera de la sección es HTML de servidor). La altura se anima con CSS (`grid-template-rows`). */
export function FaqList({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-ink-900/10 border-y border-ink-900/10 lg:col-span-2">
      {faqs.map((f) => {
        const isOpen = open === f.id;
        return (
          <div key={f.id}>
            <button onClick={() => setOpen(isOpen ? null : f.id)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-semibold">
              {f.question}
              <Plus className={`h-5 w-5 shrink-0 text-brand-ink transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
            </button>
            <div className={`grid transition-[grid-template-rows,opacity,visibility] duration-300 ease-out ${isOpen ? 'visible grid-rows-[1fr] opacity-100' : 'invisible grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <p className="pb-6 text-ink-900/65">{f.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
