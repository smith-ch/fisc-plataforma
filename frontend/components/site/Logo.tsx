import Link from 'next/link';

/**
 * Logotipo F.I.S.C.: símbolo + nombre.
 * `light` fuerza la versión blanca (para secciones siempre oscuras); sin él, el
 * logo sigue el tema: negro en modo claro y blanco en modo oscuro.
 */
export function Logo({ name, tagline, logoUrl, logoLightUrl, light = false }: {
  name: string; tagline?: string; logoUrl?: string; logoLightUrl?: string; light?: boolean;
}) {
  const white = logoLightUrl || '/brand/symbol-white.png';
  const black = logoUrl || '/brand/symbol-black.png';
  const img = 'h-9 w-auto transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110';
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      {/* eslint-disable @next/next/no-img-element */}
      {light ? <img src={white} alt={name} className={img} /> : (
        <>
          <img src={black} alt={name} className={`${img} dark:hidden`} />
          <img src={white} alt={name} className={`${img} hidden dark:block`} />
        </>
      )}
      {/* eslint-enable @next/next/no-img-element */}
      <span className={`leading-none ${light ? 'text-white' : 'text-ink-900'}`}>
        <span className="block font-display text-lg font-bold tracking-[0.14em]">{name}</span>
        {tagline && <span className={`mt-0.5 block text-[9px] font-semibold tracking-[0.28em] uppercase ${light ? 'text-white/60' : 'text-ink-900/50'}`}>{tagline}</span>}
      </span>
    </Link>
  );
}
