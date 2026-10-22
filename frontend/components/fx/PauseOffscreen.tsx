'use client';

import { useEffect, useRef } from 'react';

/**
 * Contenedor de una animación CSS infinita (marquesinas): la pausa mientras queda fuera de pantalla.
 * Escribe `data-offscreen` directamente en el DOM (sin estado de React, sin re-render) y la animación se pausa con
 * `data-[offscreen=true]:[animation-play-state:paused]` en las clases del hijo animado. Sin JavaScript, la animación corre como antes.
 */
export function PauseOffscreen({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => { el.dataset.offscreen = String(!e.isIntersecting); }, { rootMargin: '100px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
}
