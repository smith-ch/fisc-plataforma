'use client';

import { LazyMotion } from 'motion/react';

/**
 * Las funciones de animación de `motion` (animate, exit, whileInView, hover...) se descargan en un chunk aparte, después de cargar la
 * página, en vez de ir en el JavaScript inicial. Los componentes usan `m.*` (la versión mínima, sin funciones incluidas) en lugar de
 * `motion.*`; `strict` hace que usar `motion.*` por error falle en desarrollo. Mientras llega el chunk, los elementos se ven en su
 * estado inicial (el del HTML del servidor) y empiezan a animarse al cargar.
 */
const loadFeatures = () => import('@/lib/motion-features').then((mod) => mod.default);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={loadFeatures} strict>{children}</LazyMotion>;
}
