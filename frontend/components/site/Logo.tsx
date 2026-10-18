import Image from 'next/image';
import Link from 'next/link';

/** Símbolo de 422×511 mostrado a ~36 px de alto; los logos subidos desde el panel no pasan por el optimizador. */
const dims = (src: string) => ({ width: 422, height: 511, sizes: '30px', unoptimized: !src.startsWith('/brand/') });

/**
 * Logotipo F.I.S.C.: símbolo + nombre.
 * `light` fuerza la versión blanca (para secciones siempre oscuras); sin él, el
 * logo sigue el tema: negro en modo claro y blanco en modo oscuro.
 */
export function Logo({ name, tagline, logoUrl, logoLightUrl, light = false }: {
  name: string; tagline?: string; logoUrl?: string; logoLightUrl?: string; light?: boolean;
}) {
  const white = logoLightUrl || '/brand/symbol-white.webp';
  const black = logoUrl || '/brand/symbol-black.webp';
  const img = 'h-9 w-auto transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110';
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      {light ? <Image src={white} alt={name} {...dims(white)} className={img} /> : (
        <>
          <Image src={black} alt={name} {...dims(black)} className={`${img} dark:hidden`} />
          <Image src={white} alt={name} {...dims(white)} className={`${img} hidden dark:block`} />
        </>
      )}
      <span className={`leading-none ${light ? 'text-white' : 'text-ink-900'}`}>
        <span className="block font-display text-lg font-bold tracking-[0.14em]">{name}</span>
        {tagline && <span className={`mt-0.5 block text-[9px] font-semibold tracking-[0.28em] uppercase ${light ? 'text-white/60' : 'text-ink-900/50'}`}>{tagline}</span>}
      </span>
    </Link>
  );
}
