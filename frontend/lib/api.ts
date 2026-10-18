'use client';

// El JWT vive en una cookie httpOnly emitida por el API: JavaScript no puede leerlo. Lo único que se guarda aquí es una
// marca sin secretos ("hubo sesión") para no llamar a /auth/me en cada visita anónima.
const SESSION_HINT_KEY = 'ps_session_hint';

export function hasSessionHint() {
  try { return localStorage.getItem(SESSION_HINT_KEY) === '1'; } catch { return false; }
}
export function setSessionHint(on: boolean) {
  try { on ? localStorage.setItem(SESSION_HINT_KEY, '1') : localStorage.removeItem(SESSION_HINT_KEY); } catch { /* sin almacenamiento */ }
}

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

/** Cliente del API (vía proxy /api de Next). Acepta JSON o FormData. */
export async function api<T = unknown>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;
  if (options.body instanceof FormData) body = options.body;
  else if (options.body !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(options.body); }

  const res = await fetch(`/api${path}`, { method: options.method ?? (body ? 'POST' : 'GET'), headers, body, credentials: 'same-origin' });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message.join('. ') : data?.message || 'Ocurrió un error inesperado';
    if (res.status === 401 && hasSessionHint()) setSessionHint(false);
    throw new ApiError(msg, res.status);
  }
  return data as T;
}
