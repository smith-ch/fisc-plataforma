# Marketing — videos de F.I.S.C.

30 videos con música y efectos de sonido sintetizados, listos para publicar (TikTok / Instagram / Facebook).

- `videos/marca/` — 15 videos de **marca** (identidad, promesa, los 3 pilares). Mezcla de vertical, horizontal y cuadrado.
- `videos/comercial/` — 15 videos **comerciales** para captar clientes: gancho + servicio + llamada a la acción.
- Cada carpeta trae `video.mp4`, `poster.jpg` y `share-copy.txt` (texto sugerido para publicar). `PLAN.md` resume el ángulo de cada video.

## Regenerar o editar
`video-engine/` contiene el motor (HTML → frames → ffmpeg + audio sintetizado) y los guiones (`specs.js` = marca, `specs-comercial.js` = comerciales).
La llamada a la acción de los comerciales se cambia en una sola línea (`CONTACT` al inicio de `specs-comercial.js`): hoy apunta a
`fisc-frontend.vercel.app/solicitar` porque los datos de contacto del sitio todavía son provisionales. Cámbiala por el dominio o WhatsApp definitivo y vuelve a renderizar.

```bash
cd marketing/video-engine
PW=/ruta/a/node_modules/playwright-core ./run.sh specs-comercial.js   # salida en marketing/out/
```
Requisitos: Node, Playwright Core con Chromium, ffmpeg y Python 3 con numpy.
