# F.I.S.C. — Landing y tienda de servicios

Sitio **estático** con la landing, el catálogo de servicios y una tienda: el cliente agrega servicios al carrito, completa los datos de su espacio y la solicitud se envía por **WhatsApp**. No hay base de datos, cuentas ni servidor: todo el contenido sale de archivos del repo y la web se genera completa en el build.

| Pieza | Tecnología | Dónde |
|---|---|---|
| Web (landing, catálogo, carrito, solicitud) | Next.js 15 + Tailwind 4 + Motion + Lenis | `frontend/` |
| Contenido y catálogo | Archivos TypeScript | `frontend/data/` |
| Código apagado (panel admin, login, Mi cuenta, seguimiento) | Next.js, ya sin publicar | `frontend/legacy/` |
| Backend (órdenes, contenido, pagos, integrador) | NestJS 11 + TypeORM, **apagado, no se despliega** | `backend/` |

## Correrlo localmente

Requisitos: **Node.js 20+** (recomendado 22).

```bash
npm run install:all   # instala frontend y backend
npm run dev           # solo la web, en http://localhost:3000
npm run build         # genera el sitio estático
```

No hace falta ninguna variable de entorno. `npm run dev:backend` levanta también el API de antes (puerto 4000), que la web ya no usa.

## Cómo se cambia el contenido

Todo se edita en archivos y se despliega:

- **Servicios y precios de referencia:** `frontend/data/catalogo.ts`. Los `id` no se reordenan: se agregan al final.
- **Textos, contacto, FAQ, portafolio y testimonios:** `frontend/data/contenido.ts`. Las imágenes van en `frontend/public/` y aquí se pone su ruta. Mientras portafolio y testimonios estén vacíos, la web oculta esas secciones.
- **WhatsApp:** `contact.whatsapp` en `contenido.ts` (solo dígitos con código de país). De ahí salen el botón flotante, el carrito, el formulario de contacto y la página de solicitud.

## Cómo funciona la tienda

1. El cliente agrega servicios al carrito desde el catálogo, las fichas o la portada. El carrito vive en su navegador (`localStorage`).
2. Desde el carrito puede enviar la solicitud directo por WhatsApp, o ir a `/solicitar` para agregar los datos de su espacio, la fecha y sus notas.
3. Se abre WhatsApp con el mensaje ya escrito (`frontend/lib/solicitud.ts`). La cotización y la factura se coordinan por ahí.

## Qué se apagó

El panel administrativo, las cuentas de clientes, el seguimiento de órdenes y el API ya no forman parte de la web publicada. Siguen en el repo (`frontend/legacy/` y `backend/`) hasta que se confirme que no hacen falta; ver `frontend/legacy/README.md`.

## Concrebill (backend apagado)

`backend/src/concrebill/concrebill.service.ts` concentra la integración:
- `upsertClient` — al registrarse o crear una orden se crea/actualiza el cliente (nombre, RNC/Cédula, dirección, teléfono).
- `listClientDocuments` — trae cotizaciones y facturas (se asocian a la orden por `reference = código de orden`).
- `registerPayment` — "registrar pago y emitir recibo para la factura X".

Con `CONCREBILL_ENABLED=false` funciona en **modo simulado** y cada llamada queda en la bitácora del panel. Cuando tengas la documentación oficial de la API, ajusta rutas y campos en ese archivo y activa `CONCREBILL_ENABLED=true`.

## PayPal (backend apagado)

Pendiente. La estructura está en `backend/src/payments/paypal.controller.ts` (crear orden → capturar → registrar pago en Concrebill) y el portal ya muestra la opción "Tarjeta / PayPal — próximamente".

## Despliegue

Producción se publica **solo** con el workflow [Deploy producción](.github/workflows/deploy.yml) y **solo @smith-ch** puede lanzarlo:

1. GitHub → **Actions → Deploy producción → Run workflow** (rama `main`).
2. Aprueba el despliegue cuando GitHub lo pida (environment `Production`).

Un push a `main` ya **no** despliega: la integración Git de Vercel está desconectada. El token de Vercel vive como secreto del environment `Production`, que exige la aprobación del dueño y solo acepta `main`, así que ningún colaborador puede usarlo aunque edite el workflow.
