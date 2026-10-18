import { Body, Controller, Get, HttpCode, Patch, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { Public } from '../common/roles.decorator';
import { LoginDto, RegisterDto, UpdateProfileDto } from './auth.dto';
import { AuthService, Session } from './auth.service';
import { clearSessionCookie, setSessionCookie } from './session-cookie';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** El token viaja solo en una cookie httpOnly: la respuesta lleva el usuario, nunca el JWT. */
  private start(res: Response, session: Session) {
    setSessionCookie(res, session.token, session.exp);
    return { user: session.user };
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return this.start(res, await this.auth.register(dto));
  }

  @Public()
  @Post('login')
  @HttpCode(201)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.start(res, await this.auth.login(dto));
  }

  /** Renueva la sesión (nuevo JWT con el rol y el estado actuales del usuario). */
  @Post('refresh')
  @HttpCode(200)
  async refresh(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) res: Response) {
    try {
      return this.start(res, await this.auth.refresh(user.id));
    } catch (e) {
      clearSessionCookie(res);
      throw e;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    clearSessionCookie(res);
    return { ok: true };
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @Patch('me')
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user.id, dto);
  }
}
