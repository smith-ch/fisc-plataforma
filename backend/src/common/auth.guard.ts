import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { SESSION_COOKIE, readCookie } from '../auth/session-cookie';
import { PUBLIC_KEY, ROLES_KEY } from './roles.decorator';
import { Role } from './enums';

/**
 * Guard global: valida el JWT (cookie de sesión o Bearer) y los roles declarados con @Roles().
 * Las rutas marcadas con @Public() no exigen token.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, targets);
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers['authorization'];
    // Cookie httpOnly del navegador; el encabezado Bearer sigue valiendo para otros clientes del API.
    const token = header?.startsWith('Bearer ') ? header.slice(7) : readCookie(req.headers['cookie'], SESSION_COOKIE);

    if (token) {
      try {
        const payload = await this.jwt.verifyAsync(token);
        req.user = { id: payload.sub, email: payload.email, role: payload.role, name: payload.name };
      } catch {
        if (!isPublic) throw new UnauthorizedException('Sesión inválida o expirada');
      }
    }

    if (isPublic) return true;
    if (!req.user) throw new UnauthorizedException('Debes iniciar sesión');

    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, targets);
    if (roles?.length && !roles.includes(req.user.role)) {
      throw new ForbiddenException('No tienes permisos para esta acción');
    }
    return true;
  }
}
