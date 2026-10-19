import { matchesMedia } from './perf';

/**
 * Un único listener de `pointermove` / `pointerdown` en `window` compartido por todos los efectos de la página
 * (fondos interactivos, logo del hero...). Antes cada componente registraba el suyo: con 9 fondos montados, cada movimiento del
 * puntero ejecutaba 9+ handlers. Además solo se registra si el equipo tiene ratón: en una pantalla táctil no hay "puntero que
 * seguir" y los toques disparaban ondas y trabajo que no aportan nada.
 */
export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';

/** ¿Hay ratón (o trackpad) con hover real? */
export function hasFinePointer(): boolean {
  return matchesMedia(FINE_POINTER_QUERY);
}

type Handler = (e: PointerEvent) => void;

function channel(type: 'pointermove' | 'pointerdown') {
  const handlers = new Set<Handler>();
  const dispatch: Handler = (e) => { for (const h of handlers) h(e); };
  return function subscribe(handler: Handler): () => void {
    if (typeof window === 'undefined' || !hasFinePointer()) return () => {};
    if (handlers.size === 0) window.addEventListener(type, dispatch, { passive: true });
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) window.removeEventListener(type, dispatch);
    };
  };
}

/** Suscribe a `pointermove` (solo con ratón). Devuelve la función para cancelar. */
export const onPointerMove = channel('pointermove');
/** Suscribe a `pointerdown` (solo con ratón). Devuelve la función para cancelar. */
export const onPointerDown = channel('pointerdown');
