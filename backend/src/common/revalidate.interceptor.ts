import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

const CONTENT_PATH = /^\/api\/admin\/(settings|testimonials|faqs|projects|pillars|services|reviews)(\/|$)/;

/**
 * Tras guardar contenido o catálogo desde el panel, pide al frontend que invalide la
 * caché de la landing (POST /api/revalidate). No bloquea ni falla la respuesta: si el
 * frontend no responde, la landing se refresca sola al vencer su caché (5 min).
 */
@Injectable()
export class RevalidateInterceptor implements NestInterceptor {
  private readonly log = new Logger('Revalidate');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<{ method: string; path: string }>();
    const mutates = req.method !== 'GET' && req.method !== 'HEAD' && CONTENT_PATH.test(req.path);
    return next.handle().pipe(tap(() => { if (mutates) void this.notify(); }));
  }

  private async notify() {
    const secret = process.env.REVALIDATE_SECRET;
    if (!secret) return;
    const base = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim().replace(/\/$/, '');
    try {
      const res = await fetch(`${base}/api/revalidate`, { method: 'POST', headers: { 'x-revalidate-secret': secret }, signal: AbortSignal.timeout(5000) });
      if (!res.ok) this.log.warn(`El frontend respondió ${res.status} al revalidar`);
    } catch (e) {
      this.log.warn(`No se pudo notificar al frontend: ${(e as Error).message}`);
    }
  }
}
