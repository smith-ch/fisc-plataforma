# Protección de `main` y CI (#18)

Pasos para el dueño (@smith-ch). Los agentes no editan `.github/workflows/` ni la configuración de GitHub, así que esto queda preparado, no aplicado.

## 1. Activar el CI

```bash
cp docs/ci/ci.yml.propuesta .github/workflows/ci.yml
```

Edita el encabezado (quita la línea «PROPUESTA…») y haz push por PR. El job se llamará **CI / backend** y **CI / frontend**. Requiere que #29 (ESLint y pruebas) esté en `main`: el workflow ejecuta `npm run lint`, `npm test` y `npm run test:e2e`.

Verificado localmente: `npm run build` del frontend funciona sin API disponible; los comandos del backend (`lint`, `typecheck`, `test`, `test:e2e`, `build`) pasan en la rama de #29.

## 2. Proteger `main`

Cuando el CI haya corrido al menos una vez (para que GitHub conozca los nombres de los checks):

```bash
gh api -X PUT repos/smith-ch/fisc-plataforma/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["backend", "frontend"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 1, "require_code_owner_reviews": true, "dismiss_stale_reviews": true },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

- `contexts`: usa los nombres exactos que muestre GitHub en un PR (normalmente `backend` y `frontend`).
- `enforce_admins: false` deja al dueño poder hacer merge de emergencia; cámbialo a `true` si no quieres excepciones.
- Con `require_code_owner_reviews`, la aprobación la da @smith-ch según `.github/CODEOWNERS` (esta rama lo amplía a todo el repo).
- Si el repositorio es privado en un plan sin protección de ramas, hay que usar rulesets o pasar de plan.
