'use client';

import { useEffect, useRef } from 'react';
import { useDesktopFx } from '@/lib/perf';
import { useScrollProgress } from '@/lib/scroll-fx';

/**
 * Efectos de scroll del hero (solo escritorio y sin "reducir movimiento"): al bajar, el contenido se aleja (escala + desvanecido), el fondo
 * hace parallax y el enlace "Descubre" se desvanece. Es una isla que no pinta nada: el hero es un componente de servidor y esta isla busca
 * sus elementos marcados (`data-hero-out`, `data-hero-bg`, `data-hero-hint`) dentro de la sección `[data-hero]`, así que en móvil el hero no
 * hidrata nada de esto. Sin JavaScript, o antes de hidratar, todo queda en su posición de reposo.
 */
export function HeroScrollFx() {
  const mark = useRef<HTMLSpanElement>(null);
  const target = useRef<HTMLElement | null>(null);
  const els = useRef<{ out: HTMLElement | null; bg: HTMLElement | null; hint: HTMLElement | null }>({ out: null, bg: null, hint: null });
  const fx = useDesktopFx();

  useEffect(() => {
    const section = mark.current?.closest<HTMLElement>('[data-hero]') ?? null;
    target.current = section;
    els.current = {
      out: section?.querySelector<HTMLElement>('[data-hero-out]') ?? null,
      bg: section?.querySelector<HTMLElement>('[data-hero-bg]') ?? null,
      hint: section?.querySelector<HTMLElement>('[data-hero-hint]') ?? null,
    };
  }, []);

  useScrollProgress(target, 'hero', (p) => {
    const { out, bg, hint } = els.current;
    if (out) {
      out.style.transform = p ? `translate3d(0, ${140 * p}px, 0) scale(${1 - 0.12 * p})` : '';
      out.style.opacity = p ? String(Math.max(0, 1 - p / 0.8)) : '';
    }
    if (bg) bg.style.transform = p ? `translate3d(0, ${25 * p}%, 0)` : '';
    if (hint) hint.style.opacity = p ? String(Math.max(0, 1 - p / 0.8)) : '';
  }, fx);

  return <span ref={mark} hidden />;
}
