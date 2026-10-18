# Código apagado (`legacy/`)

Aquí está lo que la web tenía cuando dependía del backend y la base de datos. **No se compila, no se despliega y no se
revisa con el linter**: `tsconfig.json` y `eslint.config.mjs` lo excluyen, y Next solo publica lo que está en `app/`.

| Carpeta | Qué era |
|---|---|
| `admin/` | Panel administrativo (órdenes, pagos, contenido, usuarios, integración con Concrebill) |
| `site/login`, `site/registro`, `site/mi-cuenta` | Cuentas de clientes y su portal |
| `site/seguimiento` | Seguimiento público de una orden por código y correo |
| `site/OrderWizard.tsx` | Asistente de órdenes que guardaba la orden en el API |
| `components/admin`, `components/ui/AuthCard.tsx` | Piezas que solo usaba lo de arriba |
| `components/providers.tsx` | El proveedor de sesión y carrito de antes |
| `lib/api.ts`, `lib/useApi.ts`, `lib/fallback.ts` | Cliente del API y contenido de respaldo |
| `api/revalidate` | Ruta que el backend llamaba para invalidar la caché de la web |

El backend (`../../backend`) sigue en el repo, también sin desplegarse.

## Cómo seguir
Cuando se confirme que algo de aquí ya no hace falta, se abre un issue y se borra (todo queda en el historial de git).
Para volver a usarlo, se restaura desde el commit anterior a la migración a sitio estático: estos archivos importan
`@/components/providers`, `@/lib/api` y otros que ya no existen con esos nombres en `app/`.
