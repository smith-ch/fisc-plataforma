# F.I.S.C. — Plataforma de servicios

Landing page con fondos interactivos, **panel administrativo** para gestionar el contenido de la web, **gestor de órdenes** (web / WhatsApp / Instagram) y **portal del cliente**, con integración preparada hacia **Concrebill** (facturación con NCF).

| Capa | Tecnología | Carpeta |
|---|---|---|
| Frontend (landing, catálogo, portal, panel admin) | Next.js 15 + Tailwind 4 + Motion + Lenis | `frontend/` |
| Backend (órdenes, contenido, pagos, integrador) | NestJS 11 + TypeORM (SQLite en desarrollo / PostgreSQL en producción) | `backend/` |
| ERP / core financiero | Concrebill (API REST) | `backend/src/concrebill/` |

## Correrlo localmente

Requisitos: **Node.js 20+** (recomendado 22).

```bash
cd plataforma-servicios
cp backend/.env.example backend/.env     # ajusta claves si quieres
npm install          # instala "concurrently"
npm run install:all  # instala backend y frontend
npm run dev          # levanta API (puerto 4000) y web (puerto 3000)
```

Abre **http://localhost:3000**

- Panel administrativo: http://localhost:3000/admin
- Usuario admin inicial: `admin@fisc.com.do` / `Admin123!` (cámbialo en `backend/.env` antes del primer arranque o desde el panel → Usuarios).
- La base de datos SQLite se crea sola en `backend/data/` con el catálogo de los 3 pilares, textos de la landing y preguntas frecuentes.

## Qué incluye

**Web pública**
- Hero con fondo interactivo (aurora que sigue al cursor + malla de puntos reactiva) y el símbolo F.I.S.C. armado con sus 4 piezas en parallax 3D que se "explota" al hacer scroll; fragmentos del logo flotando a distintas profundidades.
- Pilares con escenas fijas (sticky), tarjetas con foco de luz y tilt 3D, proceso en scroll horizontal fijado, contadores animados, antes/después deslizable, testimonios, FAQ, contacto rápido y botón flotante de WhatsApp.
- Catálogo y fichas de servicio, carrito / creador de órdenes en 4 pasos (servicios → espacio → fecha → contacto), seguimiento público por código + correo.
- Portal del cliente: estado de órdenes (Recibida → En Levantamiento → Cotizada → En Ejecución → Completada), reportes diarios con fotos, documentos (cotizaciones / facturas / recibos), pago por transferencia con comprobante, y evaluación "Tú evalúas".

**Panel administrativo** (`/admin`)
- Dashboard, bandeja de órdenes con filtros, creación manual de órdenes que llegan por WhatsApp/Instagram.
- Asignación de técnico/cuadrilla, programación, cambio de estado, reportes con fotos antes/durante/después.
- Documentos (registro manual o sincronización con Concrebill), validación de pagos (al validar se registra el pago en Concrebill).
- Contenido de la web editable: marca, colores, logos, hero, sección "por qué elegirnos", proceso, contacto, cuentas bancarias, SEO; servicios y pilares; testimonios; FAQ; portafolio; mensajes de contacto; evaluaciones (publicables como testimonio); usuarios y técnicos; bitácora de integración.
- Los técnicos entran al mismo panel y sólo ven sus órdenes asignadas.

## Concrebill

`backend/src/concrebill/concrebill.service.ts` concentra la integración:
- `upsertClient` — al registrarse o crear una orden se crea/actualiza el cliente (nombre, RNC/Cédula, dirección, teléfono).
- `listClientDocuments` — trae cotizaciones y facturas (se asocian a la orden por `reference = código de orden`).
- `registerPayment` — "registrar pago y emitir recibo para la factura X".

Con `CONCREBILL_ENABLED=false` funciona en **modo simulado** y cada llamada queda en la bitácora del panel. Cuando tengas la documentación oficial de la API, ajusta rutas y campos en ese archivo y activa `CONCREBILL_ENABLED=true`.

## PayPal

Pendiente. La estructura está en `backend/src/payments/paypal.controller.ts` (crear orden → capturar → registrar pago en Concrebill) y el portal ya muestra la opción "Tarjeta / PayPal — próximamente".

## Despliegue

Producción se publica **solo** con el workflow [Deploy producción](.github/workflows/deploy.yml) y **solo @smith-ch** puede lanzarlo:

1. GitHub → **Actions → Deploy producción → Run workflow** (rama `main`).
2. Aprueba el despliegue cuando GitHub lo pida (environment `Production`).

Un push a `main` ya **no** despliega: la integración Git de Vercel está desconectada. El token de Vercel vive como secreto del environment `Production`, que exige la aprobación del dueño y solo acepta `main`, así que ningún colaborador puede usarlo aunque edite el workflow.
