import { ArrowDown, ArrowRight, CalendarCheck, Check } from 'lucide-react';
import Link from 'next/link';
import { InteractiveBackground } from '@/components/fx/InteractiveBackground';
import { LogoShards } from '@/components/fx/LogoLazy';
import { LogoSymbol } from '@/components/fx/LogoSymbol';
import { SplitWords } from '@/components/fx/SplitWords';
import { Magnetic } from '@/components/fx/effects';
import { ContentImage } from '@/components/ui/ContentImage';
import { HeroScrollFx } from '@/components/landing/HeroScrollFx';
import type { Settings } from '@/lib/types';

/**
 * Hero de la portada: componente de SERVIDOR. Título, subtítulo, botones, lista y símbolo del logo salen en el HTML y no se hidratan; solo hay
 * pequeñas islas de cliente para lo que es interacción real y solo de escritorio:
 * - `HeroScrollFx`: escala/desvanecido del contenido, parallax del fondo y enlace "Descubre" al hacer scroll (busca los `data-hero-*` de abajo).
 * - `LogoSymbol` → `LogoSymbolFx`: seguimiento del cursor, vista explotada, sombra y brillo.
 * - `InteractiveBackground` y `LogoShards`: canvas y fragmentos, cargados aparte y nunca en móvil.
 * - `Magnetic`: el desplazamiento de los botones hacia el cursor.
 * En móvil y con "reducir movimiento" ninguna de esas islas hace nada y el hero es HTML estático.
 */

const HINT_CLASS = 'absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-xs tracking-[0.3em] text-ink-900/50 uppercase';

/** Entrada escalonada del contenido del hero (animación CSS, ver `.fx-rise` en globals.css). */
// Entrada del texto del hero: nunca parte de `opacity: 0` (`--o: 1`): se ve en el HTML del servidor y solo se desplaza. En móvil no se anima (`.fx-hero`).
const rise = (y: number, dur: number, delay: number) => ({ '--y': `${y}px`, '--o': 1, '--dur': `${dur}s`, '--d': `${delay}s` }) as React.CSSProperties;

export function Hero({ hero, brand }: { hero: Settings['hero']; brand: Settings['brand'] }) {
  // Última palabra del título en cursiva serif, como acento editorial
  const words = hero.title.split(' ');
  const main = words.slice(0, -3).join(' ');
  const accent = words.slice(-3).join(' ');

  return (
    <section data-hero className="grain relative flex min-h-[100svh] items-center overflow-hidden bg-sand-50 text-ink-900 dark:bg-ink-950">
      <div data-hero-bg className="absolute inset-0">
        {hero.imageUrl && (
          <ContentImage src={hero.imageUrl} alt="" priority sizes="100vw" className="object-cover opacity-15 dark:opacity-25" />
        )}
        <InteractiveBackground hero startDelay={1300} colors={[brand.primaryColor, brand.accentColor, '#1f2a30', '#5b6b75']} />
        {/* LogoShards no se monta en móvil (ver su comentario) */}
        <LogoShards />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-sand-50/30 via-transparent to-sand-50 dark:from-ink-950/30 dark:to-ink-950" />

      <div className="container-x relative z-10 grid items-center gap-6 pt-28 pb-20 lg:grid-cols-12">
        <div data-hero-out className="lg:col-span-7">
          <p style={rise(10, 0.55, 0)}
            className="fx-rise fx-hero eyebrow mb-6 inline-flex items-center gap-2 rounded-full border border-ink-900/15 bg-ink-900/5 px-4 py-2 text-ink-900/80 backdrop-blur max-md:backdrop-blur-none">
            <span className="h-1.5 w-1.5 animate-pulse max-md:[animation-iteration-count:3] rounded-full bg-brand dark:bg-accent" /> {hero.eyebrow}
          </p>
          <h1 className="text-5xl leading-[0.95] font-bold tracking-tight sm:text-6xl xl:text-7xl">
            <SplitWords text={main} />
            <SplitWords text={accent} delay={0.18} className="font-display font-normal text-brand-ink dark:text-accent" />
          </h1>
          <p style={rise(14, 0.6, 0.12)}
            className="fx-rise fx-hero mt-8 max-w-2xl text-lg text-ink-900/70 sm:text-xl">
            {hero.subtitle}
          </p>
          <div style={rise(14, 0.6, 0.2)}
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
          <ul style={rise(0, 0.6, 0.3)}
            className="fx-rise fx-hero mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-900/70">
            {hero.highlights.map((h) => (
              <li key={h} className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-ink dark:text-accent" /> {h}</li>
            ))}
          </ul>
        </div>
        <div className="order-first mx-auto w-44 sm:w-56 lg:order-none lg:col-span-5 lg:w-full lg:max-w-md">
          {/* Símbolo: entrada con CSS desde el primer pintado; en escritorio, al terminar, se engancha el parallax (ver LogoSymbolFx) */}
          <LogoSymbol />
        </div>
      </div>

      <a data-hero-hint href="#servicios" className={HINT_CLASS}>
        Descubre
        <span className="grid h-10 w-6 place-items-start justify-center rounded-full border border-ink-900/25 p-1">
          <ArrowDown className="h-3 w-3 animate-bounce max-md:[animation-iteration-count:3]" />
        </span>
      </a>

      <HeroScrollFx />
    </section>
  );
}
