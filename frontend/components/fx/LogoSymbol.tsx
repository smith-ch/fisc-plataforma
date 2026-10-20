'use client';

import { useEffect, useRef } from 'react';
import { preload } from 'react-dom';
import { useAfterEntrance, useDesktopFx } from '@/lib/perf';
import { onPointerMove } from '@/lib/pointer';
import { useScrollProgress } from '@/lib/scroll-fx';
import { PIECES, PieceImg, type Variant } from './LogoPieces';

/**
 * Símbolo F.I.S.C. del hero armado con sus 4 piezas: un único DOM para todo el ciclo de vida.
 *
 * 1. Servidor/primer pintado: las piezas llegan desde fuera con CSS (`.logo-in`, solo transform y opacidad) sin esperar a JavaScript.
 * 2. Escritorio, al terminar la entrada y con el navegador libre: `useLogoFx` engancha el seguimiento del cursor, la "vista explotada" con el
 *    scroll, la sombra y el brillo escribiendo `style` directamente sobre los mismos elementos. No hay una segunda capa ni imágenes nuevas.
 * 3. Móvil / "reducir movimiento": se queda en el paso 1 (sin sombra, brillo ni mezclas; ver `.only-desktop` y `.logo-shadow` en globals.css).
 *
 * Ensamblado: las 4 piezas están en el mismo plano y el conjunto se inclina como un cuerpo rígido, y la sombra la proyecta el conjunto entero
 * (no cada pieza). Así los cortes siempre encajan y las piezas no parecen capas apiladas. Las piezas salen del símbolo completo con un reparto
 * limpio: cada píxel pertenece a una sola pieza (más 1 px de solape en el núcleo opaco), así que en reposo componen exactamente el símbolo.
 */
export function LogoSymbol({ variant = 'auto', scrollTarget }: { variant?: Variant; scrollTarget?: React.RefObject<HTMLElement | null> }) {
  const root = useRef<HTMLDivElement>(null);
  const fx = useDesktopFx();
  const ready = useAfterEntrance();
  const active = fx && ready;
  useLogoFx(root, scrollTarget, active);
  // Las máscaras del brillo se descubren por CSS (tarde): se precargan solo donde hay brillo (escritorio con ratón)
  for (const p of PIECES) preload(`/brand/piece-${p.id}-white.webp`, { as: 'image', media: '(min-width: 768px) and (pointer: fine)' });

  return (
    <div ref={root} className="relative aspect-[422/511] w-full [perspective:1200px]">
      {/* Halo de luz detrás del símbolo: degradado en móvil; desenfoque (que se desplaza al revés que el cursor) en escritorio */}
      <div aria-hidden className="only-mobile absolute inset-[4%] rounded-full"
        style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 35%, transparent) 0%, transparent 68%)' }} />
      <div data-halo aria-hidden className="only-desktop absolute inset-[8%] rounded-full bg-accent/30 blur-3xl dark:bg-accent/25">
        <div className="absolute inset-[25%] rounded-full bg-brand/40 blur-2xl dark:bg-white/10" />
      </div>
      {/* La sombra (un filtro sobre el conjunto) se activa al terminar la entrada: durante ella las piezas se mueven y el filtro se recalcularía en cada fotograma */}
      <div data-group className={`absolute inset-0 select-none ${active ? 'logo-shadow logo-shadow-in' : ''}`}>
        <div data-stage className="absolute inset-0">
          {PIECES.map((p, i) => (
            <div key={p.id} data-piece className="absolute inset-0">
              <div
                className="logo-in absolute inset-0"
                style={{ '--ex': `${p.enter.x}px`, '--ey': `${p.enter.y}px`, '--er': `${p.explode.r * 3}deg`, '--d': `${i * 0.07}s` } as React.CSSProperties}
              >
                <PieceImg id={p.id} variant={variant} sizes="(min-width: 1024px) 448px, (min-width: 640px) 224px, 176px" className="h-full w-full" eager />
                {/* Reflejo especular: foco de luz recortado con la silueta de la pieza; sigue al cursor (variables --lx / --ly) */}
                <div data-sheen aria-hidden className="logo-sheen only-desktop absolute inset-0 opacity-45 mix-blend-screen dark:opacity-100 dark:mix-blend-soft-light"
                  style={{ mask: `url(/brand/piece-${p.id}-white.webp) center / 100% 100% no-repeat`, WebkitMask: `url(/brand/piece-${p.id}-white.webp) center / 100% 100% no-repeat` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
function useLogoFx(root: React.RefObject<HTMLDivElement | null>, scrollTarget: React.RefObject<HTMLElement | null> | undefined, enabled: boolean) {
  const api = useRef<{ explode: (p: number) => void }>({ explode: () => {} });
  useScrollProgress(scrollTarget ?? null, 'hero', (p) => api.current.explode(p), enabled);

  useEffect(() => {
    if (!enabled || !root.current) return;
    const el = root.current;
    const stage = el.querySelector<HTMLElement>('[data-stage]')!;
    const group = el.querySelector<HTMLElement>('[data-group]')!;
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
      cancelAnimationFrame(raf);
      handlers.explode = () => {};
      // vuelve al estado de reposo (símbolo ensamblado)
      stage.style.transform = '';
      if (halo) halo.style.transform = '';
      for (const c of parts) c.node.style.transform = '';
    };
  }, [enabled, root]);
}
