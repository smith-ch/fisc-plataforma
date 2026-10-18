import type { CookieOptions, Response } from 'express';

/** Cookie de sesión: contiene el JWT y no es legible desde JavaScript (httpOnly). */
export const SESSION_COOKIE = 'ps_session';

/** Lee una cookie del encabezado `Cookie` (sin depender de cookie-parser). */
export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0 || part.slice(0, eq).trim() !== name) continue;
    const raw = part.slice(eq + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * `Secure` por defecto en producción (el frontend va por HTTPS); `COOKIE_SECURE=false` lo desactiva
 * para probar en local detrás de HTTP. `SameSite=Lax` evita que otros sitios envíen la cookie en
 * peticiones que cambian datos (el frontend y el API comparten origen gracias al proxy `/api`).
 */
function baseOptions(): CookieOptions {
  const secureEnv = process.env.COOKIE_SECURE;
  const secure = secureEnv ? secureEnv === 'true' : process.env.NODE_ENV === 'production';
  return { httpOnly: true, sameSite: 'lax', secure, path: '/' };
}

/** Segundos de vida del token (`exp - iat`) para que la cookie caduque a la vez que el JWT. */
export function setSessionCookie(res: Response, token: string, exp?: number) {
  const maxAge = exp ? Math.max(0, exp * 1000 - Date.now()) : undefined;
  res.cookie(SESSION_COOKIE, token, { ...baseOptions(), ...(maxAge !== undefined ? { maxAge } : {}) });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, baseOptions());
}
