import type { CartItem } from '@/components/providers';

/** Datos opcionales que el cliente puede agregar a su solicitud. Todo sale en el mensaje de WhatsApp. */
export interface DatosSolicitud {
  nombre?: string;
  telefono?: string;
  direccion?: string;
  tipoPropiedad?: string;
  tamano?: string;
  urgencia?: string;
  visita?: string;
  fecha?: string;
  horario?: string;
  notas?: string;
}

const lineaServicio = (i: CartItem) => `• ${i.name}${i.quantity > 1 ? ` (x${i.quantity})` : ''}${i.notes.trim() ? `: ${i.notes.trim()}` : ''}`;

/**
 * Mensaje de WhatsApp con los servicios del carrito y los datos que haya. Texto plano en español,
 * pensado para que quien lo recibe pueda preparar la cotización sin volver a preguntar lo básico.
 */
export function mensajeSolicitud(items: CartItem[], datos: DatosSolicitud = {}): string {
  const lineas: string[] = ['Hola, quiero solicitar un levantamiento y una cotización para:', '', ...items.map(lineaServicio)];
  const extra: [string, string | undefined][] = [
    ['Nombre', datos.nombre],
    ['Teléfono', datos.telefono],
    ['Dirección', datos.direccion],
    ['Tipo de propiedad', datos.tipoPropiedad],
    ['Tamaño aproximado', datos.tamano],
    ['Urgencia', datos.urgencia],
    ['Visita', datos.visita],
    ['Fecha preferida', datos.fecha],
    ['Horario preferido', datos.horario],
    ['Notas', datos.notas],
  ];
  const conDatos = extra.filter(([, v]) => v && v.trim());
  if (conDatos.length) lineas.push('', ...conDatos.map(([k, v]) => `${k}: ${v!.trim()}`));
  lineas.push('', 'Enviado desde la web.');
  return lineas.join('\n');
}
