import { clearSessionCookie, readCookie, setSessionCookie, SESSION_COOKIE } from './session-cookie';

describe('readCookie', () => {
  it('lee una cookie entre varias', () => {
    expect(readCookie('a=1; ps_session=abc.def; b=2', 'ps_session')).toBe('abc.def');
  });

  it('no confunde nombres que solo terminan igual', () => {
    expect(readCookie('x_ps_session=malo; ps_session=bueno', 'ps_session')).toBe('bueno');
    expect(readCookie('x_ps_session=malo', 'ps_session')).toBeUndefined();
  });

  it('maneja ausencia, valores vacíos y codificación inválida', () => {
    expect(readCookie(undefined, 'ps_session')).toBeUndefined();
    expect(readCookie('', 'ps_session')).toBeUndefined();
    expect(readCookie('ps_session=', 'ps_session')).toBe('');
    expect(readCookie('ps_session=%E0%A4%A', 'ps_session')).toBeUndefined();
    expect(readCookie('ps_session=a%20b', 'ps_session')).toBe('a b');
  });
});

describe('opciones de la cookie de sesión', () => {
  const fake = () => {
    const calls: { name: string; value?: string; opts: Record<string, unknown> }[] = [];
    const res = {
      cookie: (name: string, value: string, opts: Record<string, unknown>) => calls.push({ name, value, opts }),
      clearCookie: (name: string, opts: Record<string, unknown>) => calls.push({ name, opts }),
    };
    return { res: res as never, calls };
  };
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });

  it('es httpOnly, SameSite=Lax, de ruta / y caduca con el JWT', () => {
    delete process.env.COOKIE_SECURE;
    process.env.NODE_ENV = 'test';
    const { res, calls } = fake();
    setSessionCookie(res, 'jwt', Math.floor(Date.now() / 1000) + 3600);
    expect(calls[0]).toMatchObject({
      name: SESSION_COOKIE,
      value: 'jwt',
      opts: { httpOnly: true, sameSite: 'lax', path: '/', secure: false },
    });
    expect(calls[0].opts.maxAge as number).toBeGreaterThan(3_500_000);
    expect(calls[0].opts.maxAge as number).toBeLessThanOrEqual(3_600_000);
  });

  it('es Secure en producción y COOKIE_SECURE manda sobre NODE_ENV', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.COOKIE_SECURE;
    let f = fake();
    setSessionCookie(f.res, 'jwt');
    expect(f.calls[0].opts.secure).toBe(true);
    process.env.COOKIE_SECURE = 'false';
    f = fake();
    setSessionCookie(f.res, 'jwt');
    expect(f.calls[0].opts.secure).toBe(false);
  });

  it('clearSessionCookie usa las mismas opciones para poder borrarla', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.COOKIE_SECURE;
    const { res, calls } = fake();
    clearSessionCookie(res);
    expect(calls[0]).toMatchObject({ name: SESSION_COOKIE, opts: { httpOnly: true, sameSite: 'lax', path: '/', secure: true } });
  });
});
