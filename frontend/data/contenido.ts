import type { SiteContent } from '@/lib/types';

/**
 * Textos, contacto, preguntas frecuentes, portafolio y testimonios de la web.
 * Para cambiar algo se edita este archivo y se despliega. No hay base de datos ni panel detrás.
 *
 * - Imágenes (portafolio, testimonios, hero): se guardan en `public/` y aquí se pone su ruta, p. ej. '/trabajos/cocina-despues.webp'.
 * - `contact.whatsapp`: solo dígitos con código de país. De ahí salen el botón flotante, el carrito y el formulario.
 */
export const CONTENIDO: SiteContent = {
  settings: {
    brand: {
      name: 'F.I.S.C.',
      tagline: 'Soluciones que impulsan',
      logoUrl: '',
      logoLightUrl: '',
      primaryColor: '#3E4A52',
      accentColor: '#9FB4C0',
    },
    hero: {
      eyebrow: 'Adecuación · Mantenimiento · Tecnología',
      title: 'Un solo equipo para todo lo que tu espacio necesita',
      subtitle:
        'Pintura, plomería, impermeabilización, mobiliario a la medida, sistemas POS y más. Un único levantamiento, una cotización transparente y un proyecto ejecutado "fuera de preocupación".',
      ctaPrimary: 'Solicitar servicio',
      ctaSecondary: 'Agendar levantamiento',
      imageUrl: '',
      highlights: ['Cotización unificada', 'Reportes diarios con fotos', 'Pagas cuando estás satisfecho'],
    },
    about: {
      title: '¿Por qué elegirnos?',
      text: 'Cubrimos el ciclo de vida completo de tu espacio comercial o residencial. Nuestros equipos se coordinan entre sí: tú sólo recibes avances y apruebas resultados.',
      stats: [
        { value: '3', label: 'Pilares de servicio' },
        { value: '10+', label: 'Especialidades' },
        { value: '24h', label: 'Respuesta a solicitudes' },
        { value: '100%', label: 'Garantía de satisfacción' },
      ],
    },
    process: {
      title: 'Así trabajamos',
      subtitle: 'Un flujo simple y transparente, de la solicitud a la factura.',
      phases: [
        {
          title: 'Captación y Levantamiento',
          steps: [
            'Solicitas uno o varios servicios por la web, WhatsApp o Instagram.',
            'Un supervisor visita el lugar (o hace una evaluación virtual) y mide todo lo requerido.',
            'Recibes una cotización unificada con un monto final y un tiempo de entrega único.',
          ],
        },
        {
          title: 'Ejecución "Fuera de Preocupación"',
          steps: [
            'Programamos la fecha y asignamos la cuadrilla. Los equipos se coordinan entre sí, no tú.',
            'Recibes actualizaciones diarias con fotos del avance, sin tener que estar en el lugar.',
          ],
        },
        {
          title: 'Evaluación y Pago',
          steps: [
            'Hacemos un recorrido final (físico o por videollamada) para revisar cada detalle.',
            'Evalúas el servicio con una breve encuesta.',
            'Emitimos la factura final: el ciclo se cierra sólo cuando estás satisfecho.',
          ],
        },
      ],
    },
    // TODO: datos provisionales; los definitivos se cargan con el issue de datos de contacto (#44).
    contact: {
      whatsapp: '18090000000',
      whatsappMessage: 'Hola, quisiera solicitar información sobre sus servicios.',
      phone: '+1 (809) 000-0000',
      email: 'contacto@fisc.com.do',
      address: 'Santo Domingo, República Dominicana',
      hours: 'Lunes a Sábado · 8:00 a.m. – 6:00 p.m.',
      instagram: 'https://instagram.com/',
      facebook: '',
    },
    seo: {
      title: 'F.I.S.C. | Soluciones que impulsan — Adecuación, Mantenimiento y Tecnología',
      description:
        'Pintura, instalación de mobiliario, plomería, impermeabilización, cerrajería, sistemas POS y mantenimiento de equipos en República Dominicana.',
    },
  },
  // Agrega aquí trabajos y testimonios reales. Mientras estén vacíos, la web oculta esas secciones.
  testimonials: [],
  projects: [],
  faqs: [
    {
      id: 1,
      question: '¿Puedo solicitar varios servicios en una sola orden?',
      answer: 'Sí. Selecciona todos los servicios que necesitas y haremos un único levantamiento con una cotización unificada, un monto final y un tiempo de entrega único.',
    },
    {
      id: 2,
      question: '¿El levantamiento tiene costo?',
      answer: 'Coordinamos contigo la visita presencial o una evaluación virtual. Te informaremos cualquier condición antes de agendar.',
    },
    {
      id: 3,
      question: '¿Cómo sé cómo va mi proyecto?',
      answer: 'Te enviamos reportes con fotos del avance por WhatsApp, sin que tengas que estar en el lugar.',
    },
    {
      id: 4,
      question: '¿Cómo puedo pagar?',
      answer: 'Te indicamos las opciones de pago junto con la cotización, por WhatsApp. La factura con comprobante fiscal se emite al finalizar.',
    },
    {
      id: 5,
      question: '¿En qué zonas trabajan?',
      answer: 'Operamos en Santo Domingo y zonas cercanas. Escríbenos por WhatsApp para confirmar cobertura en tu área.',
    },
  ],
};
