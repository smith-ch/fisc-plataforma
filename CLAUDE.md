# Plataforma F.I.S.C.

## Trabajo con agentes (plugin `fisc`)

Este producto es **la plataforma F.I.S.C.**, **Powered by F.I.S.C.** Su norte: landing, panel administrativo, gestor de órdenes y portal del cliente, integrado con Concrebill.

- Plugin: `fisc@fisc-agentes` (repo privado `smith-ch/fisc-agentes`). Guía: `/fisc:ayuda`.
- Flujo: `/fisc:iniciar-tarea <issue o HU>` → implementar → `/fisc:revisar-cambios` → `/fisc:abrir-pr`.
- Los agentes abren PR **en borrador**. El merge, la aprobación y el despliegue a producción son del dueño (@smith-ch). La guardia del plugin bloquea esas acciones.
- Antes de escribir código de Next.js, lee la guía de `node_modules/next/dist/docs/`.
- Verificación antes del PR: `npm run build` · `npm --prefix backend run typecheck` · `npm --prefix frontend run typecheck`.
- Nunca leas ni escribas `.env*` (usa `.env.example`) ni pongas claves `service_role` en el código.
- Migraciones: archivo nuevo, nunca editar una versionada.
