import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Flujo completo contra el API real (módulos, guard global, validación y TypeORM)
 * sobre SQLite en memoria: crear orden → cotizar → pagar → validar.
 */
describe('Órdenes (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let adminToken: string;
  let serviceId: number;
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

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
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    http = request(app.getHttpServer());

    const login = await http
      .post('/api/auth/login')
      .send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD })
      .expect(201);
    adminToken = login.body.token;
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
    const clientToken: string = reg.body.token;
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
    await http.get('/api/staff/orders').set(auth(reg.body.token)).expect(403);
    await http.get('/api/admin/payments').set(auth(reg.body.token)).expect(403);
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
    await http.get(`/api/my/orders/${created.body.id}`).set(auth(owner.body.token)).expect(200);
    await http.get(`/api/my/orders/${created.body.id}`).set(auth(stranger.body.token)).expect(403);
    await http
      .post(`/api/my/orders/${created.body.id}/payments`)
      .set(auth(stranger.body.token))
      .field('amount', '10')
      .attach('receipt', Buffer.from('x'), { filename: 'c.pdf', contentType: 'application/pdf' })
      .expect(403);
  });

  it('el seguimiento público no revela la orden con otro correo (404)', async () => {
    const created = await http.post('/api/orders').send(order('privada@test.local')).expect(201);
    await http.get('/api/orders/track').query({ code: created.body.code, email: 'otra@test.local' }).expect(404);
  });
});
