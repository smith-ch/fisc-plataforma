import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { Role } from './enums';
import { Public, Roles } from './roles.decorator';

// Controlador de prueba: las rutas llevan los mismos decoradores que las reales.
class OpenController {
  @Public() open() {}
  protectedByLogin() {}
  @Roles(Role.ADMIN) adminOnly() {}
  @Roles(Role.ADMIN, Role.TECHNICIAN) staff() {}
}

@Roles(Role.CLIENT)
class ClientController {
  mine() {}
  @Roles(Role.ADMIN) override() {}
}

describe('AuthGuard', () => {
  const jwt = new JwtService({ secret: 'secreto-de-prueba' });
  const guard = new AuthGuard(jwt, new Reflector());

  const token = (role: Role, id = 1) => jwt.sign({ sub: id, email: `${role}@test.local`, role, name: role });

  function ctx(cls: new () => object, handler: string, authorization?: string) {
    const req: { headers: Record<string, string | undefined>; user?: unknown } = { headers: { authorization } };
    const context = {
      getHandler: () => (cls.prototype as Record<string, () => void>)[handler],
      getClass: () => cls,
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;
    return { context, req };
  }

  it('deja pasar las rutas públicas sin token', async () => {
    const { context, req } = ctx(OpenController, 'open');
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(req.user).toBeUndefined();
  });

  it('en una ruta pública adjunta el usuario si el token es válido', async () => {
    const { context, req } = ctx(OpenController, 'open', `Bearer ${token(Role.CLIENT, 7)}`);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(req.user).toEqual({ id: 7, email: 'client@test.local', role: Role.CLIENT, name: 'client' });
  });

  it('en una ruta pública ignora un token inválido en lugar de fallar', async () => {
    const { context, req } = ctx(OpenController, 'open', 'Bearer token-roto');
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(req.user).toBeUndefined();
  });

  it('exige sesión en rutas no públicas', async () => {
    await expect(guard.canActivate(ctx(OpenController, 'protectedByLogin').context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza un token inválido o firmado con otra clave en rutas protegidas', async () => {
    const forged = new JwtService({ secret: 'otra-clave' }).sign({ sub: 1, role: Role.ADMIN });
    await expect(guard.canActivate(ctx(OpenController, 'protectedByLogin', 'Bearer token-roto').context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(guard.canActivate(ctx(OpenController, 'adminOnly', `Bearer ${forged}`).context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza un token vencido', async () => {
    const expired = jwt.sign({ sub: 1, role: Role.ADMIN }, { expiresIn: -10 });
    await expect(guard.canActivate(ctx(OpenController, 'adminOnly', `Bearer ${expired}`).context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('ignora cabeceras que no son Bearer', async () => {
    await expect(guard.canActivate(ctx(OpenController, 'protectedByLogin', `Basic ${token(Role.ADMIN)}`).context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('una ruta sin @Roles acepta cualquier usuario autenticado', async () => {
    await expect(guard.canActivate(ctx(OpenController, 'protectedByLogin', `Bearer ${token(Role.CLIENT)}`).context)).resolves.toBe(true);
  });

  it('aplica los roles declarados en la ruta (403 si no coincide)', async () => {
    await expect(guard.canActivate(ctx(OpenController, 'adminOnly', `Bearer ${token(Role.ADMIN)}`).context)).resolves.toBe(true);
    await expect(guard.canActivate(ctx(OpenController, 'adminOnly', `Bearer ${token(Role.TECHNICIAN)}`).context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(guard.canActivate(ctx(OpenController, 'adminOnly', `Bearer ${token(Role.CLIENT)}`).context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(guard.canActivate(ctx(OpenController, 'staff', `Bearer ${token(Role.TECHNICIAN)}`).context)).resolves.toBe(true);
    await expect(guard.canActivate(ctx(OpenController, 'staff', `Bearer ${token(Role.CLIENT)}`).context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('usa los roles de la clase y el de la ruta tiene prioridad', async () => {
    await expect(guard.canActivate(ctx(ClientController, 'mine', `Bearer ${token(Role.CLIENT)}`).context)).resolves.toBe(true);
    await expect(guard.canActivate(ctx(ClientController, 'mine', `Bearer ${token(Role.ADMIN)}`).context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(guard.canActivate(ctx(ClientController, 'override', `Bearer ${token(Role.ADMIN)}`).context)).resolves.toBe(true);
    await expect(guard.canActivate(ctx(ClientController, 'override', `Bearer ${token(Role.CLIENT)}`).context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
