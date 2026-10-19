'use client';

import { useEffect, useRef } from 'react';

/**
 * Efectos ligados al scroll sin `motion`: un único listener de `scroll` compartido, que lee todas las posiciones y después escribe
 * (sin mezclar lecturas y escrituras de layout), una vez por fotograma. Cada efecto recibe el progreso `p` (0..1) y pinta con `style`.
 *
 * - `hero`: 0 cuando el elemento toca el borde superior; 1 cuando su borde inferior lo toca (offset `start start` → `end start`).
 * - `through`: 0 cuando asoma por abajo; 1 cuando sale por arriba (`start end` → `end start`).
 * - `sticky`: 0 al fijarse arriba; 1 cuando su final llega al final de la pantalla (`start start` → `end end`).
 * - `page`: avance de lectura de toda la página.
 */
export type ScrollMode = 'hero' | 'through' | 'sticky' | 'page';

interface Sub { el: HTMLElement | null; mode: ScrollMode; apply: (p: number) => void; last: number }

const subs = new Set<Sub>();
let queued = false;

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

function progress(s: Sub, vh: number): number {
  if (s.mode === 'page') {
    const max = document.documentElement.scrollHeight - vh;
    return max > 0 ? clamp01(window.scrollY / max) : 0;
  }
  if (!s.el) return 0;
  const r = s.el.getBoundingClientRect();
  if (s.mode === 'hero') return clamp01(-r.top / (r.height || 1));
  if (s.mode === 'through') return clamp01((vh - r.top) / (vh + r.height));
  return clamp01(-r.top / Math.max(1, r.height - vh));
}

function frame() {
  queued = false;
  const vh = window.innerHeight;
  const todo: [Sub, number][] = [];
  for (const s of subs) {
    const p = progress(s, vh);
    if (p !== s.last) todo.push([s, p]);
  }
  for (const [s, p] of todo) { s.last = p; s.apply(p); }
}

function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(frame);
}

function subscribe(sub: Sub): () => void {
  if (subs.size === 0) {
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
  }
  subs.add(sub);
  schedule();
  return () => {
    subs.delete(sub);
    if (subs.size === 0) {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    }
  };
}

/**
 * Llama a `apply(p)` cada vez que cambia el progreso de scroll de `target` (o de la página con `mode: 'page'`).
 * Al desactivarse (`enabled: false`) o desmontarse llama a `apply(0)` para dejar el elemento en su estado de reposo.
 */
export function useScrollProgress(
  target: React.RefObject<HTMLElement | null> | null,
  mode: ScrollMode,
  apply: (p: number) => void,
  enabled = true,
) {
  const applyRef = useRef(apply);
  applyRef.current = apply;
  useEffect(() => {
    if (!enabled) return;
    const unsub = subscribe({ el: target?.current ?? null, mode, apply: (p) => applyRef.current(p), last: -1 });
    return () => { unsub(); applyRef.current(0); };
  }, [target, mode, enabled]);
}
