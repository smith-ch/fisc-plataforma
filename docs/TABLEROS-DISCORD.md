# Tableros en Discord

Un mensaje fijo en `#tableros` del servidor **Grupo F.I.S.C** muestra el estado de los tableros de todos los proyectos: Control de Cobros, Avalo, Plataforma F.I.S.C y F.I.S.C Salud. Cada proyecto es una tarjeta con los ítems por estado, los PRs abiertos y los fusionados en 7 días, y el enlace a su tablero de GitHub Projects.

El workflow `.github/workflows/tableros-discord.yml` corre cada hora (minuto 7) y edita ese mismo mensaje. También se puede lanzar a mano desde **Actions → Tableros en Discord → Run workflow**. El script es `scripts/discord-tableros.mjs`: solo lee GitHub y solo escribe en el webhook del canal.

## Configuración (una sola vez, la hace el dueño)

1. **Webhook de Discord.** En `#tableros`: Editar canal → Integraciones → Webhooks → Nuevo webhook → Copiar URL del webhook.
2. **Secreto `DISCORD_TABLEROS_WEBHOOK`.** Settings → Secrets and variables → Actions → New repository secret, con esa URL.
3. **Secreto `TABLEROS_TOKEN`.** Un token clásico de GitHub (Settings → Developer settings → Personal access tokens → Tokens (classic)) con los permisos `read:project` y `repo`, de una cuenta que pueda ver los tableros y los repos de los cuatro proyectos. Un token fino no sirve porque los proyectos están en dos cuentas distintas. Ponle vencimiento y renuévalo antes.
4. **Primera ejecución.** Lanza el workflow a mano. Como todavía no hay mensaje, crea uno nuevo y deja su id en el resumen de la ejecución.
5. **Variable `DISCORD_TABLEROS_MESSAGE_ID`.** Settings → Secrets and variables → Actions → Variables → New repository variable, con ese id. Desde entonces cada ejecución edita ese mensaje en vez de crear otro.
6. En Discord, fija el mensaje (clic derecho → Fijar mensaje).

## Probar sin publicar

```bash
node scripts/discord-tableros.mjs --dry
```

Imprime el mensaje en JSON usando tu sesión de `gh`. No necesita el webhook.

## Agregar o quitar un proyecto

Edita la lista `PROYECTOS` al inicio de `scripts/discord-tableros.mjs` (dueño, número del tablero y repo). Discord permite hasta 10 tarjetas por mensaje.

## Si algo falla

- Una tarjeta en rojo con "No se pudo leer el tablero": el token no tiene acceso a ese tablero o repo, o venció.
- El workflow termina con error cuando alguna tarjeta falló, pero igual publica las demás.
- Si borran el mensaje en Discord, el script crea uno nuevo y vuelve a mostrar su id en el resumen: actualiza la variable.
