import { HttpException } from '@nestjs/common';
import { LoginAttempts } from './login-attempts';

describe('LoginAttempts', () => {
  const MIN = 60_000;
  const make = () => Object.assign(new LoginAttempts(), { maxFailures: 3, windowMs: 15 * MIN, lockMs: 15 * MIN });
  const t0 = 1_000_000;

  it('no bloquea mientras no se llegue al máximo de fallos', () => {
    const a = make();
    a.recordFailure('x@test.local', t0);
    a.recordFailure('x@test.local', t0);
    expect(() => a.assertAllowed('x@test.local', t0)).not.toThrow();
  });

  it('bloquea con 429 al llegar al máximo y desbloquea al cumplirse el tiempo', () => {
    const a = make();
    for (let i = 0; i < 3; i++) a.recordFailure('x@test.local', t0);
    try {
      a.assertAllowed('x@test.local', t0 + MIN);
      fail('debía bloquear');
    } catch (e) {
      expect((e as HttpException).getStatus()).toBe(429);
      expect(JSON.stringify((e as HttpException).getResponse())).toContain('14 min');
    }
    expect(() => a.assertAllowed('x@test.local', t0 + 15 * MIN)).not.toThrow();
  });

  it('no distingue mayúsculas ni espacios en el correo', () => {
    const a = make();
    for (let i = 0; i < 3; i++) a.recordFailure(' X@Test.Local ', t0);
    expect(() => a.assertAllowed('x@test.local', t0)).toThrow(HttpException);
  });

  it('cada correo cuenta por separado', () => {
    const a = make();
    for (let i = 0; i < 3; i++) a.recordFailure('a@test.local', t0);
    expect(() => a.assertAllowed('b@test.local', t0)).not.toThrow();
  });

  it('los fallos fuera de la ventana no se acumulan', () => {
    const a = make();
    a.recordFailure('x@test.local', t0);
    a.recordFailure('x@test.local', t0);
    a.recordFailure('x@test.local', t0 + 16 * MIN); // la ventana anterior ya venció: vuelve a contar desde 1
    expect(() => a.assertAllowed('x@test.local', t0 + 16 * MIN)).not.toThrow();
  });

  it('un login correcto borra los fallos', () => {
    const a = make();
    a.recordFailure('x@test.local', t0);
    a.recordFailure('x@test.local', t0);
    a.recordSuccess('x@test.local');
    a.recordFailure('x@test.local', t0);
    expect(() => a.assertAllowed('x@test.local', t0)).not.toThrow();
  });

  it('no crece sin límite: descarta entradas antiguas al pasar de 10 000', () => {
    const a = make();
    for (let i = 0; i < 10_050; i++) a.recordFailure(`u${i}@test.local`, t0);
    expect((a as unknown as { entries: Map<string, unknown> }).entries.size).toBeLessThanOrEqual(10_000);
  });
});
