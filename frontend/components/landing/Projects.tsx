import { InteractiveBackground } from '@/components/fx/InteractiveBackground';
import { Reveal } from '@/components/fx/effects';
import { BeforeAfter } from './BeforeAfter';
import type { Project } from '@/lib/types';

/** Portafolio con comparador "antes / después" deslizable. */
export function Projects({ projects }: { projects: Project[] }) {
  if (!projects.length) return null;
  return (
    <section id="trabajos" className="relative overflow-hidden bg-sand-50 py-28">
      <InteractiveBackground className="opacity-70" />
      <div className="container-x relative z-10">
        <Reveal>
          <p className="eyebrow text-brand-ink">Trabajos realizados</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Antes <span className="font-display font-medium text-brand-ink">&amp;</span> después</h2>
        </Reveal>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {projects.map((p, i) => (
            <Reveal key={p.id} delay={(i % 2) * 0.1}>
              <article>
                {p.beforeUrl && p.afterUrl ? <BeforeAfter before={p.beforeUrl} after={p.afterUrl} /> : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.afterUrl || p.beforeUrl || ''} alt={p.title} loading="lazy" decoding="async" className="aspect-[4/3] w-full rounded-3xl object-cover" />
                )}
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">{p.title}</h3>
                    {p.description && <p className="mt-1 text-sm text-ink-900/60">{p.description}</p>}
                  </div>
                  {p.category && <span className="badge shrink-0 bg-brand-soft text-brand-ink">{p.category}</span>}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
