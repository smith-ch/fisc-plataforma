'use client';

import { ArrowDown, ArrowRight, CalendarCheck, Check } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import { InteractiveBackground } from '@/components/fx/InteractiveBackground';
import { LogoParallax, LogoShards } from '@/components/fx/LogoLazy';
import { LogoStatic } from '@/components/fx/LogoPieces';
import { Magnetic, SplitWords } from '@/components/fx/effects';
import { useDesktopFx } from '@/lib/perf';
import { useScrollProgress } from '@/lib/scroll-fx';
import type { Settings } from '@/lib/types';

type Target = React.RefObject<HTMLElement | null>;

/*
 * Efectos de scroll del hero (solo escritorio), sin `motion`: un listener de scroll compartido (lib/scroll-fx.ts) que escribe `style`
 * directamente. Siguen montados siempre con el mismo árbol (así al pasar a la versión ligera no se vuelve a montar el contenido);
 * con `enabled` en falso (móvil o "reducir movimiento") no escuchan el scroll y dejan el elemento en reposo.
 */

/** Al hacer scroll el contenido se aleja (escala + desvanecido) como en las landings de producto. */
function ScrollOut({ target, enabled, className, children }: { target: Target; enabled: boolean; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollProgress(target, 'hero', (p) => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = p ? `translate3d(0, ${140 * p}px, 0) scale(${1 - 0.12 * p})` : '';
    el.style.opacity = p ? String(Math.max(0, 1 - p / 0.8)) : '';
  }, enabled);
  return <div ref={ref} className={className}>{children}</div>;
}

/** Parallax del fondo. */
function ScrollBg({ target, enabled, children }: { target: Target; enabled: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollProgress(target, 'hero', (p) => {
    if (ref.current) ref.current.style.transform = p ? `translate3d(0, ${25 * p}%, 0)` : '';
  }, enabled);
  return <div ref={ref} className="absolute inset-0">{children}</div>;
}

const HINT_CLASS = 'absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-xs tracking-[0.3em] text-ink-900/50 uppercase';

/** Enlace "Descubre": se desvanece al bajar. */
function ScrollHint({ target, enabled, children }: { target: Target; enabled: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);
  useScrollProgress(target, 'hero', (p) => {
    if (ref.current) ref.current.style.opacity = p ? String(Math.max(0, 1 - p / 0.8)) : '';
  }, enabled);
  return <a ref={ref} href="#servicios" className={HINT_CLASS}>{children}</a>;
}

/** Entrada escalonada del contenido del hero (animación CSS, ver `.fx-rise` en globals.css). */
// Entrada del texto del hero: nunca parte de `opacity: 0` (`--o: 1`): se ve en el HTML del servidor y solo se desplaza. En móvil no se anima (`.fx-hero`).
const rise = (y: number, dur: number, delay: number) => ({ '--y': `${y}px`, '--o': 1, '--dur': `${dur}s`, '--d': `${delay}s` }) as React.CSSProperties;

export function Hero({ hero, brand }: { hero: Settings['hero']; brand: Settings['brand'] }) {
  const ref = useRef<HTMLElement>(null);
  // Solo escritorio y sin "reducir movimiento" (y ya hidratado): parallax, fragmentos del logo y efectos de scroll; si no, hero ligero
  const fx = useDesktopFx();

  // Última palabra del título en cursiva serif, como acento editorial
  const words = hero.title.split(' ');
  const main = words.slice(0, -3).join(' ');
  const accent = words.slice(-3).join(' ');

  const bg = (
    <>
      {hero.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={hero.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-15 dark:opacity-25" />
      )}
      <InteractiveBackground hero colors={[brand.primaryColor, brand.accentColor, '#1f2a30', '#5b6b75']} />
      {/* LogoShards no se monta en móvil (ver su comentario) */}
      <LogoShards scrollTarget={ref} />
    </>
  );

  const content = (
    <>
      <p style={rise(12, 0.8, 0)}
        className="fx-rise fx-hero eyebrow mb-6 inline-flex items-center gap-2 rounded-full border border-ink-900/15 bg-ink-900/5 px-4 py-2 text-ink-900/80 backdrop-blur max-md:backdrop-blur-none">
        <span className="h-1.5 w-1.5 animate-pulse max-md:[animation-iteration-count:3] rounded-full bg-brand dark:bg-accent" /> {hero.eyebrow}
      </p>
      <h1 className="text-5xl leading-[0.95] font-bold tracking-tight sm:text-6xl xl:text-7xl">
        <SplitWords text={main} />
        <SplitWords text={accent} delay={0.35} className="font-display font-normal text-brand-ink dark:text-accent" />
      </h1>
      <p style={rise(20, 0.9, 0.6)}
        className="fx-rise fx-hero mt-8 max-w-2xl text-lg text-ink-900/70 sm:text-xl">
        {hero.subtitle}
      </p>
      <div style={rise(20, 0.9, 0.8)}
        className="fx-rise fx-hero mt-10 flex flex-wrap items-center gap-3">
        <Magnetic>
          <Link href="/solicitar" className="btn-primary px-7 py-4 text-base dark:bg-accent dark:text-ink-950 dark:shadow-accent/20">{hero.ctaPrimary} <ArrowRight className="h-4 w-4" /></Link>
        </Magnetic>
        <Magnetic>
          <Link href="/solicitar?tipo=levantamiento" className="btn border border-ink-900/20 px-7 py-4 text-base backdrop-blur max-md:backdrop-blur-none hover:bg-ink-900/5">
            <CalendarCheck className="h-4 w-4" /> {hero.ctaSecondary}
          </Link>
        </Magnetic>
      </div>
      <ul style={rise(0, 1, 1.1)}
        className="fx-rise fx-hero mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-900/70">
        {hero.highlights.map((h) => (
          <li key={h} className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-ink dark:text-accent" /> {h}</li>
        ))}
      </ul>
    </>
  );

  const hint = (
    <>
      Descubre
      <span className="grid h-10 w-6 place-items-start justify-center rounded-full border border-ink-900/25 p-1">
        <ArrowDown className="h-3 w-3 animate-bounce max-md:[animation-iteration-count:3]" />
      </span>
    </>
  );

  return (
    <section ref={ref} className="grain relative flex min-h-[100svh] items-center overflow-hidden bg-sand-50 text-ink-900 dark:bg-ink-950">
      <ScrollBg target={ref} enabled={fx}>{bg}</ScrollBg>
      <div className="absolute inset-0 bg-gradient-to-b from-sand-50/30 via-transparent to-sand-50 dark:from-ink-950/30 dark:to-ink-950" />

      <div className="container-x relative z-10 grid items-center gap-6 pt-28 pb-20 lg:grid-cols-12">
      <ScrollOut target={ref} enabled={fx} className="lg:col-span-7">{content}</ScrollOut>
      <div className="order-first mx-auto w-44 sm:w-56 lg:order-none lg:col-span-5 lg:w-full lg:max-w-md">
        {/* Escritorio: símbolo animado (parallax, brillo, sombra). Móvil: símbolo estático sin filtros ni mezclas. */}
        <LogoParallax scrollTarget={ref} />
        <div className="only-mobile"><LogoStatic /></div>
      </div>
      </div>

      <ScrollHint target={ref} enabled={fx}>{hint}</ScrollHint>
    </section>
  );
}
