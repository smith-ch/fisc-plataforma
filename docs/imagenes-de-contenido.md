# Imágenes del contenido (portafolio, servicios, testimonios, hero)

Las imágenes se guardan en `frontend/public/` y su ruta se escribe en `frontend/data/contenido.ts` o `frontend/data/catalogo.ts`
(por ejemplo `/trabajos/cocina-antes.webp`). Se muestran con el componente `ContentImage` (`components/ui/ContentImage.tsx`), que usa `next/image`:

- Next genera AVIF/WebP y varios anchos, y el navegador descarga el que corresponde a su pantalla (`sizes` según el ancho real de cada sección). Una foto de 4000 px no se descarga entera en un móvil.
- Cada imagen vive dentro de un contenedor con `aspect-ratio` o tamaño fijo: el espacio queda reservado y la página no salta al cargar (CLS).
- Todas son `lazy`, salvo las de la primera pantalla (imagen del hero y la portada de un servicio), que llevan `priority`.
- El comparador antes/después (`BeforeAfter`) usa `touch-action: pan-y`: el dedo mueve el divisor en horizontal y el scroll vertical de la página sigue funcionando. También responde a las flechas del teclado.

## Recomendaciones para quien sube fotos
- Formato JPG, WebP o AVIF; no hace falta reducirlas a mano, pero sí evitar archivos de más de ~5 MB.
- Portafolio (antes y después): misma proporción 4:3 en ambas fotos (se recortan con `object-cover`).
- Servicios: proporción 16:9 o 3:2. Avatares: cuadradas.
- Un URL absoluto (`https://…`) se sirve tal cual, sin optimizar. Para que pase por el optimizador hay que agregar su dominio a `images.remotePatterns` en `frontend/next.config.ts`.

## Cómo comprobar el rendimiento en móvil
Lighthouse 12 en modo móvil (valor por defecto) contra `next start`:

```bash
npm --prefix frontend run build
npm --prefix frontend start            # puerto 3000
npx lighthouse@12 http://localhost:3000/ --only-categories=performance --view
```

Repetir 3 veces y comparar LCP, CLS, TBT y el peso total de imágenes (`total-byte-weight`).
