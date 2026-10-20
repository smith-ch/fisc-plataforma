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

## Segunda pasada: `motion` fuera de la ruta crítica (#42)
Se sustituyó `motion` por CSS, un `IntersectionObserver` compartido y un listener de scroll compartido en todo lo que corre también en móvil:

| Pieza | Ahora |
|---|---|
| `Reveal`, `CountUp` | Clase CSS `.reveal` + `lib/in-view.ts` (un observador por margen). |
| `SplitWords` y entrada escalonada del hero | Animación CSS `.fx-rise` (arranca con la hoja de estilos, sin esperar la hidratación). |
| `ScrollProgress`, `Process`, `PillarCard`, `ScrollOut`/`ScrollBg`/`ScrollHint` del hero | `useScrollProgress` (`lib/scroll-fx.ts`): lee todas las posiciones y luego escribe `style`, una vez por fotograma. |
| `SpotlightCard`, `Magnetic` | `style.transform` directo + `transition` CSS (sin resortes; solo con ratón). |
| Menú móvil del `Header` | Siempre montado; abrir/cerrar es una transición CSS (`invisible` lo saca del tabulador). |
| Acordeón de FAQ | `grid-template-rows: 0fr → 1fr`. Las respuestas ahora van en el HTML del servidor. |
| Ícono del tema | Animación CSS de entrada, solo al alternar. |

`motion` queda solo en chunks que se piden aparte: `LogoParallax` y `ShardsField` (`components/fx/LogoLazy.tsx`, con `next/dynamic` y `ssr: false`, solo si `useLightHero()` es falso) y `CartDrawer`, que ahora usa transiciones CSS y solo se descarga la primera vez que se abre el carrito. Los componentes cargados con `next/dynamic` se montan con `useDesktopFx()` (lib/perf.ts), que vale `false` también en escritorio durante la hidratación: con `useLightHero()` (que vale `false` en la hidratación) un móvil llegaba a montar el componente y a pedir el chunk de `motion`. Se eliminaron `MotionProvider` y `lib/motion-features.ts`. «First Load JS» de `/`: 177 → 129 kB.

Diferencias a propósito: los resortes de `SpotlightCard`/`Magnetic` pasan a una transición de 250 ms; el menú y el ícono del tema ya no tienen la animación de salida «en espejo» (el ícono solo anima la entrada); el acordeón ya no desmonta las respuestas cerradas.

### Medición (Lighthouse 12 móvil, mediana de 5 corridas, `/`, build de producción local)
| | Antes (#53) | Después |
|---|---|---|
| First Load JS (`next build`) | 177 kB | 129 kB |
| JS transferido | 200 kB | 149 kB |
| Peso total | 333 kB | 282 kB |
| Rendimiento | 83–91 | 94 |
| TBT | 84–279 ms | 94 ms |
| LCP | 3.3–3.5 s | 2.8 s |

La máquina de pruebas tiene ruido (la línea base varió 83–91 entre tandas); lo estable es la reducción de kB.
