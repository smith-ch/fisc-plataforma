import { useEffect, useState, useSyncExternalStore } from 'react';

/**
 * Pantalla chica o táctil: lo que de verdad define si el equipo es "móvil" (no solo núcleos o memoria, que deja fuera
 * a casi todos los celulares de gama media). Es la misma condición que usan las clases `.only-mobile` / `.only-desktop`
 * de globals.css.
 */
export const MOBILE_QUERY = '(max-width: 767px), (pointer: coarse)';

/** Como `MOBILE_QUERY` pero también con "reducir movimiento": el hero va en su versión ligera y estática. */
export const LIGHT_HERO_QUERY = `${MOBILE_QUERY}, (prefers-reduced-motion: reduce)`;

export function matchesMedia(query: string): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

/**
 * Móviles, equipos de gama baja o con ahorro de datos: se omiten el scroll suave (Lenis) y los
 * canvas animados; quedan el degradado y la malla dibujados una sola vez.
 */
export function isLowPowerDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const n = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return !!n.connection?.saveData || (n.deviceMemory ?? 8) <= 4 || (n.hardwareConcurrency ?? 8) <= 4 || matchesMedia(MOBILE_QUERY);
}

/**
 * ¿Hay que usar la versión ligera del hero? En el servidor y en la hidratación vale `false` (el HTML lleva las dos versiones y el CSS
 * muestra la que corresponde, así que no hay parpadeo); al hidratar se actualiza y en móvil se desmonta la versión pesada.
 */
export function useLightHero(): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
      const mq = window.matchMedia(LIGHT_HERO_QUERY);
      mq.addEventListener('change', notify);
      return () => mq.removeEventListener('change', notify);
    },
    () => matchesMedia(LIGHT_HERO_QUERY),
    () => false,
  );
}

/**
 * ¿Hay que cargar los efectos de escritorio (parallax del logo, fragmentos, scroll del hero)? Es lo contrario de `useLightHero()`,
 * pero vale `false` en el servidor y durante la hidratación *también en escritorio*: solo pasa a `true` después, ya con el
 * valor real del equipo. Así un móvil nunca llega a montar (ni a descargar) los componentes cargados con `next/dynamic`.
 */
export function useDesktopFx(): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
      const mq = window.matchMedia(LIGHT_HERO_QUERY);
      mq.addEventListener('change', notify);
      return () => mq.removeEventListener('change', notify);
    },
    () => !matchesMedia(LIGHT_HERO_QUERY),
    () => false,
  );
}

/**
 * `true` pasados `ms` milisegundos desde el montaje, y solo cuando el navegador queda libre (`requestIdleCallback`). Sirve para no empezar
 * trabajo pesado (efectos interactivos, fondos animados) mientras corre la animación de entrada: así la entrada tiene todos los fotogramas.
 */
export function useAfterEntrance(ms = 1300): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let idle = 0;
    const t = window.setTimeout(() => {
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(() => setReady(true), { timeout: 600 });
      else setReady(true);
    }, ms);
    return () => {
      window.clearTimeout(t);
      if (idle && 'cancelIdleCallback' in window) window.cancelIdleCallback(idle);
    };
  }, [ms]);
  return ready;
}
