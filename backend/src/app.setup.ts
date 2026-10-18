import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

/**
 * Configuración común del API (la usan `main.ts` y las pruebas e2e): prefijo, CORS, cabeceras de seguridad,
 * proxy de confianza y validación global.
 */
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.enableCors({ origin: (process.env.FRONTEND_URL || 'http://localhost:3000').split(','), credentials: true });

  // `crossOriginResourcePolicy: cross-origin` para que el frontend (otro origen en desarrollo) pueda mostrar /uploads.
  // La CSP por defecto de helmet (default-src 'self') también impide ejecutar scripts de un SVG servido desde aquí.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // Detrás de un proxy (el rewrite de Next/Vercel) la IP real llega en X-Forwarded-For. Sin esto todos los
  // visitantes compartirían la IP del proxy y el límite de peticiones los contaría juntos.
  // TRUST_PROXY = número de proxies de confianza delante del API (0 = ninguno, p. ej. en local).
  const hops = Number(process.env.TRUST_PROXY ?? (process.env.NODE_ENV === 'production' ? 1 : 0));
  if (hops > 0) (app as NestExpressApplication).set('trust proxy', hops);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}
