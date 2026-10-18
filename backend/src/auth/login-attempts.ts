import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

/**
 * Bloqueo temporal de login: tras `maxFailures` intentos fallidos para un mismo correo dentro de `windowMs`,
 * el correo queda bloqueado `lockMs`. Cuenta también los correos que no existen (no revela cuáles hay).
 *
 * Es memoria del proceso: se reinicia con el servidor y no se comparte entre instancias. El límite por IP del
 * throttler global frena la fuerza bruta distribuida; esto frena la dirigida a una cuenta.
 */
@Injectable()
export class LoginAttempts {
  private readonly entries = new Map<string, { failures: number; first: number; lockedUntil: number }>();
  private static readonly MAX_ENTRIES = 10_000;

  // Configurables por entorno; son campos y no parámetros del constructor para que Nest no los trate como dependencias.
  maxFailures = Number(process.env.LOGIN_MAX_FAILURES || 10);
  windowMs = Number(process.env.LOGIN_WINDOW_MINUTES || 15) * 60_000;
  lockMs = Number(process.env.LOGIN_LOCK_MINUTES || 15) * 60_000;

  private key(email: string) {
    return email.toLowerCase().trim();
  }

  /** Lanza 429 si el correo está bloqueado. */
  assertAllowed(email: string, now = Date.now()) {
    const e = this.entries.get(this.key(email));
    if (e && e.lockedUntil > now) {
      const minutes = Math.ceil((e.lockedUntil - now) / 60_000);
      throw new HttpException(
        { statusCode: 429, message: `Demasiados intentos fallidos. Intenta de nuevo en ${minutes} min.`, error: 'Too Many Requests' },
        HttpStatus.TOO_MANY_REQUESTS,
        { cause: undefined },
      );
    }
  }

  recordFailure(email: string, now = Date.now()) {
    const key = this.key(email);
    let e = this.entries.get(key);
    if (!e || now - e.first > this.windowMs) e = { failures: 0, first: now, lockedUntil: 0 };
    e.failures += 1;
    if (e.failures >= this.maxFailures) e.lockedUntil = now + this.lockMs;
    this.entries.set(key, e);
    if (this.entries.size > LoginAttempts.MAX_ENTRIES) this.prune(now);
  }

  recordSuccess(email: string) {
    this.entries.delete(this.key(email));
  }

  /** Elimina entradas vencidas; si aun así hay demasiadas, descarta las más antiguas (evita crecer sin límite). */
  private prune(now: number) {
    for (const [k, e] of this.entries) if (e.lockedUntil <= now && now - e.first > this.windowMs) this.entries.delete(k);
    while (this.entries.size > LoginAttempts.MAX_ENTRIES) {
      const oldest = this.entries.keys().next().value as string;
      this.entries.delete(oldest);
    }
  }
}
