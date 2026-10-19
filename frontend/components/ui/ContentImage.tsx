import Image from 'next/image';

const REMOTE = /^https?:\/\//i;

interface Props {
  src: string;
  alt: string;
  /** Ancho real con el que se pinta (media queries de CSS), para que el navegador elija el tamaño justo. */
  sizes: string;
  /** Solo para lo que se ve en la primera pantalla: carga con prioridad y sin lazy. */
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** Tamaño fijo (avatares): sin `fill`, con ancho y alto reservados. */
  width?: number;
  height?: number;
  draggable?: boolean;
}

/**
 * Imagen de contenido (portafolio, servicios, testimonios, hero).
 * - Las rutas de `public/` (`/trabajos/cocina.webp`) pasan por el optimizador de Next: AVIF/WebP y varios anchos.
 * - Las URL absolutas no están en `images.remotePatterns`, así que se sirven tal cual (`unoptimized`).
 * - Con `fill` el contenedor padre debe ser `relative` y tener su tamaño o `aspect-ratio`: así el espacio queda
 *   reservado antes de que cargue la imagen y la página no salta (CLS). Sin `fill` hay que pasar `width` y `height`.
 * - Es lazy por defecto; `priority` la carga de inmediato (usarlo solo arriba del pliegue).
 */
export function ContentImage({ src, alt, sizes, priority = false, className, style, width, height, draggable }: Props) {
  const common = { src, sizes, priority, className, style, draggable, unoptimized: REMOTE.test(src) || undefined };
  if (width && height) return <Image {...common} alt={alt} width={width} height={height} />;
  return <Image {...common} alt={alt} fill />;
}
