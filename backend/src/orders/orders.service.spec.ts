import { BadGatewayException, BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthUser } from '../common/current-user.decorator';
import { DocumentType, OrderSource, OrderStatus, PaymentMethod, PaymentRecordStatus, PaymentStatus, Role } from '../common/enums';
import { BillingDocument, Order, OrderPhoto, OrderUpdate, Payment, Review, ServiceItem, User } from '../entities';
import { createTestDataSource, Fixtures, seedFixtures } from '../../test/helpers/db';
import { CreateOrderDto } from './orders.dto';
import { OrdersService } from './orders.service';

const asUser = (u: User): AuthUser => ({ id: u.id, email: u.email, role: u.role, name: u.name });

describe('OrdersService', () => {
  let ds: DataSource;
  let fx: Fixtures;
  let service: OrdersService;
  const concrebill = { createOrder: jest.fn(), registerPayment: jest.fn(), listClientDocuments: jest.fn(), enabled: false };
  const auth = { syncClient: jest.fn() };

  const dto = (over: Partial<CreateOrderDto> = {}): CreateOrderDto => ({
    items: [{ serviceId: fx.service.id }],
    contactName: 'Persona Invitada',
    contactEmail: 'Invitada@Test.Local ',
    contactPhone: '8095550000',
    address: 'Calle 1, Santo Domingo',
    propertyType: 'residencial',
    urgency: 'normal',
    visitType: 'presencial',
    ...over,
  });

  beforeEach(async () => {
    ds = await createTestDataSource();
    fx = await seedFixtures(ds);
    jest.resetAllMocks();
    auth.syncClient.mockResolvedValue(null);
    service = new OrdersService(
      ds.getRepository(Order),
      ds.getRepository(OrderUpdate),
      ds.getRepository(OrderPhoto),
      ds.getRepository(ServiceItem),
      ds.getRepository(Review),
      ds.getRepository(BillingDocument),
      ds.getRepository(Payment),
      ds.getRepository(User),
      concrebill as never,
      auth as never,
      ds,
    );
  });

  afterEach(() => ds.destroy());

  const orderOf = (id: number) => ds.getRepository(Order).findOneByOrFail({ id });
  const setStatus = (id: number, status: OrderStatus) => ds.getRepository(Order).update(id, { status });

  describe('create', () => {
    it('crea la orden con código, correo normalizado y primera entrada visible en la bitácora', async () => {
      const { id, code } = await service.create(dto());
      expect(code).toBe('ORD-000001');
      const order = await ds.getRepository(Order).findOneOrFail({ where: { id }, relations: { items: true, client: true } });
      expect(order.contactEmail).toBe('invitada@test.local');
      expect(order.status).toBe(OrderStatus.RECEIVED);
      expect(order.source).toBe(OrderSource.WEB);
      expect(order.client).toBeNull();
      expect(order.items).toHaveLength(1);
      expect(order.items[0].serviceName).toBe('Pintura interior');
      const updates = await ds.getRepository(OrderUpdate).find({ where: { order: { id } } });
      expect(updates).toHaveLength(1);
      expect(updates[0].visibleToClient).toBe(true);
    });

    it('rechaza servicios que no existen y no deja una orden a medias', async () => {
      await expect(service.create(dto({ items: [{ serviceId: fx.service.id }, { serviceId: 9999 }] }))).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(await ds.getRepository(Order).count()).toBe(0);
    });

    it('vincula al cliente autenticado y usa su sesión, no el correo del formulario', async () => {
      const { id } = await service.create(dto({ contactEmail: 'otro@test.local' }), asUser(fx.client));
      const order = await ds.getRepository(Order).findOneOrFail({ where: { id }, relations: { client: true } });
      expect(order.client?.id).toBe(fx.client.id);
    });

    it('vincula al invitado cuyo correo coincide con un cliente registrado', async () => {
      const { id } = await service.create(dto({ contactEmail: fx.otherClient.email }));
      const order = await ds.getRepository(Order).findOneOrFail({ where: { id }, relations: { client: true } });
      expect(order.client?.id).toBe(fx.otherClient.id);
    });

    it('solo el staff puede fijar el origen de la orden', async () => {
      const web = await service.create(dto({ source: OrderSource.WHATSAPP }));
      const staff = await service.create(dto({ source: OrderSource.WHATSAPP }), asUser(fx.admin));
      expect((await orderOf(web.id)).source).toBe(OrderSource.WEB);
      expect((await orderOf(staff.id)).source).toBe(OrderSource.WHATSAPP);
    });

    it('con el cliente sincronizado crea la orden en Concrebill y guarda su id', async () => {
      await ds.getRepository(User).update(fx.client.id, { concrebillSync: true });
      auth.syncClient.mockResolvedValue('CB-CLI-1');
      concrebill.createOrder.mockResolvedValue({ id: 'CB-ORD-9' });
      const { id } = await service.create(dto(), asUser(fx.client));
      expect(concrebill.createOrder).toHaveBeenCalledWith(expect.objectContaining({ clientId: 'CB-CLI-1', code: 'ORD-000001' }));
      expect((await orderOf(id)).concrebillOrderId).toBe('CB-ORD-9');
    });

    it('sin sincronización no llama a Concrebill', async () => {
      await service.create(dto(), asUser(fx.client));
      expect(concrebill.createOrder).not.toHaveBeenCalled();
    });
  });

  describe('acceso y lectura', () => {
    it('un cliente solo ve sus órdenes', async () => {
      const { id } = await service.create(dto(), asUser(fx.client));
      await expect(service.detail(id, asUser(fx.otherClient))).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.detail(id, asUser(fx.client))).resolves.toMatchObject({ id });
    });

    it('un técnico solo ve las órdenes que tiene asignadas; el admin ve todas', async () => {
      const { id } = await service.create(dto());
      await service.update(id, { technicianId: fx.tech.id }, asUser(fx.admin));
      await expect(service.detail(id, asUser(fx.tech))).resolves.toMatchObject({ id });
      await expect(service.detail(id, asUser(fx.otherTech))).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('al cliente se le ocultan las notas internas y las entradas no visibles', async () => {
      const { id } = await service.create(dto(), asUser(fx.client));
      await service.update(id, { internalNotes: 'Solo para el equipo' }, asUser(fx.admin));
      await service.addProgress(id, asUser(fx.admin), 'Nota interna', 'durante' as never, false, [], []);
      const forClient = await service.detail(id, asUser(fx.client));
      const forAdmin = await service.detail(id, asUser(fx.admin));
      expect(forClient).not.toHaveProperty('internalNotes');
      expect(forClient.updates.every((u) => u.visibleToClient)).toBe(true);
      expect(forAdmin.internalNotes).toBe('Solo para el equipo');
      expect(forAdmin.updates.length).toBeGreaterThan(forClient.updates.length);
    });

    it('detail devuelve 404 si la orden no existe', async () => {
      await expect(service.detail(12345, asUser(fx.admin))).rejects.toBeInstanceOf(NotFoundException);
    });

    it('track exige código y correo coincidentes y solo expone entradas visibles', async () => {
      const { code } = await service.create(dto());
      await expect(service.track(code!, 'otro@test.local')).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.track('ORD-999999', 'invitada@test.local')).rejects.toBeInstanceOf(NotFoundException);
      const res = await service.track(` ${code!.toLowerCase()} `, 'INVITADA@test.local');
      expect(res.code).toBe(code);
      expect(res.statusLabel).toBe('Recibida');
    });
  });

  describe('changeStatus', () => {
    let id: number;
    beforeEach(async () => {
      ({ id } = await service.create(dto()));
      await service.update(id, { technicianId: fx.tech.id }, asUser(fx.admin));
    });

    it('el admin puede pasar la orden a cualquier estado y queda en la bitácora', async () => {
      await service.changeStatus(id, { status: OrderStatus.CANCELLED }, asUser(fx.admin));
      expect((await orderOf(id)).status).toBe(OrderStatus.CANCELLED);
      const last = await ds.getRepository(OrderUpdate).findOneOrFail({ where: { order: { id }, status: OrderStatus.CANCELLED } });
      expect(last.message).toBe('La orden fue cancelada.');
    });

    it.each([OrderStatus.QUOTED, OrderStatus.CANCELLED, OrderStatus.RECEIVED])('el técnico no puede marcar %s', async (status) => {
      await expect(service.changeStatus(id, { status }, asUser(fx.tech))).rejects.toBeInstanceOf(ForbiddenException);
      expect((await orderOf(id)).status).toBe(OrderStatus.RECEIVED);
    });

    it.each([OrderStatus.SURVEY, OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED])('el técnico asignado puede marcar %s', async (status) => {
      await service.changeStatus(id, { status }, asUser(fx.tech));
      expect((await orderOf(id)).status).toBe(status);
    });

    it('un técnico no asignado no puede cambiar el estado', async () => {
      await expect(service.changeStatus(id, { status: OrderStatus.SURVEY }, asUser(fx.otherTech))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('usa el mensaje personalizado cuando llega', async () => {
      await service.changeStatus(id, { status: OrderStatus.SURVEY, message: 'Vamos en camino' }, asUser(fx.admin));
      const u = await ds.getRepository(OrderUpdate).findOneOrFail({ where: { order: { id }, status: OrderStatus.SURVEY } });
      expect(u.message).toBe('Vamos en camino');
    });
  });

  describe('update', () => {
    it('rechaza como técnico a un cliente', async () => {
      const { id } = await service.create(dto());
      await expect(service.update(id, { technicianId: fx.client.id }, asUser(fx.admin))).rejects.toBeInstanceOf(BadRequestException);
    });

    it('guarda el monto cotizado como texto decimal y permite desasignar al técnico', async () => {
      const { id } = await service.create(dto());
      await service.update(id, { technicianId: fx.tech.id, quotedAmount: 1500.5 }, asUser(fx.admin));
      let order = await ds.getRepository(Order).findOneOrFail({ where: { id }, relations: { technician: true } });
      expect(order.technician?.id).toBe(fx.tech.id);
      expect(Number(order.quotedAmount)).toBe(1500.5);
      await service.update(id, { technicianId: null }, asUser(fx.admin));
      order = await ds.getRepository(Order).findOneOrFail({ where: { id }, relations: { technician: true } });
      expect(order.technician).toBeNull();
    });
  });

  describe('documentos', () => {
    it('una cotización fija el monto y pasa la orden a Cotizada', async () => {
      const { id } = await service.create(dto());
      await service.addDocument(id, { type: DocumentType.QUOTE, number: 'COT-1', amount: 1000 }, asUser(fx.admin));
      const order = await orderOf(id);
      expect(order.status).toBe(OrderStatus.QUOTED);
      expect(Number(order.quotedAmount)).toBe(1000);
    });

    it('una factura no cambia el estado de la orden', async () => {
      const { id } = await service.create(dto());
      await service.addDocument(id, { type: DocumentType.INVOICE, number: 'B01-1', amount: 1000 }, asUser(fx.admin));
      expect((await orderOf(id)).status).toBe(OrderStatus.RECEIVED);
    });

    it('syncDocuments exige que el cliente tenga activada la sincronización', async () => {
      const { id } = await service.create(dto(), asUser(fx.client));
      await expect(service.syncDocuments(id)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('review', () => {
    it('solo se evalúa una orden completada y una sola vez', async () => {
      const { id } = await service.create(dto(), asUser(fx.client));
      await expect(service.review(id, asUser(fx.client), { rating: 5 })).rejects.toBeInstanceOf(BadRequestException);
      await setStatus(id, OrderStatus.COMPLETED);
      await expect(service.review(id, asUser(fx.otherClient), { rating: 5 })).rejects.toBeInstanceOf(ForbiddenException);
      await service.review(id, asUser(fx.client), { rating: 5 });
      await expect(service.review(id, asUser(fx.client), { rating: 4 })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('pagos y recomputePaymentStatus', () => {
    let id: number;
    const addInvoice = (amount: number, status?: string) =>
      service.addDocument(id, { type: DocumentType.INVOICE, number: `F-${amount}-${status ?? ''}`, amount, status }, asUser(fx.admin));
    const transfer = (amount: number) =>
      service.clientPayment(id, asUser(fx.client), { amount, reference: 'REF-1', bank: 'Banco Test' }, '/uploads/receipts/comprobante.jpg');
    const approve = (paymentId: number) => service.reviewPayment(paymentId, asUser(fx.admin), { status: PaymentRecordStatus.APPROVED });

    beforeEach(async () => {
      ({ id } = await service.create(dto(), asUser(fx.client)));
    });

    it('exige comprobante en la transferencia del cliente', async () => {
      await expect(service.clientPayment(id, asUser(fx.client), { amount: 100 }, null)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('un cliente ajeno no puede pagar la orden', async () => {
      await expect(service.clientPayment(id, asUser(fx.otherClient), { amount: 100 }, '/x.jpg')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('el comprobante deja el pago pendiente y la orden en revisión', async () => {
      const p = await transfer(500);
      expect(p.status).toBe(PaymentRecordStatus.PENDING);
      expect((await orderOf(id)).paymentStatus).toBe(PaymentStatus.REVIEW);
    });

    it('al validar un pago que cubre la factura la orden queda pagada y la factura marcada como pagada', async () => {
      await addInvoice(1000);
      const p = await transfer(1000);
      const res = await approve(p.id);
      expect(res?.status).toBe(PaymentRecordStatus.APPROVED);
      expect((await orderOf(id)).paymentStatus).toBe(PaymentStatus.PAID);
      const inv = await ds.getRepository(BillingDocument).findOneByOrFail({ type: DocumentType.INVOICE });
      expect(inv.status).toBe('pagada');
    });

    it('un abono parcial no marca la orden como pagada; al completar el total sí', async () => {
      await addInvoice(1000);
      await approve((await transfer(400)).id);
      expect((await orderOf(id)).paymentStatus).toBe(PaymentStatus.PENDING);
      await approve((await transfer(600)).id);
      expect((await orderOf(id)).paymentStatus).toBe(PaymentStatus.PAID);
    });

    it('sin facturas toma el monto cotizado como total a pagar', async () => {
      await service.update(id, { quotedAmount: 800 }, asUser(fx.admin));
      await approve((await transfer(800)).id);
      expect((await orderOf(id)).paymentStatus).toBe(PaymentStatus.PAID);
    });

    it('sin factura ni cotización un pago validado no marca la orden como pagada', async () => {
      await approve((await transfer(800)).id);
      expect((await orderOf(id)).paymentStatus).toBe(PaymentStatus.PENDING);
    });

    it('las facturas anuladas no cuentan en el total a pagar', async () => {
      await addInvoice(5000, 'anulada');
      await addInvoice(300);
      await approve((await transfer(300)).id);
      expect((await orderOf(id)).paymentStatus).toBe(PaymentStatus.PAID);
    });

    it('rechazar el único pago devuelve la orden a pendiente y deja la nota', async () => {
      await addInvoice(1000);
      const p = await transfer(1000);
      await service.reviewPayment(p.id, asUser(fx.admin), { status: PaymentRecordStatus.REJECTED, notes: 'Ilegible' });
      expect((await orderOf(id)).paymentStatus).toBe(PaymentStatus.PENDING);
      const stored = await ds.getRepository(Payment).findOneByOrFail({ id: p.id });
      expect(stored.status).toBe(PaymentRecordStatus.REJECTED);
      expect(stored.notes).toBe('Ilegible');
    });

    it('con otro pago aún pendiente la orden sigue en revisión', async () => {
      await addInvoice(1000);
      const first = await transfer(300);
      await transfer(300);
      await approve(first.id);
      expect((await orderOf(id)).paymentStatus).toBe(PaymentStatus.REVIEW);
    });

    it('un pago ya procesado no se puede procesar de nuevo (409)', async () => {
      const p = await transfer(100);
      await approve(p.id);
      await expect(approve(p.id)).rejects.toBeInstanceOf(ConflictException);
    });

    it('un pago inexistente devuelve 404', async () => {
      await expect(approve(404)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('el pago de admin se registra ya validado', async () => {
      await addInvoice(250);
      const res = await service.adminPayment(id, asUser(fx.admin), { method: PaymentMethod.CASH, amount: 250 });
      expect(res?.status).toBe(PaymentRecordStatus.APPROVED);
      expect((await orderOf(id)).paymentStatus).toBe(PaymentStatus.PAID);
    });

    describe('con el cliente sincronizado en Concrebill', () => {
      beforeEach(async () => {
        await ds.getRepository(User).update(fx.client.id, { concrebillSync: true });
        await addInvoice(1000);
      });

      it('registra el pago con clave de idempotencia y guarda el recibo', async () => {
        concrebill.registerPayment.mockResolvedValue({ id: 'CB-PAY-1', receiptNumber: 'REC-1' });
        const p = await transfer(1000);
        await approve(p.id);
        expect(concrebill.registerPayment).toHaveBeenCalledWith(expect.objectContaining({ amount: 1000 }), `pago-${p.id}`);
        expect((await ds.getRepository(Payment).findOneByOrFail({ id: p.id })).concrebillPaymentId).toBe('CB-PAY-1');
        const receipt = await ds.getRepository(BillingDocument).findOneByOrFail({ type: DocumentType.RECEIPT });
        expect(receipt.number).toBe('REC-1');
      });

      it('si Concrebill no confirma, el pago vuelve a pendiente y responde 502', async () => {
        concrebill.registerPayment.mockResolvedValue(null);
        const p = await transfer(1000);
        await expect(approve(p.id)).rejects.toBeInstanceOf(BadGatewayException);
        const stored = await ds.getRepository(Payment).findOneByOrFail({ id: p.id });
        expect(stored.status).toBe(PaymentRecordStatus.PENDING);
        expect((await orderOf(id)).paymentStatus).toBe(PaymentStatus.REVIEW);
      });

      it('tras un fallo se puede reintentar y queda validado', async () => {
        concrebill.registerPayment.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'CB-PAY-2' });
        const p = await transfer(1000);
        await expect(approve(p.id)).rejects.toBeInstanceOf(BadGatewayException);
        await approve(p.id);
        expect((await ds.getRepository(Payment).findOneByOrFail({ id: p.id })).status).toBe(PaymentRecordStatus.APPROVED);
        expect((await orderOf(id)).paymentStatus).toBe(PaymentStatus.PAID);
      });
    });
  });

  it('listForStaff: el técnico solo ve sus órdenes y los filtros aplican', async () => {
    const a = await service.create(dto());
    const b = await service.create(dto({ contactName: 'Zoila Buscada' }));
    await service.update(a.id, { technicianId: fx.tech.id }, asUser(fx.admin));
    await setStatus(b.id, OrderStatus.SURVEY);
    expect((await service.listForStaff(asUser(fx.tech), {})).map((o) => o.id)).toEqual([a.id]);
    expect(await service.listForStaff(asUser(fx.admin), {})).toHaveLength(2);
    expect((await service.listForStaff(asUser(fx.admin), { status: OrderStatus.SURVEY })).map((o) => o.id)).toEqual([b.id]);
    expect((await service.listForStaff(asUser(fx.admin), { q: 'zoila' })).map((o) => o.id)).toEqual([b.id]);
    expect(Role.TECHNICIAN).toBe(fx.tech.role);
  });
});
