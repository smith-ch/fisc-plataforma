# Análisis del JavaScript del frontend

```bash
npm --prefix frontend run analyze      # build con @next/bundle-analyzer; solo en local
```

Deja los reportes en `frontend/.next/analyze/` (`client.html` es el del navegador). Sin la variable `ANALYZE=true` el plugin no se activa y el build es el normal.

## Qué pesa hoy en `/` (2026-10-19, gzip, JavaScript inicial)

| Pieza | Tamaño aprox. | Nota |
|---|---|---|
| Next.js + React (runtime, router, hidratación) | ≈ 108 kB | Va en toda ruta; no se puede quitar. |
| `motion` (núcleo de animación: resortes, scroll, valores) | ≈ 45 kB | Lo usan `useScroll`, `useSpring`, `useInView`, `useMotionValue`. |
| Código propio del sitio | ≈ 15 kB | |
| `lucide-react` | ≈ 5 kB | Ya se importa ícono por ícono; solo entran los que se usan. |
| `lenis` (scroll suave) | ≈ 5 kB | Se carga aparte y solo en escritorio. |

## Qué se hizo y qué no movió la aguja
- `LazyMotion` + `m.*` (`components/MotionProvider.tsx`): las funciones de animación (`animate`, `exit`, `whileInView`, hover) salen del JavaScript inicial a un chunk aparte (`lib/motion-features.ts`). El «First Load JS» de `/` baja de 179 a 177 kB, pero **ese chunk se descarga igual durante la carga**, así que los kB transferidos medidos con Lighthouse no cambian.
- `CartDrawer` con `next/dynamic` (`ssr: false`): solo se descarga después de la carga; el panel no ocupa espacio mientras está cerrado.
- Bajar de verdad los ~45 kB de `motion` pide sustituir las animaciones por CSS (`Reveal`, `ScrollProgress`, el menú, el acordeón de FAQ, el ícono del tema, `SpotlightCard`, `Magnetic`) y cargar con `next/dynamic` los efectos solo de escritorio (`LogoParallax`, los efectos de scroll del hero). Es un cambio más grande con riesgo visual; queda como siguiente paso.
