'use client';

import { useEffect, useRef } from 'react';
import { useAfterEntrance, useDesktopFx } from '@/lib/perf';
import { onPointerMove } from '@/lib/pointer';
import { useScrollProgress } from '@/lib/scroll-fx';
import { PIECES } from './LogoPieces';

/**
 * Isla de efectos del símbolo del hero (LogoSymbol es un componente de servidor). No pinta nada: en escritorio, al terminar la entrada y con el
 * navegador libre, engancha el seguimiento del cursor, la vista explotada con el scroll, la sombra y el brillo escribiendo `style` sobre los
 * elementos que ya están en el HTML. En móvil y con "reducir movimiento" no hace nada y el símbolo no hidrata.
 */
export function LogoSymbolFx() {
  const mark = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLElement | null>(null);
  const scrollTarget = useRef<HTMLElement | null>(null);
  const fx = useDesktopFx();
  const ready = useAfterEntrance();
  useEffect(() => {
    root.current = mark.current?.closest<HTMLElement>('[data-logo]') ?? null;
    scrollTarget.current = root.current?.closest<HTMLElement>('[data-hero]') ?? null;
  }, []);
  useLogoFx(root, scrollTarget, fx && ready);
  return <span ref={mark} hidden />;
}

/** Fracción de la profundidad de cada pieza que se desplaza con el cursor (antes 1: las piezas se separaban hasta ±60 px y parecían capas sueltas). */
const SHIFT = 0.2;
const quantize = (v: number) => Math.round(v * 24) / 24;
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Parallax con el cursor + vista explotada con el scroll, sin `motion`. Suaviza con una aproximación exponencial (equivale a los resortes
 * que había) y solo corre mientras algo se mueve: en reposo no queda ningún `requestAnimationFrame`.
 * - Sin movimiento del cursor durante 3,5 s, el símbolo describe una órbita lenta, pero solo los primeros 8 s (después queda quieto).
 * - Brillo y sombra siguen al valor cuantizado a 1/24: pasos de ~1 % del brillo y < 0,5 px de sombra, pero solo repintan al cambiar de escalón.
 */
function useLogoFx(root: React.RefObject<HTMLElement | null>, scrollTarget: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const api = useRef<{ explode: (p: number) => void }>({ explode: () => {} });
  useScrollProgress(scrollTarget, 'hero', (p) => api.current.explode(p), enabled);

  useEffect(() => {
    if (!enabled || !root.current) return;
    const el = root.current;
    const stage = el.querySelector<HTMLElement>('[data-stage]')!;
    const group = el.querySelector<HTMLElement>('[data-group]')!;
    group.classList.add('logo-shadow', 'logo-shadow-in');
    const halo = el.querySelector<HTMLElement>('[data-halo]');
    const parts = [...el.querySelectorAll<HTMLElement>('[data-piece]')].map((node, i) => ({
      node,
      sheen: node.querySelector<HTMLElement>('[data-sheen]'),
      p: PIECES[i],
    }));

    const born = performance.now();
    let lastMove = -Infinity;
    // objetivo y valor suavizado: puntero (-1..1) y explosión (0..1)
    let tx = 0, ty = 0, x = 0, y = 0, te = 0, e = 0;
    let qxPrev = NaN, qyPrev = NaN;
    let raf = 0, prev = 0;

    const apply = () => {
      stage.style.transform = `rotateX(${-y * 12}deg) rotateY(${x * 14}deg)`;
      if (halo) halo.style.transform = `translate3d(${-x * 30}px, ${-y * 30}px, 0)`;
      const qx = quantize(x), qy = quantize(y);
      const changed = qx !== qxPrev || qy !== qyPrev;
      for (const c of parts) {
        const { depth, explode } = c.p;
        // El desplazamiento propio de cada pieza es solo una fracción (SHIFT) de su profundidad: la inclinación del conjunto da la sensación de
        // volumen y los cortes no se separan ni se solapan al mover el cursor. La separación grande solo ocurre con el scroll (vista explotada).
        c.node.style.transform = `translate3d(${x * depth * SHIFT + e * explode.x}px, ${y * depth * SHIFT + e * explode.y}px, 0) rotate(${e * explode.r}deg)`;
        if (changed && c.sheen) {
          c.sheen.style.setProperty('--lx', `${50 + qx * (30 + depth * 0.4)}%`);
          c.sheen.style.setProperty('--ly', `${45 + qy * (30 + depth * 0.4)}%`);
        }
      }
      if (changed) {
        qxPrev = qx; qyPrev = qy;
        group.style.setProperty('--sx', `${-qx * 12}px`);
        group.style.setProperty('--sy', `${14 - qy * 12}px`);
      }
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min((now - (prev || now)) / 1000, 0.05);
      prev = now;
      const orbit = now - lastMove > 3500 && now - born < 8000;
      if (orbit) { tx = Math.sin(now * 0.00045) * 0.55; ty = Math.cos(now * 0.00032) * 0.4; }
      const k = 1 - Math.exp(-dt / 0.14); // τ ≈ 0,14 s (como el resorte de rigidez 60 y amortiguación 18)
      x += (tx - x) * k; y += (ty - y) * k; e += (te - e) * k;
      apply();
      const moving = Math.abs(tx - x) > 0.0005 || Math.abs(ty - y) > 0.0005 || Math.abs(te - e) > 0.0005;
      if (moving || orbit) raf = requestAnimationFrame(frame);
      else prev = 0;
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const offMove = onPointerMove((ev) => {
      lastMove = performance.now();
      tx = (ev.clientX / window.innerWidth) * 2 - 1;
      ty = (ev.clientY / window.innerHeight) * 2 - 1;
      wake();
    });
    const handlers = api.current; // el objeto no se reasigna: se usa el mismo en la limpieza
    handlers.explode = (p) => { te = clamp01(p / 0.7); wake(); };
    wake();

    return () => {
      offMove();
      group.classList.remove('logo-shadow', 'logo-shadow-in');
      cancelAnimationFrame(raf);
      handlers.explode = () => {};
      // vuelve al estado de reposo (símbolo ensamblado)
      stage.style.transform = '';
      if (halo) halo.style.transform = '';
      for (const c of parts) c.node.style.transform = '';
    };
  }, [enabled, root]);
}
