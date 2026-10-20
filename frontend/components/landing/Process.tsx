'use client';

import { ClipboardCheck, HardHat, Star } from 'lucide-react';
import { useRef } from 'react';
import { InteractiveBackground } from '@/components/fx/InteractiveBackground';
import { useScrollProgress } from '@/lib/scroll-fx';
import type { Settings } from '@/lib/types';

const PHASE_ICONS = [ClipboardCheck, HardHat, Star];

/**
 * Sección fijada con desplazamiento horizontal: al hacer scroll vertical las
 * fases del proceso avanzan de lado (estilo landing editorial).
 */
export function Process({ process }: { process: Settings['process'] }) {
  const ref = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const n = process.phases.length || 1;
  // Scroll vertical → las fases avanzan de lado (sin `motion`; ver lib/scroll-fx.ts)
  useScrollProgress(ref, 'sticky', (p) => {
    if (track.current) track.current.style.transform = `translate3d(${-((n - 1) / n) * 100 * p}%, 0, 0)`;
    if (bar.current) bar.current.style.transform = `scaleX(${p})`;
  });

  return (
    <section id="proceso" ref={ref} className="relative bg-ink-950 text-white" style={{ height: `${n * 100 + 20}vh` }}>
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
        <InteractiveBackground colors={['#3E4A52', '#1f2a30', '#8FA4B0']} dots={false} className="opacity-50" />
        <div className="container-x relative z-10 pt-28">
          <p className="eyebrow text-accent">Fases del servicio</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-4xl font-bold tracking-tight sm:text-6xl">{process.title}</h2>
            <p className="max-w-md text-white/60">{process.subtitle}</p>
          </div>
          <div className="mt-8 h-px w-full bg-white/10">
            <div ref={bar} className="h-px origin-left scale-x-0 bg-accent transition-transform duration-150 ease-out" />
          </div>
        </div>
        <div className="relative z-10 flex flex-1 items-center">
          <div ref={track} style={{ width: `${n * 100}%` }} className="flex h-full shrink-0">
            {process.phases.map((phase, i) => {
              const Icon = PHASE_ICONS[i % PHASE_ICONS.length];
              return (
                <div key={i} className="flex h-full items-center" style={{ width: `${100 / n}%` }}>
                  <div className="container-x grid items-center gap-10 lg:grid-cols-2">
                    <div>
                      <span className="font-display text-[7rem] leading-none text-white/15 sm:text-[11rem]">0{i + 1}</span>
                      <h3 className="-mt-6 flex items-center gap-3 text-3xl font-bold sm:text-5xl">
                        <Icon className="h-9 w-9 text-accent" /> {phase.title}
                      </h3>
                    </div>
                    <ol className="space-y-4">
                      {phase.steps.map((s, j) => (
                        <li key={j} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md max-md:bg-white/[0.07] max-md:backdrop-blur-none">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-ink-950">{j + 1}</span>
                          <p className="text-white/80">{s}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
