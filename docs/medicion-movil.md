# Medición de rendimiento en móvil

Procedimiento y medición base de las tareas de rendimiento móvil (#37 y las que dependen de ella: #38, #39, #40, #41, #42, #43). Alcance: solo `frontend/`.

## Cómo repetir la medición

Lighthouse 12 en su perfil móvil por defecto (emulación de Moto G Power, red 4G lenta simulada y CPU 4× más lenta), contra el build de producción:

```bash
npm ci --prefix frontend
npm run build                       # build de producción del frontend
npm start                           # sirve en http://localhost:3000 (déjalo corriendo)

# en otra terminal; CHROME_PATH solo si Lighthouse no encuentra Chrome solo
set CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe      # PowerShell: $env:CHROME_PATH='...'
node scripts/medir-movil.mjs --etiqueta=base
```

`scripts/medir-movil.mjs` corre 3 veces cada página (`/`, `/servicios`, `/solicitar`) y imprime una tabla con la **mediana**. Opciones: `--base=URL`, `--paginas=/,/servicios`, `--corridas=N`, `--etiqueta=nombre`. Los JSON completos de Lighthouse quedan en la carpeta temporal del sistema (`fisc-medir-movil/`).

Reglas para que las comparaciones valgan:
- Siempre `npm start` sobre un build nuevo (nunca `npm run dev`), en la misma máquina y sin otras cargas pesadas abiertas: el TBT y el puntaje varían entre corridas por la carga de la máquina (hasta ±100 ms de TBT y ±10 puntos), por eso se usa la mediana de 3.
- Cambiar una sola cosa por medición y guardar la tabla en la descripción del PR o aquí.
- Lighthouse en laboratorio no mide INP; el **TBT** es su sustituto. Para INP real hace falta un dispositivo (ver abajo).

### Dispositivo real (recomendado antes de cerrar la serie)
Con un Android de gama media: Chrome DevTools remoto (`chrome://inspect`) → Performance con "CPU: sin throttling" y red "Fast 4G"; repetir 3 veces la carga de `/` y mirar LCP, TBT y los tramos largos del hilo principal. Anotar el modelo. **No hay mediciones en dispositivo real todavía.**

## Medición base (2026-10-19, `main` en 24d92d4, landing estática)

Mediana de 3 corridas, Lighthouse 12 móvil, `next start` local, Windows 11 / Chrome instalado, Node 24.

| Página | Rendimiento | LCP | TBT | CLS | JS transferido | Imágenes | Peso total | Hilo principal |
|---|---|---|---|---|---|---|---|---|
| `/` | 76 | 3,7 s | 479 ms | 0,001 | 205 kB | 101 kB | 419 kB | 5,7 s |
| `/servicios` | 89 | 3,3 s | 185 ms | 0,000 | 203 kB | 20 kB | 345 kB | 4,7 s |
| `/solicitar` | 68 | 3,8 s | 802 ms | 0,000 | 205 kB | 22 kB | 336 kB | 6,7 s |

Notas:
- `/login` ya no existe en el sitio estático (#45; el código quedó en `frontend/legacy/`), así que no se mide.
- El JS transferido es casi igual en todas las páginas (~205 kB): la mayor parte es el código compartido (React, Next, motion). El "First Load JS" que reporta `next build` para `/` es 178 kB.
- Las imágenes de `/` (101 kB) son las piezas del logo del hero; las secciones de contenido no tienen fotos todavía (portafolio, testimonios y servicios están vacíos).
- El hilo principal pasa de 4,7 a 6,7 s con la CPU 4× más lenta: ahí está el trabajo de animación y de hidratación que atacan #38–#42.

## Metas propuestas

Referencia: umbrales "buenos" de Core Web Vitals, aplicados a la medición de laboratorio descrita arriba.

| Métrica | Meta | Base `/` | Brecha |
|---|---|---|---|
| Rendimiento Lighthouse (móvil) | ≥ 80 en `/` (≥ 85 en las demás) | 76 | +4 |
| LCP | < 2,5 s | 3,7 s | −1,2 s |
| TBT (sustituto de INP en laboratorio) | < 200 ms | 479 ms | −280 ms |
| INP (dispositivo real) | < 200 ms | sin medir | medir en Android |
| CLS | < 0,1 | 0,001 | cumplida |
| JS transferido en `/` | ≤ 150 kB | 205 kB | −55 kB |

Por tarea (dónde se espera el efecto): #41 (título visible sin esperar al JavaScript) mueve el LCP; #38, #39 y #40 bajan TBT e hilo principal; #42 baja el JS inicial; #43 evita que las fotos de contenido pesen en móvil.

## Registro de resultados por tarea

Al cerrar cada tarea se vuelve a medir con el mismo procedimiento y se agrega una fila (rendimiento / LCP / TBT / JS de `/`):

| Tarea | Fecha | Rendimiento | LCP | TBT | JS `/` | PR |
|---|---|---|---|---|---|---|
| Base | 2026-10-19 | 76 | 3,7 s | 479 ms | 205 kB | — |
| #41 | 2026-10-19 | ruidoso (ver PR #48) | | | | #48 |
| #38 | 2026-10-19 | 71 → 81 (mediana de 5) | 3,9 → 3,4 s | 640 → 390 ms | | #50 |
| #39 | | | | | | |
| #40 | | | | | | |
| #42 | 2026-10-19 | 94 | | | 200 → 149 kB | #53, #54 |
| #43 | | | | | | #46 (medido con fotos de prueba: ver el PR) |

## Medición final de la serie (2026-10-21, `main` en 4377045, con #38–#43, #54 y #57 ya integrados)

Mediana de 3 corridas, Lighthouse 12 móvil, build de producción (más el PR que pausa las marquesinas fuera de pantalla, sin efecto en esta métrica).

| Página | Rendimiento | LCP | TBT | CLS | JS transferido | Imágenes | Peso total | Hilo principal |
|---|---|---|---|---|---|---|---|---|
| `/` | 94 | 2,9 s | 62 ms | 0,002 | 153 kB | 30 kB | 299 kB | 2,0 s |
| `/servicios` | 95 | 2,7 s | 65 ms | 0,001 | 160 kB | 2 kB | 291 kB | 1,2 s |
| `/solicitar` | 96 | 2,7 s | 47 ms | 0,000 | 153 kB | 4 kB | 266 kB | 1,2 s |

Contra las metas de `/`:

| Métrica | Meta | Base | Final | Estado |
|---|---|---|---|---|
| Rendimiento | ≥ 80 | 76 | 94 | cumplida |
| LCP | < 2,5 s | 3,7 s | 2,9 s | **no cumplida** (−0,4 s; lo limita la capa decorativa del brillo del logo) |
| TBT | < 200 ms | 479 ms | 62 ms | cumplida |
| CLS | < 0,1 | 0,001 | 0,002 | cumplida |
| JS transferido | ≤ 150 kB | 205 kB | 153 kB | casi (3 kB por encima) |

Sigue sin medirse INP ni un Android real (ver arriba).
