import { InteractiveBackground } from '@/components/fx/InteractiveBackground';
import { Reveal } from '@/components/fx/effects';
import { FaqList } from './FaqList';
import type { Faq } from '@/lib/types';

export function FaqSection({ faqs }: { faqs: Faq[] }) {
  if (!faqs.length) return null;
  return (
    <section id="faq" className="relative overflow-hidden bg-sand-50 py-28">
      <InteractiveBackground className="opacity-70" />
      <div className="container-x relative z-10 grid gap-12 lg:grid-cols-3">
        <Reveal>
          <p className="eyebrow text-brand-ink">Preguntas frecuentes</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight">¿Tienes dudas?</h2>
          <p className="mt-4 text-ink-900/60">Si no encuentras tu respuesta, escríbenos por WhatsApp.</p>
        </Reveal>
        <FaqList faqs={faqs} />
      </div>
    </section>
  );
}
