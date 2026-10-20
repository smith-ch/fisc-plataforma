/**
 * Enlaces de contacto de la web. Todo lo que abre WhatsApp, el teléfono, el correo o el mapa se arma aquí, para que
 * los datos (que salen de `data/contenido.ts`) se vean y se comporten igual en el pie, Contacto, el botón flotante,
 * el carrito, el formulario de solicitud y las fichas de servicio.
 *
 * Sin dependencias: se puede probar con `npm run test`.
 */

/** Solo los dígitos de un teléfono ("+1 (809) 555-0100" → "18095550100"). */
export function onlyDigits(value: string): string {
  return (value ?? '').replace(/\D/g, '');
}

/** WhatsApp como se guarda en `data/contenido.ts`: solo dígitos con código de país, sin 0 inicial (8 a 15 dígitos). */
export function isValidWhatsapp(value: string): boolean {
  return /^[1-9]\d{7,14}$/.test((value ?? '').trim());
}

/** `https://wa.me/<dígitos>` con el mensaje opcional ya codificado. Acepta el número con espacios, guiones o `+`. */
export function whatsappLink(phone: string, text?: string): string {
  const digits = onlyDigits(phone);
  if (!digits) return '';
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

/** `tel:` para llamar con un toque; conserva el `+` si el número lo trae. */
export function telLink(phone: string): string {
  const digits = onlyDigits(phone);
  if (!digits) return '';
  return `tel:${(phone ?? '').trim().startsWith('+') ? '+' : ''}${digits}`;
}

/** `mailto:` con asunto opcional. */
export function mailtoLink(email: string, subject?: string): string {
  const to = (email ?? '').trim();
  if (!to) return '';
  return `mailto:${to}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
}

/** Búsqueda de la dirección en Google Maps. */
export function mapLink(address: string): string {
  const q = (address ?? '').trim();
  if (!q) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
