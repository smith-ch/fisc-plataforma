'use client';

import dynamic from 'next/dynamic';
import { preload } from 'react-dom';
import { useDesktopFx } from '@/lib/perf';
import { PIECES, type Variant } from './LogoPieces';

/*
 * Efectos del logo solo de escritorio: usan `motion` (resortes, parallax con el cursor y con el scroll), que pesa ~45 kB gzip.
 * Se descargan con `next/dynamic` (sin SSR) únicamente cuando `useDesktopFx()` es verdadero (ya hidratado y sin móvil ni «reducir movimiento»), así que en móvil ni se piden.
 * El HTML del servidor trae el hueco (`.only-desktop`) y el CSS lo oculta en móvil; no hay parpadeo ni salto de diseño.
 */
const LogoParallaxFx = dynamic(() => import('./LogoParallax').then((mod) => mod.LogoParallax), { ssr: false });
const ShardsFieldFx = dynamic(() => import('./LogoParallax').then((mod) => mod.ShardsField), { ssr: false });

type Target = React.RefObject<HTMLElement | null>;

/** Símbolo animado del hero (parallax, brillo, sombra). Reserva su espacio (relación de aspecto del logo) mientras llega el código. */
export function LogoParallax({ variant = 'auto', scrollTarget }: { variant?: Variant; scrollTarget?: Target }) {
  const fx = useDesktopFx();
  // Las máscaras del brillo se descubren por CSS (tarde); se precargan para que la pieza no espere por ellas
  // `media`: en móvil el hero usa `LogoStatic`, que no necesita estas máscaras.
  for (const p of PIECES) preload(`/brand/piece-${p.id}-white.webp`, { as: 'image', media: '(min-width: 768px) and (pointer: fine)' });
  return (
    <div className="only-desktop aspect-[422/511] w-full">
      {fx && <LogoParallaxFx variant={variant} scrollTarget={scrollTarget} />}
    </div>
  );
}

/**
 * Campo de fragmentos del hero. En móvil y con "reducir movimiento" no se monta ni se descarga: son 8 piezas con `blur()`,
 * animación continua, `useScroll` y seguimiento de puntero.
 */
export function LogoShards({ variant = 'auto', scrollTarget }: { variant?: Variant; scrollTarget?: Target }) {
  const fx = useDesktopFx();
  return <div className="only-desktop absolute inset-0">{fx && <ShardsFieldFx variant={variant} scrollTarget={scrollTarget} />}</div>;
}
