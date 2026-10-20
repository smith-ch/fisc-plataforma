'use client';

import dynamic from 'next/dynamic';
import { useAfterEntrance, useDesktopFx } from '@/lib/perf';
import type { Variant } from './LogoPieces';

/*
 * Fragmentos del logo del hero, solo de escritorio: usan `motion` (parallax con el cursor y con el scroll), que pesa ~45 kB gzip. Se descargan
 * con `next/dynamic` (sin SSR) únicamente cuando `useDesktopFx()` es verdadero (ya hidratado y sin móvil ni «reducir movimiento») y cuando termina
 * la entrada, así que en móvil ni se piden. El HTML trae el hueco (`.only-desktop`) y el CSS lo oculta en móvil: sin parpadeo ni saltos.
 * El símbolo principal (`LogoSymbol`) ya no usa `motion`.
 */
const ShardsFieldFx = dynamic(() => import('./LogoParallax').then((mod) => mod.ShardsField), { ssr: false });

type Target = React.RefObject<HTMLElement | null>;

/** Campo de fragmentos del hero. En móvil y con "reducir movimiento" no se monta ni se descarga: son 8 piezas con `blur()`, animación continua y seguimiento de puntero. */
export function LogoShards({ variant = 'auto', scrollTarget }: { variant?: Variant; scrollTarget?: Target }) {
  const fx = useDesktopFx();
  const after = useAfterEntrance(900); // entran justo después del símbolo, con un fundido corto
  return <div className="only-desktop absolute inset-0">{fx && after && <ShardsFieldFx variant={variant} scrollTarget={scrollTarget} />}</div>;
}
