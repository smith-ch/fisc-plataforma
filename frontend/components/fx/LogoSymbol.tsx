import { preload } from 'react-dom';
import { LogoSymbolFx } from './LogoSymbolFx';
import { PIECES, PieceImg, type Variant } from './LogoPieces';

/**
 * Símbolo F.I.S.C. del hero armado con sus 4 piezas: un único DOM para todo el ciclo de vida.
 *
 * 1. Servidor/primer pintado: las piezas llegan desde fuera con CSS (`.logo-in`, solo transform y opacidad) sin esperar a JavaScript.
 * 2. Escritorio, al terminar la entrada y con el navegador libre: `LogoSymbolFx` engancha el seguimiento del cursor, la "vista explotada" con el
 *    scroll, la sombra y el brillo escribiendo `style` directamente sobre los mismos elementos. No hay una segunda capa ni imágenes nuevas.
 * 3. Móvil / "reducir movimiento": se queda en el paso 1 (sin sombra, brillo ni mezclas; ver `.only-desktop` y `.logo-shadow` en globals.css).
 *
 * Ensamblado: las 4 piezas están en el mismo plano y el conjunto se inclina como un cuerpo rígido, y la sombra la proyecta el conjunto entero
 * (no cada pieza). Así los cortes siempre encajan y las piezas no parecen capas apiladas. Las piezas salen del símbolo completo con un reparto
 * limpio: cada píxel pertenece a una sola pieza (más 1 px de solape en el núcleo opaco), así que en reposo componen exactamente el símbolo.
 */
export function LogoSymbol({ variant = 'auto' }: { variant?: Variant }) {
  // Las máscaras del brillo se descubren por CSS (tarde): se precargan solo donde hay brillo (escritorio con ratón)
  for (const p of PIECES) preload(`/brand/piece-${p.id}-white.webp`, { as: 'image', crossOrigin: 'anonymous', media: '(min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference)' });

  return (
    <div data-logo className="relative aspect-[422/511] w-full [perspective:1200px]">
      {/* Halo de luz detrás del símbolo: degradado en móvil; desenfoque (que se desplaza al revés que el cursor) en escritorio */}
      <div aria-hidden className="only-mobile absolute inset-[4%] rounded-full"
        style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 35%, transparent) 0%, transparent 68%)' }} />
      <div data-halo aria-hidden className="only-desktop absolute inset-[8%] rounded-full bg-accent/30 blur-3xl dark:bg-accent/25">
        <div className="absolute inset-[25%] rounded-full bg-brand/40 blur-2xl dark:bg-white/10" />
      </div>
      {/* La sombra (un filtro sobre el conjunto) la añade LogoSymbolFx al terminar la entrada: durante ella las piezas se mueven y el filtro se recalcularía en cada fotograma */}
      <div data-group className="absolute inset-0 select-none">
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
      <LogoSymbolFx />
    </div>
  );
}
