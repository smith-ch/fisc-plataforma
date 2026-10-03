// 15 brand videos for F.I.S.C. — about the brand (identity, promise, pillars), not about the website.
// All copy comes from the brand's own material: tagline "Soluciones que impulsan", the 3 pillars and
// their services (seed catalog), and the hero/FAQ statements ("fuera de preocupación", "un único levantamiento…").
const L = { W: 1920, H: 1080 }, V = { W: 1080, H: 1920 }, Q = { W: 1080, H: 1080 };
const outro = (sub, dur = 5.2) => ({ type: 'outro', dur, tag: 'Soluciones que impulsan', sub });

const A = { code: 'A', name: 'Adecuación y Estética de Espacios', short: 'Adecuación', desc: 'Transformamos la apariencia y funcionalidad\nde tu residencia o comercio.',
  items: ['Pintura interior y exterior', 'Instalación y amueblamiento', 'Decoración y acabados', 'Cortinas y accesorios'] };
const B = { code: 'B', name: 'Mantenimiento Estructural y Operativo', short: 'Mantenimiento', desc: 'Mantenemos tus propiedades en estado óptimo\ny resolvemos imprevistos.',
  items: ['Limpieza y mantenimiento', 'Plomería', 'Impermeabilización', 'Cerrajería'] };
const C = { code: 'C', name: 'Tecnología y Sistemas Comerciales', short: 'Tecnología', desc: 'Digitalizamos y mantenemos\noperativo tu negocio.',
  items: ['Sistemas POS', 'Equipos electrónicos', 'Redes y terminales', 'Capacitación'] };

module.exports = [
  { id: '01-manifiesto', ...V, tone: 'cinematic', key: 3, bpm: 96, poster: 7.2,
    title: 'Manifiesto', angle: 'La promesa de la marca en una frase: un solo equipo para todo lo que tu espacio necesita.',
    share: 'Un solo equipo para todo lo que tu espacio necesita. Adecuación, mantenimiento y tecnología bajo una misma marca: F.I.S.C. — Soluciones que impulsan.',
    scenes: [
      { type: 'text', dur: 3.2, chip: 'F.I.S.C.', lines: [{ t: 'Pintura.', size: 120 }, { t: 'Plomería.', size: 120 }, { t: 'Sistemas POS.', size: 120 }] },
      { type: 'text', dur: 3.4, lines: [{ t: 'Tres rubros.', size: 112 }, { t: '[steel]Un solo[/]', size: 112 }, { t: '[steel]equipo.[/]', size: 112 }] },
      { type: 'text', dur: 4.2, lines: [{ t: 'Todo lo que', size: 104 }, { t: 'tu espacio', size: 104 }, { t: '[ice]necesita.[/]', size: 104 }], sub: 'Un único levantamiento.\nUna cotización transparente.' },
      outro('Adecuación · Mantenimiento · Tecnología'),
    ] },

  { id: '02-logo-reveal', ...L, tone: 'cinematic', key: 0, bpm: 90, poster: 5.0,
    title: 'Revelación del logo', angle: 'Las piezas del símbolo F·S se ensamblan sobre la marca.',
    share: 'F.I.S.C. — Soluciones que impulsan.',
    scenes: [
      { type: 'logo', dur: 6.2, sub: 'Adecuación · Mantenimiento · Tecnología', size: 560 },
      { type: 'text', dur: 3.6, lines: [{ t: 'Soluciones', size: 150 }, { t: '[ice]que impulsan.[/]', size: 150 }] },
    ] },

  { id: '03-tres-pilares', ...L, tone: 'default', key: 5, bpm: 108, poster: 6.5,
    title: 'Los tres pilares', angle: 'Los tres pilares que sostienen a F.I.S.C.',
    share: 'Adecuación y Estética, Mantenimiento Estructural y Tecnología Comercial: los tres pilares de F.I.S.C.',
    scenes: [
      { type: 'text', dur: 2.6, lines: [{ t: 'Tres pilares.', size: 150 }, { t: '[steel]Una marca.[/]', size: 150 }] },
      { type: 'cards', dur: 5.4, items: [
        { k: 'A', t: 'Adecuación y\nEstética de Espacios', d: 'Transformamos la apariencia\ny funcionalidad.' },
        { k: 'B', t: 'Mantenimiento Estructural\ny Operativo', d: 'Propiedades en estado óptimo,\nimprevistos resueltos.' },
        { k: 'C', t: 'Tecnología y Sistemas\nComerciales', d: 'Tu negocio digitalizado\ny operativo.' }] },
      outro('F.I.S.C.', 5.0),
    ] },

  { id: '04-pilar-a-adecuacion', ...V, tone: 'app-store', key: 7, bpm: 112, poster: 5.8,
    title: 'Pilar A', angle: 'Adecuación y Estética de Espacios.', share: 'Pilar A de F.I.S.C.: Adecuación y Estética de Espacios. Transformamos la apariencia y funcionalidad de tu residencia o comercio.',
    scenes: [
      { type: 'text', dur: 2.8, lines: [{ t: 'Tu espacio,', size: 120 }, { t: '[ice]transformado.[/]', size: 120 }] },
      { type: 'pillar', dur: 7.2, code: A.code, kicker: 'Pilar A · ' + A.short, title: ['Adecuación y', 'Estética de', 'Espacios'], desc: A.desc, items: A.items, itemsAt: 2.3 },
      outro('Pilar A · Adecuación', 5.0),
    ] },

  { id: '05-pilar-b-mantenimiento', ...Q, tone: 'default', key: 2, bpm: 104, poster: 6.0,
    title: 'Pilar B', angle: 'Mantenimiento Estructural y Operativo.', share: 'Pilar B de F.I.S.C.: Mantenimiento Estructural y Operativo. Mantenemos tus propiedades en estado óptimo y resolvemos imprevistos.',
    scenes: [
      { type: 'text', dur: 2.6, lines: [{ t: 'Los imprevistos', size: 92 }, { t: '[steel]tienen solución.[/]', size: 92 }] },
      { type: 'pillar', dur: 7.0, code: B.code, kicker: 'Pilar B · ' + B.short, title: ['Mantenimiento', 'Estructural y Operativo'], size: 70, desc: B.desc, items: B.items, itemsAt: 2.2 },
      outro('Pilar B · Mantenimiento', 4.8),
    ] },

  { id: '06-pilar-c-tecnologia', ...V, tone: 'polished', key: 9, bpm: 100, poster: 5.8,
    title: 'Pilar C', angle: 'Tecnología y Sistemas Comerciales.', share: 'Pilar C de F.I.S.C.: Tecnología y Sistemas Comerciales. Digitalizamos y mantenemos operativo tu negocio.',
    scenes: [
      { type: 'text', dur: 2.8, lines: [{ t: 'Tu negocio,', size: 120 }, { t: '[ice]operativo.[/]', size: 120 }] },
      { type: 'pillar', dur: 7.2, code: C.code, kicker: 'Pilar C · ' + C.short, title: ['Tecnología y', 'Sistemas', 'Comerciales'], desc: C.desc, items: C.items, itemsAt: 2.3 },
      outro('Pilar C · Tecnología', 5.0),
    ] },

  { id: '07-fuera-de-preocupacion', ...V, tone: 'cinematic', key: 4, bpm: 92, poster: 8.4,
    title: 'Fuera de preocupación', angle: 'La promesa: un proyecto ejecutado "fuera de preocupación".', share: 'Un proyecto ejecutado fuera de preocupación. Esa es la promesa de F.I.S.C.',
    scenes: [
      { type: 'text', dur: 3.0, lines: [{ t: '¿Obra?', size: 150 }, { t: '¿Filtración?', size: 150 }, { t: '¿Sistemas?', size: 150 }] },
      { type: 'text', dur: 3.4, lines: [{ t: 'Una sola', size: 120 }, { t: '[steel]marca[/]', size: 120 }, { t: 'a cargo.', size: 120 }] },
      { type: 'text', dur: 4.4, lines: [{ t: 'Ejecutado', size: 118 }, { t: '[ice]fuera de[/]', size: 118 }, { t: '[ice]preocupación.[/]', size: 118 }] },
      outro('F.I.S.C.', 5.0),
    ] },

  { id: '08-un-levantamiento', ...L, tone: 'default', key: 6, bpm: 110, poster: 8.6,
    title: 'Un levantamiento, una cotización', angle: 'Cómo trabaja la marca: un único levantamiento, una cotización transparente, un proyecto.', share: 'Un único levantamiento, una cotización transparente y un proyecto ejecutado. Así trabaja F.I.S.C.',
    scenes: [
      { type: 'text', dur: 3.0, chip: 'Así trabajamos', lines: [{ t: 'Un levantamiento.', size: 132 }] },
      { type: 'text', dur: 2.6, lines: [{ t: 'Una cotización', size: 132 }, { t: '[steel]transparente.[/]', size: 132 }] },
      { type: 'text', dur: 3.6, lines: [{ t: 'Un proyecto', size: 132 }, { t: '[ice]de principio a fin.[/]', size: 132 }] },
      outro('Adecuación · Mantenimiento · Tecnología', 5.0),
    ] },

  { id: '09-reportes-diarios', ...Q, tone: 'app-store', key: 1, bpm: 114, poster: 6.8,
    title: 'Reportes diarios', angle: 'Reportes diarios con fotos: ves el avance sin estar en el lugar.', share: 'Reportes diarios con fotos del avance, sin tener que estar en el lugar. Así cuida F.I.S.C. tu proyecto.',
    scenes: [
      { type: 'text', dur: 3.0, lines: [{ t: 'Sin estar', size: 120 }, { t: '[steel]en el lugar.[/]', size: 120 }] },
      { type: 'text', dur: 3.8, lines: [{ t: 'Ves cómo va', size: 104 }, { t: '[ice]tu proyecto.[/]', size: 104 }], sub: 'Reportes diarios\ncon fotos del avance.' },
      outro('Tu proyecto, a la vista', 5.0),
    ] },

  { id: '10-pagas-satisfecho', ...V, tone: 'app-store', key: 8, bpm: 116, poster: 7.0,
    title: 'Pagas cuando estás satisfecho', angle: 'La tranquilidad de pagar cuando el trabajo te convence.', share: 'Pagas cuando estás satisfecho. Esa es la forma de trabajar de F.I.S.C.',
    scenes: [
      { type: 'text', dur: 2.8, lines: [{ t: 'Primero', size: 130 }, { t: '[steel]el trabajo.[/]', size: 130 }] },
      { type: 'text', dur: 3.8, lines: [{ t: 'Pagas', size: 130 }, { t: 'cuando estás', size: 118 }, { t: '[ice]satisfecho.[/]', size: 130 }] },
      outro('Pagas cuando estás satisfecho', 5.0),
    ] },

  { id: '11-un-solo-equipo', ...L, tone: 'default', key: 10, bpm: 112, poster: 8.0,
    title: 'Un solo equipo', angle: 'Del problema suelto a un solo equipo que lo resuelve todo.', share: 'Pintura, plomería, mobiliario, impermeabilización, cerrajería y sistemas POS: un solo equipo, F.I.S.C.',
    scenes: [
      { type: 'text', dur: 3.6, stagger: 0.3, lines: [{ t: 'Pintura.', size: 100, strike: 1.9 }, { t: 'Plomería.', size: 100, strike: 2.2 }, { t: 'Cerrajería.', size: 100, strike: 2.5 }, { t: 'Sistemas POS.', size: 100, strike: 2.8 }] },
      { type: 'text', dur: 3.2, lines: [{ t: 'Cuatro llamadas.', size: 118, strike: 1.2 }, { t: '[ice]Un solo equipo.[/]', size: 140 }] },
      outro('Adecuación · Mantenimiento · Tecnología', 5.0),
    ] },

  { id: '12-espacios-que-comunican', ...Q, tone: 'polished', key: 0, bpm: 98, poster: 6.0,
    title: 'Espacios que comunican', angle: 'Decoración y acabados: que el ambiente comunique lo que buscas.', share: 'Que tu ambiente comunique lo que buscas. Decoración, acabados y adecuación visual: F.I.S.C.',
    scenes: [
      { type: 'text', dur: 3.2, lines: [{ t: 'Cada espacio', size: 106 }, { t: '[steel]comunica algo.[/]', size: 106 }] },
      { type: 'text', dur: 4.0, lines: [{ t: '¿Qué dice', size: 108 }, { t: '[ice]el tuyo?[/]', size: 108 }], sub: 'Revestimientos · Molduras\nAcabados finos' },
      outro('Adecuación y Estética de Espacios', 4.8),
    ] },

  { id: '13-negocio-operativo', ...V, tone: 'polished', key: 11, bpm: 102, poster: 7.2,
    title: 'Negocio operativo', angle: 'Tecnología que mantiene operativo al comercio.', share: 'Digitalizamos y mantenemos operativo tu negocio: sistemas POS, equipos electrónicos y redes. F.I.S.C.',
    scenes: [
      { type: 'text', dur: 3.0, lines: [{ t: 'Un negocio', size: 120 }, { t: 'que no', size: 120 }, { t: '[steel]se detiene.[/]', size: 120 }] },
      { type: 'text', dur: 4.0, lines: [{ t: 'Digitalizamos', size: 106 }, { t: 'y mantenemos', size: 106 }, { t: '[ice]operativo[/]', size: 106 }, { t: '[ice]tu negocio.[/]', size: 106 }] },
      outro('Tecnología y Sistemas Comerciales', 5.0),
    ] },

  { id: '14-santo-domingo', ...L, tone: 'cinematic', key: 2, bpm: 94, poster: 7.4,
    title: 'Hecho en Santo Domingo', angle: 'Marca local: opera en Santo Domingo y zonas cercanas.', share: 'Operamos en Santo Domingo y zonas cercanas. F.I.S.C. — Soluciones que impulsan.',
    scenes: [
      { type: 'text', dur: 3.2, chip: 'Santo Domingo', lines: [{ t: 'Cerca de ti.', size: 150 }] },
      { type: 'text', dur: 3.8, lines: [{ t: 'En Santo Domingo', size: 120 }, { t: '[steel]y zonas cercanas.[/]', size: 120 }] },
      outro('Soluciones para tu espacio', 5.0),
    ] },

  { id: '15-soluciones-que-impulsan', ...V, tone: 'cinematic', key: 0, bpm: 90, poster: 5.4,
    title: 'Soluciones que impulsan', angle: 'Cierre de marca: el símbolo, el nombre y la promesa.', share: 'F.I.S.C. — Soluciones que impulsan.',
    scenes: [
      { type: 'logo', dur: 6.4, sub: 'Adecuación · Mantenimiento · Tecnología' },
      { type: 'text', dur: 4.0, lines: [{ t: 'Soluciones', size: 138 }, { t: '[ice]que impulsan.[/]', size: 126 }] },
    ] },
];

// Poster = settled brand frame (also baked in as frame 0): the closing lockup, or the finished logo for the two logo-first videos.
module.exports.forEach((v) => {
  const total = v.scenes.reduce((a, sc) => a + sc.dur, 0);
  v.poster = v.scenes[v.scenes.length - 1].type === 'outro' ? +(total - 1.2).toFixed(2) : 4.4;
});
