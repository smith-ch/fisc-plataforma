# Videos de marketing fuera del repositorio (#17)

`marketing/videos/` guarda 30 videos (`video.mp4`) con su `poster.jpg` y `share-copy.txt`: unos 127 MB de los ~128 MB que pesa el historial del repo. Clonarlo tarda más de 2 minutos. Este documento deja el estado, las opciones y los pasos para que el dueño elija la ruta.

## Estado de las cuatro casillas del issue

| Casilla | Estado |
|---|---|
| Subir los videos a un almacenamiento externo | **Pendiente de la decisión del dueño** (ver opciones). |
| Dejar en el repo solo el motor y un índice con enlaces | Pendiente: el índice necesita las URL del destino elegido. |
| (Opcional) limpiar el historial con `git filter-repo` | Pendiente; reescribe el historial y exige coordinar con todos los colaboradores. |
| Evitar clonar y construir por cambios en `marketing/` | **Ya resuelto, no hace falta `.vercelignore`**: la integración Git de Vercel está desconectada y `deploy.yml` hace `sparse-checkout: frontend` y despliega desde `frontend/`, así que ni se descarga `marketing/` ni se sube a Vercel. El CI de PRs (#18) debe usar el mismo `sparse-checkout` por carpeta. |

Los videos no los usa el sitio: ninguna ruta de `frontend/` apunta a `marketing/videos/`.

## Ruta local (sin subirlos a ningún sitio)

Opción más simple: sacar los videos del repositorio y guardarlos en una carpeta del equipo. Los videos dejan de estar en el árbol de Git (`marketing/videos/` queda ignorada) pero **cada persona necesita su copia**: no se comparten por Git. Sirve para quien genera y publica los videos; para compartirlos con otros sigue haciendo falta un release, Drive u objetos.

```bash
node scripts/videos.mjs ruta                 # carpeta que se usa
node scripts/videos.mjs mover                # simulacro: qué se movería
node scripts/videos.mjs mover --aplicar      # copia, verifica tamaño de cada archivo y borra marketing/videos/
```

La carpeta es, en este orden: `--destino=RUTA`, la variable `FISC_VIDEOS_DIR`, o `fisc-videos` junto a la carpeta del repositorio (hoy `C:/Users/sgarcia/fisc/fisc-videos`). El script nunca borra el origen si la copia no coincide.

Esto **no reduce el historial**: los 127 MB siguen en los commits viejos y un clon nuevo sigue tardando igual hasta que se limpie con `git filter-repo` (paso 5 de abajo). Sí evita que los videos nuevos o editados engorden más el repositorio y deja el árbol de trabajo liviano.

## Opciones para el almacenamiento

| Opción | Pros | Contras |
|---|---|---|
| **GitHub Releases** (recomendada) | Gratis, sin cuentas nuevas, URL estables, hasta 2 GB por archivo (el mayor pesa 5,5 MB), versionado por etiqueta. | Descarga pública si el repo es público; sin carpetas (se empaqueta por serie). |
| Git LFS | El árbol del repo queda igual (punteros). | Cuota de ancho de banda y almacenamiento de pago; todos los colaboradores necesitan LFS; no arregla el historial ya subido. |
| Google Drive / almacenamiento de objetos | Cómodo para compartir con el equipo de marketing. | Cuenta y permisos aparte; enlaces que pueden romperse; sin versionado ligado al código. |

## Pasos si se elige GitHub Releases

1. Empaquetar por serie, conservando la estructura de carpetas:
   ```bash
   tar -czf videos-marca.tar.gz -C marketing/videos marca
   tar -czf videos-comercial.tar.gz -C marketing/videos comercial
   ```
2. Crear el release y subir los paquetes (lo hace el dueño o quien tenga permiso de publicar):
   ```bash
   gh release create videos-v1 videos-marca.tar.gz videos-comercial.tar.gz \
     --title "Videos de marketing v1" --notes "30 videos (15 marca, 15 comerciales) con poster y texto para publicar."
   ```
3. Reemplazar `marketing/videos/` por un `marketing/videos/INDEX.md` con los enlaces del release y la nota de cómo descargarlos, y actualizar `marketing/README.md`.
   ```bash
   git rm -r marketing/videos
   ```
4. Dejar `marketing/out/` (salida del render) ignorado, como hoy.
5. (Opcional, después de que todos tengan su trabajo subido) quitar los videos del historial para que el repo pese de verdad menos. Es una reescritura destructiva: se hace en una copia nueva del repo, con aviso previo al equipo y todos re-clonando.
   ```bash
   git filter-repo --path marketing/videos --invert-paths
   ```

## Qué no se hace aquí
No se suben los videos, no se crea el release ni se toca el historial: es decisión del dueño (destino, cuenta y reescritura de historial).
