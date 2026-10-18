import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

/**
 * Flujo completo contra el API real (módulos, guard global, validación y TypeORM)
 * sobre SQLite en memoria: crear orden → cotizar → pagar → validar.
 */
describe('Órdenes (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let adminToken: string;
  let serviceId: number;
  // La sesión viaja en una cookie httpOnly: se extrae su valor de Set-Cookie y se reenvía como lo haría el navegador.
  const tokenOf = (res: request.Response): string => /ps_session=([^;]+)/.exec([res.headers['set-cookie']].flat().join(';'))![1];
  const auth = (t: string) => ({ Cookie: `ps_session=${t}` });

  const order = (email: string) => ({
    items: [{ serviceId }],
    contactName: 'Cliente de Prueba',
    contactEmail: email,
    contactPhone: '8095551234',
    address: 'Av. Prueba 123, Santo Domingo',
    propertyType: 'residencial',
    urgency: 'normal',
    visitType: 'presencial',
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    http = request(app.getHttpServer());

    const login = await http
      .post('/api/auth/login')
      .send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD })
      .expect(201);
    adminToken = tokenOf(login);
    const catalog = await http.get('/api/services').expect(200);
    serviceId = (Array.isArray(catalog.body) ? catalog.body : catalog.body.items)[0].id;
  });

  afterAll(() => app.close());

  it('crear orden → cotizar → pagar → validar', async () => {
    // 1. Un invitado crea la orden
    const created = await http.post('/api/orders').send(order('flujo@test.local')).expect(201);
    expect(created.body.code).toMatch(/^ORD-\d{6}$/);
    const id: number = created.body.id;

    // 2. Se registra como cliente (la orden de invitado con ese correo queda vinculada)
    const reg = await http
      .post('/api/auth/register')
      .send({ name: 'Cliente Flujo', email: 'flujo@test.local', password: 'Secreta123' })
      .expect(201);
    const clientToken: string = tokenOf(reg);
    const mine = await http.get('/api/my/orders').set(auth(clientToken)).expect(200);
    expect(mine.body.map((o: { id: number }) => o.id)).toContain(id);

    // 3. El admin cotiza
    await http
      .post(`/api/admin/orders/${id}/documents`)
      .set(auth(adminToken))
      .send({ type: 'cotizacion', number: 'COT-E2E-1', amount: 2500 })
      .expect(201);
    const quoted = await http.get(`/api/my/orders/${id}`).set(auth(clientToken)).expect(200);
    expect(quoted.body.status).toBe('cotizada');
    expect(Number(quoted.body.quotedAmount)).toBe(2500);

    // 4. El cliente paga por transferencia con comprobante
    const pay = await http
      .post(`/api/my/orders/${id}/payments`)
      .set(auth(clientToken))
      .field('amount', '2500')
      .field('reference', 'TRF-1')
      .field('bank', 'Banco Prueba')
      .attach('receipt', Buffer.from('comprobante'), { filename: 'comprobante.pdf', contentType: 'application/pdf' })
      .expect(201);
    expect(pay.body.status).toBe('pendiente');
    expect((await http.get(`/api/my/orders/${id}`).set(auth(clientToken))).body.paymentStatus).toBe('en_revision');

    // 5. El admin valida el pago
    const validated = await http.patch(`/api/admin/payments/${pay.body.id}`).set(auth(adminToken)).send({ status: 'validado' }).expect(200);
    expect(validated.body.status).toBe('validado');
    expect((await http.get(`/api/my/orders/${id}`).set(auth(clientToken))).body.paymentStatus).toBe('pagado');

    // 6. Un pago no se procesa dos veces
    await http.patch(`/api/admin/payments/${pay.body.id}`).set(auth(adminToken)).send({ status: 'validado' }).expect(409);

    // 7. El seguimiento público muestra el avance sin datos internos
    const code = created.body.code;
    const tracked = await http.get('/api/orders/track').query({ code, email: 'flujo@test.local' }).expect(200);
    expect(tracked.body.code).toBe(code);
    expect(tracked.body).not.toHaveProperty('internalNotes');
  });

  it('valida los datos de la orden (400)', async () => {
    await http
      .post('/api/orders')
      .send({ ...order('x@test.local'), items: [] })
      .expect(400);
    await http
      .post('/api/orders')
      .send({ ...order('no-es-correo') })
      .expect(400);
  });

  it('protege las rutas: sin sesión 401, con rol equivocado 403', async () => {
    await http.get('/api/staff/orders').expect(401);
    await http.get('/api/my/orders').expect(401);
    const reg = await http
      .post('/api/auth/register')
      .send({ name: 'Otro Cliente', email: 'otro@test.local', password: 'Secreta123' })
      .expect(201);
    await http
      .get('/api/staff/orders')
      .set(auth(tokenOf(reg)))
      .expect(403);
    await http
      .get('/api/admin/payments')
      .set(auth(tokenOf(reg)))
      .expect(403);
    await http.get('/api/admin/payments').set(auth(adminToken)).expect(200);
  });

  it('un cliente no ve ni paga la orden de otro cliente', async () => {
    const created = await http.post('/api/orders').send(order('duenio@test.local')).expect(201);
    const owner = await http
      .post('/api/auth/register')
      .send({ name: 'Dueño', email: 'duenio@test.local', password: 'Secreta123' })
      .expect(201);
    const stranger = await http
      .post('/api/auth/register')
      .send({ name: 'Intruso', email: 'intruso@test.local', password: 'Secreta123' })
      .expect(201);
    await http
      .get(`/api/my/orders/${created.body.id}`)
      .set(auth(tokenOf(owner)))
      .expect(200);
    await http
      .get(`/api/my/orders/${created.body.id}`)
      .set(auth(tokenOf(stranger)))
      .expect(403);
    await http
      .post(`/api/my/orders/${created.body.id}/payments`)
      .set(auth(tokenOf(stranger)))
      .field('amount', '10')
      .attach('receipt', Buffer.from('x'), { filename: 'c.pdf', contentType: 'application/pdf' })
      .expect(403);
  });

  it('el seguimiento público no revela la orden con otro correo (404)', async () => {
    const created = await http.post('/api/orders').send(order('privada@test.local')).expect(201);
    await http.get('/api/orders/track').query({ code: created.body.code, email: 'otra@test.local' }).expect(404);
  });

  it('los listados del panel responden paginados', async () => {
    for (let n = 0; n < 3; n++)
      await http
        .post('/api/orders')
        .send(order(`pag${n}@test.local`))
        .expect(201);
    await http.post('/api/leads').send({ name: 'Persona', phone: '8095550000', message: 'Hola, quiero información' }).expect(201);

    const p1 = await http.get('/api/staff/orders').query({ page: 1, limit: 2 }).set(auth(adminToken)).expect(200);
    expect(p1.body.items).toHaveLength(2);
    expect(p1.body.total).toBeGreaterThanOrEqual(3);
    expect(p1.body).toMatchObject({ page: 1, limit: 2 });
    const p2 = await http.get('/api/staff/orders').query({ page: 2, limit: 2 }).set(auth(adminToken)).expect(200);
    expect(p2.body.items.map((o: { id: number }) => o.id)).not.toEqual(
      expect.arrayContaining(p1.body.items.map((o: { id: number }) => o.id)),
    );

    const payments = await http.get('/api/admin/payments').query({ status: 'pendiente', limit: 5 }).set(auth(adminToken)).expect(200);
    expect(payments.body).toEqual(
      expect.objectContaining({ items: expect.any(Array), total: expect.any(Number), pages: expect.any(Number) }),
    );

    const leads = await http.get('/api/admin/leads').query({ handled: 'false' }).set(auth(adminToken)).expect(200);
    expect(leads.body.items.length).toBeGreaterThanOrEqual(1);
    expect(leads.body.items.every((l: { handled: boolean }) => l.handled === false)).toBe(true);
    const done = await http.get('/api/admin/leads').query({ handled: 'true' }).set(auth(adminToken)).expect(200);
    expect(done.body.total).toBe(0);

    // CRUD genérico: sin page/limit devuelve todo (array); con ellos, paginado
    expect(Array.isArray((await http.get('/api/admin/faqs').set(auth(adminToken)).expect(200)).body)).toBe(true);
    const faqs = await http.get('/api/admin/faqs').query({ page: 1, limit: 2 }).set(auth(adminToken)).expect(200);
    expect(faqs.body.items.length).toBeLessThanOrEqual(2);
  });

  describe('validación de entradas y acceso (#10)', () => {
    let id: number;
    let docId: number;
    let clientToken: string;

    beforeAll(async () => {
      const created = await http.post('/api/orders').send(order('val@test.local')).expect(201);
      id = created.body.id;
      clientToken = tokenOf(
        await http.post('/api/auth/register').send({ name: 'Cliente Val', email: 'val@test.local', password: 'Secreta123' }).expect(201),
      );
      const doc = await http
        .post(`/api/admin/orders/${id}/documents`)
        .set(auth(adminToken))
        .send({ type: 'factura', number: 'F-VAL-1', amount: 100 })
        .expect(201);
      docId = doc.body.id;
    });

    it('PATCH /admin/documents/:id valida el cuerpo y no permite asignación masiva', async () => {
      await http.patch(`/api/admin/documents/${docId}`).set(auth(adminToken)).send({ amount: 'mucho' }).expect(400);
      await http.patch(`/api/admin/documents/${docId}`).set(auth(adminToken)).send({ type: 'otra-cosa' }).expect(400);
      const ok = await http
        .patch(`/api/admin/documents/${docId}`)
        .set(auth(adminToken))
        .send({ status: 'aprobada', origin: 'concrebill', id: 999, concrebillId: 'X-1' })
        .expect(200);
      expect(ok.body.status).toBe('aprobada');
      expect(ok.body.id).toBe(docId);
      expect(ok.body.origin).toBe('manual');
    });

    it('GET /staff/orders rechaza filtros inválidos', async () => {
      await http.get('/api/staff/orders').query({ status: 'inventado' }).set(auth(adminToken)).expect(400);
      await http.get('/api/staff/orders').query({ page: 0 }).set(auth(adminToken)).expect(400);
      await http.get('/api/staff/orders').query({ technicianId: 'abc' }).set(auth(adminToken)).expect(400);
      await http.get('/api/staff/orders').query({ status: 'recibida' }).set(auth(adminToken)).expect(200);
    });

    it('PATCH /admin/leads/:id exige un booleano', async () => {
      const lead = await http.post('/api/leads').send({ name: 'Persona', phone: '8095550000', message: 'Mensaje de prueba' }).expect(201);
      expect(lead.body).toEqual({ ok: true });
      const list = await http.get('/api/admin/leads').set(auth(adminToken)).expect(200);
      const leadId = list.body.items[0].id;
      await http.patch(`/api/admin/leads/${leadId}`).set(auth(adminToken)).send({ handled: 'si' }).expect(400);
      await http.patch(`/api/admin/leads/${leadId}`).set(auth(adminToken)).send({}).expect(400);
      const done = await http.patch(`/api/admin/leads/${leadId}`).set(auth(adminToken)).send({ handled: true }).expect(200);
      expect(done.body.handled).toBe(true);
    });

    it('PUT /admin/settings/:key rechaza lo que no es un objeto o tiene tipos erróneos y descarta campos desconocidos', async () => {
      await http.put('/api/admin/settings/brand').set(auth(adminToken)).send([1, 2]).expect(400);
      await http.put('/api/admin/settings/brand').set(auth(adminToken)).send({ name: 42 }).expect(400);
      await http.put('/api/admin/settings/nada').set(auth(adminToken)).send({}).expect(400);
      const ok = await http
        .put('/api/admin/settings/brand')
        .set(auth(adminToken))
        .send({ name: 'F.I.S.C. Test', intruso: 'x' })
        .expect(200);
      expect(ok.body).toEqual({ name: 'F.I.S.C. Test' });
    });

    it('un cliente no puede asociar su pago a un documento de otra orden', async () => {
      const other = await http.post('/api/orders').send(order('otra-orden@test.local')).expect(201);
      const foreign = await http
        .post(`/api/admin/orders/${other.body.id}/documents`)
        .set(auth(adminToken))
        .send({ type: 'factura', number: 'F-AJENA', amount: 100 })
        .expect(201);
      const pay = (documentId: number) =>
        http
          .post(`/api/my/orders/${id}/payments`)
          .set(auth(clientToken))
          .field('amount', '100')
          .field('documentId', String(documentId))
          .attach('receipt', Buffer.from('x'), { filename: 'c.pdf', contentType: 'application/pdf' });
      await pay(foreign.body.id).expect(400);
      await pay(docId).expect(201);
    });
  });

  describe('sesión con cookie httpOnly (#9)', () => {
    const cookiesOf = (res: request.Response) => [res.headers['set-cookie']].flat().filter(Boolean) as string[];

    it('el login pone el JWT solo en una cookie httpOnly y no lo devuelve en el cuerpo', async () => {
      const res = await http
        .post('/api/auth/login')
        .send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD })
        .expect(201);
      expect(res.body.token).toBeUndefined();
      expect(res.body.user).toMatchObject({ email: process.env.ADMIN_EMAIL, role: 'admin' });
      expect(res.body.user.passwordHash).toBeUndefined();
      const cookie = cookiesOf(res).find((c) => c.startsWith('ps_session='))!;
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/SameSite=Lax/i);
      expect(cookie).toMatch(/Path=\//);
      expect(cookie).toMatch(/Expires=/i);
      expect(JSON.stringify(res.body)).not.toContain(tokenOf(res));
    });

    it('el registro también inicia sesión con cookie', async () => {
      const res = await http
        .post('/api/auth/register')
        .send({ name: 'Cookie Reg', email: 'cookie-reg@test.local', password: 'Secreta123' })
        .expect(201);
      expect(res.body.token).toBeUndefined();
      const me = await http
        .get('/api/auth/me')
        .set(auth(tokenOf(res)))
        .expect(200);
      expect(me.body.email).toBe('cookie-reg@test.local');
    });

    it('sin cookie ni token responde 401; el encabezado Bearer sigue funcionando para otros clientes', async () => {
      await http.get('/api/auth/me').expect(401);
      await http.get('/api/auth/me').set({ Cookie: 'ps_session=token-roto' }).expect(401);
      await http
        .get('/api/auth/me')
        .set({ Authorization: `Bearer ${adminToken}` })
        .expect(200);
    });

    it('refresh renueva la sesión con una cookie nueva', async () => {
      const res = await http.post('/api/auth/refresh').set(auth(adminToken)).expect(200);
      expect(res.body.user.role).toBe('admin');
      expect(cookiesOf(res).some((c) => c.startsWith('ps_session=') && /HttpOnly/i.test(c))).toBe(true);
      await http.post('/api/auth/refresh').expect(401);
    });

    it('refresh falla y borra la cookie si la cuenta fue desactivada', async () => {
      const reg = await http
        .post('/api/auth/register')
        .send({ name: 'Baja', email: 'baja@test.local', password: 'Secreta123' })
        .expect(201);
      const t = tokenOf(reg);
      await http.patch(`/api/admin/users/${reg.body.user.id}`).set(auth(adminToken)).send({ active: false }).expect(200);
      const res = await http.post('/api/auth/refresh').set(auth(t)).expect(401);
      expect(cookiesOf(res).some((c) => /^ps_session=;/.test(c))).toBe(true);
    });

    it('logout borra la cookie', async () => {
      const res = await http.post('/api/auth/logout').expect(200);
      const cookie = cookiesOf(res).find((c) => c.startsWith('ps_session='))!;
      expect(cookie).toMatch(/^ps_session=;/);
      expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970/);
    });
  });

  describe('límites y cabeceras de seguridad (#8)', () => {
    const throttleOn = () => delete process.env.THROTTLE_DISABLED;
    afterEach(() => {
      process.env.THROTTLE_DISABLED = 'true';
    });

    it('envía las cabeceras de helmet', async () => {
      const res = await http.get('/api/services').expect(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['content-security-policy']).toContain("default-src 'self'");
      expect(res.headers['strict-transport-security']).toBeDefined();
      expect(res.headers['x-frame-options']).toBeDefined();
      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    });

    it('GET /orders/track limita a 10 por minuto y responde 429 con Retry-After', async () => {
      throttleOn();
      const call = () => http.get('/api/orders/track').query({ code: 'ORD-999999', email: 'nadie@test.local' });
      for (let n = 0; n < 10; n++) await call().expect(404);
      const blocked = await call().expect(429);
      expect(blocked.headers['retry-after']).toBeDefined();
    });

    it('POST /leads limita a 5 por 10 minutos', async () => {
      throttleOn();
      const send = () => http.post('/api/leads').send({ name: 'Spam', phone: '8095550000', message: 'Mensaje repetido' });
      for (let n = 0; n < 5; n++) await send().expect(201);
      await send().expect(429);
    });

    it('POST /auth/login limita a 10 por minuto por IP', async () => {
      throttleOn();
      const attempt = (n: number) => http.post('/api/auth/login').send({ email: `rafaga${n}@test.local`, password: 'incorrecta' });
      for (let n = 0; n < 10; n++) await attempt(n).expect(401);
      await attempt(11).expect(429);
    });

    it('las demás rutas siguen respondiendo con el límite global activo', async () => {
      throttleOn();
      await http.get('/api/services').expect(200);
    });

    it('tras 3 contraseñas incorrectas bloquea ese correo aunque luego llegue la correcta, sin afectar a otros', async () => {
      await http.post('/api/auth/register').send({ name: 'Bloqueada', email: 'bloqueo@test.local', password: 'Secreta123' }).expect(201);
      const login = (password: string, email = 'bloqueo@test.local') => http.post('/api/auth/login').send({ email, password });
      for (let n = 0; n < 3; n++) await login('mala').expect(401);
      const locked = await login('Secreta123').expect(429);
      expect(locked.body.message).toMatch(/Demasiados intentos/);
      expect(locked.headers['set-cookie']).toBeUndefined();
      await login('Secreta123', 'BLOQUEO@test.local').expect(429); // el correo se compara sin distinguir mayúsculas
      await http.post('/api/auth/login').send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }).expect(201);
    });

    it('un login correcto reinicia el conteo de fallos', async () => {
      await http.post('/api/auth/register').send({ name: 'Reinicia', email: 'reinicia@test.local', password: 'Secreta123' }).expect(201);
      const login = (password: string) => http.post('/api/auth/login').send({ email: 'reinicia@test.local', password });
      for (let round = 0; round < 3; round++) {
        await login('mala').expect(401);
        await login('mala').expect(401);
        await login('Secreta123').expect(201);
      }
    });
  });
});
