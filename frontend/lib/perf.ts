/**
 * Equipos de gama baja o con ahorro de datos: se omiten el scroll suave (Lenis) y los
 * canvas animados; quedan el degradado y la malla dibujados una sola vez.
 */
export function isLowPowerDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const n = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return !!n.connection?.saveData || (n.deviceMemory ?? 8) <= 4 || (n.hardwareConcurrency ?? 8) <= 4;
}
