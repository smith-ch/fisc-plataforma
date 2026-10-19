import Image from 'next/image';

export type Variant = 'white' | 'black' | 'auto';

/**
 * Imagen de una pieza (WebP de 422×511 servido por next/image); con `auto` se
 * muestra la negra en claro y la blanca en oscuro. `sizes` es el ancho real con
 * que se pinta, para que el optimizador sirva el tamaño justo.
 */
export function PieceImg({ id, variant, sizes, className = '', style }: { id: string; variant: Variant; sizes: string; className?: string; style?: React.CSSProperties }) {
  const img = (v: 'black' | 'white', cls: string) => (
    <Image src={`/brand/piece-${id}-${v}.webp`} alt="" width={422} height={511} sizes={sizes} draggable={false} className={cls} style={style} />
  );
  if (variant !== 'auto') return img(variant, className);
  return (
    <>
      {img('black', `${className} dark:hidden`)}
      {img('white', `${className} hidden dark:block`)}
    </>
  );
}


/**
 * Símbolo F.I.S.C. armado con sus 4 piezas (recortadas del logo oficial).
 * - Al cargar, las piezas llegan desde afuera y se ensamblan.
 * - Con el cursor, cada pieza se desplaza según su profundidad (parallax 3D)
 *   y el conjunto se inclina.
 * - Al hacer scroll las piezas se separan en una "vista explotada".
 */
export const PIECES = [
  { id: 'f', depth: 18, explode: { x: -70, y: -60, r: -8 }, enter: { x: -260, y: -120 } },
  { id: 's-top', depth: 38, explode: { x: 60, y: -30, r: 7 }, enter: { x: 240, y: -160 } },
  { id: 's-mid', depth: 60, explode: { x: -30, y: 40, r: -6 }, enter: { x: -80, y: 220 } },
  { id: 's-bottom', depth: 28, explode: { x: 40, y: 110, r: 6 }, enter: { x: 200, y: 260 } },
] as const;


/**
 * Versión ligera del símbolo para móvil y "reducir movimiento": las 4 piezas ensambladas, sin movimiento, sin `filter`
 * (ni blur ni drop-shadow), sin `mix-blend-mode` y sin hooks de scroll ni de puntero. El halo es un degradado radial, no un desenfoque.
 */
export function LogoStatic({ variant = 'auto', className = '' }: { variant?: Variant; className?: string }) {
  return (
    <div className={`relative aspect-[422/511] w-full ${className}`}>
      <div aria-hidden className="absolute inset-[4%] rounded-full"
        style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 35%, transparent) 0%, transparent 68%)' }} />
      {PIECES.map((p) => (
        <div key={p.id} className="absolute inset-0">
          <PieceImg id={p.id} variant={variant} sizes="(min-width: 640px) 224px, 176px" className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}

