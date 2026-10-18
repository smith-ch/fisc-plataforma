import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { createTestDataSource, seedFixtures } from '../../test/helpers/db';
import { DocumentType } from '../common/enums';
import { BillingDocument, Order, OrderPhoto, OrderUpdate, Payment, Review, ServiceItem, User } from '../entities';
import { UPLOAD_DIR } from '../uploads/upload.options';
import { OrdersService } from './orders.service';

// La carpeta temporal se crea dentro del mock porque jest.mock se ejecuta antes que el resto del módulo.
jest.mock('../uploads/upload.options', () => ({
  ...jest.requireActual('../uploads/upload.options'),
  UPLOAD_DIR: jest.requireActual('fs').mkdtempSync(jest.requireActual('path').join(jest.requireActual('os').tmpdir(), 'fisc-ord-')),
}));
const mockDir = UPLOAD_DIR;

describe('OrdersService · archivos subidos al borrar (#20)', () => {
  let ds: DataSource;
  let service: OrdersService;
  let orderId: number;

  beforeEach(async () => {
    ds = await createTestDataSource();
    await seedFixtures(ds);
    service = new OrdersService(
      ds.getRepository(Order),
      ds.getRepository(OrderUpdate),
      ds.getRepository(OrderPhoto),
      ds.getRepository(ServiceItem),
      ds.getRepository(Review),
      ds.getRepository(BillingDocument),
      ds.getRepository(Payment),
      ds.getRepository(User),
      {} as never,
      {} as never,
      ds,
    );
    mkdirSync(join(mockDir, 'orders'), { recursive: true });
    mkdirSync(join(mockDir, 'documents'), { recursive: true });
    const orders = ds.getRepository(Order);
    orderId = (
      await orders.save(
        orders.create({
          contactName: 'X',
          contactEmail: 'x@t.l',
          contactPhone: '8090000000',
          address: 'Calle 1',
          propertyType: 'residencial',
        }),
      )
    ).id;
  });
  afterEach(() => ds.destroy());
  afterAll(() => rmSync(mockDir, { recursive: true, force: true }));

  it('deletePhoto borra la fila y el archivo', async () => {
    const file = join(mockDir, 'orders', 'f.jpg');
    writeFileSync(file, 'x');
    const photo = await ds.getRepository(OrderPhoto).save({ order: { id: orderId }, url: '/uploads/orders/f.jpg' });
    await expect(service.deletePhoto(photo.id)).resolves.toEqual({ ok: true });
    expect(await ds.getRepository(OrderPhoto).count()).toBe(0);
    expect(existsSync(file)).toBe(false);
  });

  it('deletePhoto no falla si el archivo ya no existe o la fila no existe', async () => {
    const photo = await ds.getRepository(OrderPhoto).save({ order: { id: orderId }, url: '/uploads/orders/ya-no-esta.jpg' });
    await expect(service.deletePhoto(photo.id)).resolves.toEqual({ ok: true });
    await expect(service.deletePhoto(9999)).resolves.toEqual({ ok: true });
  });

  it('deleteDocument borra la fila y el archivo subido, pero no toca enlaces externos', async () => {
    const file = join(mockDir, 'documents', 'd.pdf');
    writeFileSync(file, 'x');
    const docs = ds.getRepository(BillingDocument);
    const doc = await docs.save({ order: { id: orderId }, type: DocumentType.INVOICE, number: 'F-1', fileUrl: '/uploads/documents/d.pdf' });
    await service.deleteDocument(doc.id);
    expect(existsSync(file)).toBe(false);
    const ext = await docs.save({
      order: { id: orderId },
      type: DocumentType.QUOTE,
      number: 'C-1',
      fileUrl: 'https://concrebill.test/c.pdf',
    });
    await expect(service.deleteDocument(ext.id)).resolves.toEqual({ ok: true });
    expect(await docs.count()).toBe(0);
  });
});
