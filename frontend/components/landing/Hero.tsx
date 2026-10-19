'use client';

import { m, useScroll, useTransform } from 'motion/react';
import { ArrowDown, ArrowRight, CalendarCheck, Check } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import { InteractiveBackground } from '@/components/fx/InteractiveBackground';
import { LogoParallax, LogoShards, LogoStatic } from '@/components/fx/LogoParallax';
import { Magnetic, SplitWords } from '@/components/fx/effects';
import { useLightHero } from '@/lib/perf';
import type { Settings } from '@/lib/types';

type Target = React.RefObject<HTMLElement | null>;

/*
 * Efectos de scroll del hero (solo escritorio). Cada uno es un componente aparte para que en móvil no haya ningún
 * `useScroll`/`useTransform` montado: el hero ligero usa elementos normales.
 */
const OFFSET: ['start start', 'end start'] = ['start start', 'end start'];

/** Al hacer scroll el contenido se aleja (escala + desvanecido) como en las landings de producto. */
function ScrollOut({ target, className, children }: { target: Target; className?: string; children: React.ReactNode }) {
  const { scrollYProgress } = useScroll({ target, offset: OFFSET });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.88]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 140]);
  return <m.div style={{ scale, opacity, y }} className={className}>{children}</m.div>;
}

/** Parallax del fondo. */
function ScrollBg({ target, children }: { target: Target; children: React.ReactNode }) {
  const { scrollYProgress } = useScroll({ target, offset: OFFSET });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  return <m.div style={{ y: bgY }} className="absolute inset-0">{children}</m.div>;
}

const HINT_CLASS = 'absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-xs tracking-[0.3em] text-ink-900/50 uppercase';

/** Enlace "Descubre": se desvanece al bajar. */
function ScrollHint({ target, children }: { target: Target; children: React.ReactNode }) {
  const { scrollYProgress } = useScroll({ target, offset: OFFSET });
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  return <m.a href="#servicios" style={{ opacity }} className={HINT_CLASS}>{children}</m.a>;
}

export function Hero({ hero, brand }: { hero: Settings['hero']; brand: Settings['brand'] }) {
  const ref = useRef<HTMLElement>(null);
  // Móvil o "reducir movimiento": hero ligero (sin fragmentos del logo, sin parallax ni efectos de scroll)
  const light = useLightHero();

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
      <m.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        className="eyebrow mb-6 inline-flex items-center gap-2 rounded-full border border-ink-900/15 bg-ink-900/5 px-4 py-2 text-ink-900/80 backdrop-blur">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand dark:bg-accent" /> {hero.eyebrow}
      </m.p>
      <h1 className="text-5xl leading-[0.95] font-bold tracking-tight sm:text-6xl xl:text-7xl">
        <SplitWords text={main} />
        <SplitWords text={accent} delay={0.35} className="font-display font-normal text-brand-ink dark:text-accent" />
      </h1>
      <m.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.6 }}
        className="mt-8 max-w-2xl text-lg text-ink-900/70 sm:text-xl">
        {hero.subtitle}
      </m.p>
      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.8 }}
        className="mt-10 flex flex-wrap items-center gap-3">
        <Magnetic>
          <Link href="/solicitar" className="btn-primary px-7 py-4 text-base dark:bg-accent dark:text-ink-950 dark:shadow-accent/20">{hero.ctaPrimary} <ArrowRight className="h-4 w-4" /></Link>
        </Magnetic>
        <Magnetic>
          <Link href="/solicitar?tipo=levantamiento" className="btn border border-ink-900/20 px-7 py-4 text-base backdrop-blur hover:bg-ink-900/5">
            <CalendarCheck className="h-4 w-4" /> {hero.ctaSecondary}
          </Link>
        </Magnetic>
      </m.div>
      <m.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.1 }}
        className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-900/70">
        {hero.highlights.map((h) => (
          <li key={h} className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-ink dark:text-accent" /> {h}</li>
        ))}
      </m.ul>
    </>
  );

  const hint = (
    <>
      Descubre
      <span className="grid h-10 w-6 place-items-start justify-center rounded-full border border-ink-900/25 p-1">
        <ArrowDown className="h-3 w-3 animate-bounce" />
      </span>
    </>
  );

  return (
    <section ref={ref} className="grain relative flex min-h-[100svh] items-center overflow-hidden bg-sand-50 text-ink-900 dark:bg-ink-950">
      {light ? <div className="absolute inset-0">{bg}</div> : <ScrollBg target={ref}>{bg}</ScrollBg>}
      <div className="absolute inset-0 bg-gradient-to-b from-sand-50/30 via-transparent to-sand-50 dark:from-ink-950/30 dark:to-ink-950" />

      <div className="container-x relative z-10 grid items-center gap-6 pt-28 pb-20 lg:grid-cols-12">
      {light ? <div className="lg:col-span-7">{content}</div> : <ScrollOut target={ref} className="lg:col-span-7">{content}</ScrollOut>}
      <div className="order-first mx-auto w-44 sm:w-56 lg:order-none lg:col-span-5 lg:w-full lg:max-w-md">
        {/* Escritorio: símbolo animado (parallax, brillo, sombra). Móvil: símbolo estático sin filtros ni mezclas. */}
        <div className="only-desktop">{!light && <LogoParallax scrollTarget={ref} />}</div>
        <div className="only-mobile"><LogoStatic /></div>
      </div>
      </div>

      {light ? <a href="#servicios" className={HINT_CLASS}>{hint}</a> : <ScrollHint target={ref}>{hint}</ScrollHint>}
    </section>
  );
}
