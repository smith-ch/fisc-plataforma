// Publica en Discord (#tableros) el estado de los tableros de todos los proyectos.
// Un solo mensaje con un embed por proyecto; las ejecuciones siguientes lo editan en el lugar.
//
// Variables de entorno:
//   GH_TOKEN                      token con permiso de lectura de Projects y de los repos (ver docs/TABLEROS-DISCORD.md)
//   DISCORD_TABLEROS_WEBHOOK      URL del webhook del canal #tableros (secreto, nunca se imprime)
//   DISCORD_TABLEROS_MESSAGE_ID   id del mensaje a editar (vacío la primera vez: se crea uno nuevo)
// Uso: node scripts/discord-tableros.mjs [--dry]   (--dry imprime el mensaje y no publica)
import { spawnSync } from 'node:child_process';

const DRY = process.argv.includes('--dry');

const PROYECTOS = [
  { nombre: 'Control de Cobros', owner: 'isannderdlc', numero: 1, repo: 'isannderdlc/control-cobros', color: 0x2e8b57 },
  { nombre: 'Avalo', owner: 'smith-ch', numero: 2, repo: 'smith-ch/avalo', color: 0xd9822b },
  { nombre: 'Plataforma F.I.S.C', owner: 'smith-ch', numero: 3, repo: 'smith-ch/fisc-plataforma', color: 0x3b6fd4 },
  { nombre: 'F.I.S.C Salud', owner: 'smith-ch', numero: 4, repo: 'smith-ch/fisc-salud', color: 0x8a5fd0 },
];

function gh(args) {
  const r = spawnSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`gh ${args.slice(0, 3).join(' ')} falló: ${(r.stderr || '').trim().split('\n')[0]}`);
  return JSON.parse(r.stdout);
}

function hace7Dias() {
  const d = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

function leerProyecto(p) {
  const items = gh(['project', 'item-list', String(p.numero), '--owner', p.owner, '--limit', '1000', '--format', 'json']).items;
  const porEstado = new Map();
  for (const it of items) {
    const estado = it.status || 'Sin estado';
    porEstado.set(estado, (porEstado.get(estado) || 0) + 1);
  }
  const abiertos = gh(['pr', 'list', '--repo', p.repo, '--state', 'open', '--limit', '200', '--json', 'number']).length;
  const fusionados = gh(['pr', 'list', '--repo', p.repo, '--state', 'merged', '--search', `merged:>=${hace7Dias()}`, '--limit', '200', '--json', 'number']).length;
  const estados = [...porEstado.entries()].sort((a, b) => infoEstado(a[0]).orden - infoEstado(b[0]).orden);
  return { total: items.length, estados, abiertos, fusionados };
}

// Cada estado conserva su color y su lugar en el flujo, sin importar cuántos ítems tenga.
const ESTADOS = [
  { nombres: ['por hacer', 'todo', 'backlog'], simbolo: '⬜' },
  { nombres: ['en progreso', 'in progress'], simbolo: '🟨' },
  { nombres: ['en revisión', 'en revision', 'in review'], simbolo: '🟧' },
  { nombres: ['tarea finalizada', 'done', 'hecho'], simbolo: '🟦' },
  { nombres: ['produccion', 'producción'], simbolo: '🟩' },
];
function infoEstado(nombre) {
  const i = ESTADOS.findIndex((e) => e.nombres.includes(nombre.toLowerCase()));
  return i === -1 ? { orden: ESTADOS.length, simbolo: '🟪' } : { orden: i, simbolo: ESTADOS[i].simbolo };
}

function barra(estados, total) {
  const bloques = 12;
  if (!total) return '';
  return estados.map(([estado, n]) => infoEstado(estado).simbolo.repeat(Math.max(1, Math.round((n / total) * bloques)))).join('');
}

function embed(p, datos, error) {
  const url = `https://github.com/users/${p.owner}/projects/${p.numero}`;
  const base = { title: p.nombre, url, color: p.color };
  if (error) return { ...base, description: `No se pudo leer el tablero.\n\`${error}\``, color: 0xc0392b };
  const lineas = datos.estados.map(([estado, n]) => `${infoEstado(estado).simbolo} ${estado}: **${n}**`);
  return {
    ...base,
    description: `**${datos.total}** ítems en el tablero\n${barra(datos.estados, datos.total)}\n${lineas.join('\n')}`,
    fields: [
      { name: 'PRs abiertos', value: String(datos.abiertos), inline: true },
      { name: 'Fusionados en 7 días', value: String(datos.fusionados), inline: true },
    ],
  };
}

const embeds = [];
let fallos = 0;
for (const p of PROYECTOS) {
  try {
    embeds.push(embed(p, leerProyecto(p)));
  } catch (e) {
    fallos += 1;
    console.error(`${p.nombre}: ${e.message}`);
    embeds.push(embed(p, null, e.message.slice(0, 200)));
  }
}
// Si no se pudo leer ningún tablero (token vencido o sin permisos) no se toca el mensaje: se conserva el último bueno.
if (fallos === PROYECTOS.length) {
  console.error('No se pudo leer ningún tablero; el mensaje de Discord queda como estaba. Revisa TABLEROS_TOKEN.');
  process.exit(1);
}
const ahora = new Date().toISOString().replace('T', ' ').slice(0, 16);
embeds[embeds.length - 1].footer = { text: `Actualizado ${ahora} UTC · se refresca solo cada hora` };

const cuerpo = {
  content: '**Tableros de proyectos**',
  embeds,
  allowed_mentions: { parse: [] },
};

if (DRY) {
  console.log(JSON.stringify(cuerpo, null, 2));
  process.exit(fallos ? 1 : 0);
}

const webhook = process.env.DISCORD_TABLEROS_WEBHOOK;
const mensaje = (process.env.DISCORD_TABLEROS_MESSAGE_ID || '').trim();
if (!webhook) {
  console.error('Falta DISCORD_TABLEROS_WEBHOOK.');
  process.exit(1);
}

async function enviar(metodo, url) {
  return fetch(url, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
}

let res = mensaje ? await enviar('PATCH', `${webhook}/messages/${mensaje}`) : null;
if (!res || res.status === 404) {
  if (res) console.warn('El mensaje guardado ya no existe: se crea uno nuevo.');
  res = await enviar('POST', `${webhook}?wait=true`);
  if (!res.ok) {
    console.error(`Discord respondió ${res.status} al crear el mensaje.`);
    process.exit(1);
  }
  const { id } = await res.json();
  console.log(`Mensaje creado. Guarda su id en la variable DISCORD_TABLEROS_MESSAGE_ID: ${id}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFileSync } = await import('node:fs');
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `Mensaje nuevo en Discord. Guarda este id como variable del repo **DISCORD_TABLEROS_MESSAGE_ID**: \`${id}\`\n`);
  }
} else if (!res.ok) {
  console.error(`Discord respondió ${res.status} al editar el mensaje.`);
  process.exit(1);
} else {
  console.log('Mensaje de #tableros actualizado.');
}
process.exit(fallos ? 1 : 0);
