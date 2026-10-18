import { existsSync, mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { createTestDataSource, seedFixtures } from '../../test/helpers/db';
import { BillingDocument, Order, OrderPhoto, Payment, Project, ServiceItem, SiteSetting, Testimonial } from '../entities';
import { findOrphanUploads, removeUploadedFile, uploadPathFromUrl } from './upload-files';

describe('upload-files', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'fisc-up-'));
    for (const f of ['orders', 'documents', 'receipts', 'content']) mkdirSync(join(dir, f));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const put = (rel: string, ageHours = 100) => {
    const p = join(dir, rel);
    writeFileSync(p, 'datos');
    const t = (Date.now() - ageHours * 3600_000) / 1000;
    utimesSync(p, t, t);
    return p;
  };

  describe('uploadPathFromUrl', () => {
    it('resuelve rutas dentro de uploads', () => {
      expect(uploadPathFromUrl('/uploads/orders/a.jpg', dir)).toBe(join(dir, 'orders', 'a.jpg'));
    });
    it.each([
      null, undefined, '', 'https://cdn.externo/a.jpg', '/brand/a.webp', '/uploads/', '/uploads/../secreto.txt',
      '/uploads/%2e%2e/secreto.txt', '/uploads/orders/../../x',
    ])('rechaza %s', (url) => expect(uploadPathFromUrl(url, dir)).toBeNull());
  });

  describe('removeUploadedFile', () => {
    it('borra el archivo y devuelve true; si ya no existe devuelve false sin lanzar', async () => {
      const p = put('orders/a.jpg');
      await expect(removeUploadedFile('/uploads/orders/a.jpg', dir)).resolves.toBe(true);
      expect(existsSync(p)).toBe(false);
      await expect(removeUploadedFile('/uploads/orders/a.jpg', dir)).resolves.toBe(false);
    });

    it('no toca URLs externas ni rutas fuera de uploads', async () => {
      const outside = join(dir, '..', 'fuera-de-uploads.txt');
      writeFileSync(outside, 'x');
      await expect(removeUploadedFile('/uploads/../fuera-de-uploads.txt', dir)).resolves.toBe(false);
      await expect(removeUploadedFile('https://x.test/a.jpg', dir)).resolves.toBe(false);
      expect(existsSync(outside)).toBe(true);
      rmSync(outside);
    });
  });

  describe('findOrphanUploads', () => {
    let ds: DataSource;
    beforeEach(async () => {
      ds = await createTestDataSource();
    });
    afterEach(() => ds.destroy());

    it('lista solo lo que ninguna fila referencia y respeta la edad mínima', async () => {
      const fx = await seedFixtures(ds);
      const orders = ds.getRepository(Order);
      const order = await orders.save(
        orders.create({ contactName: 'X', contactEmail: 'x@t.l', contactPhone: '8090000000', address: 'Calle 1', propertyType: 'residencial' }),
      );
      await ds.getRepository(OrderPhoto).save({ order, url: '/uploads/orders/foto-usada.jpg' });
      await ds.getRepository(BillingDocument).save({ order, type: 'factura' as never, number: 'F-1', fileUrl: '/uploads/documents/doc-usado.pdf' });
      await ds.getRepository(Payment).save({ order, method: 'transferencia' as never, amount: '10', receiptUrl: '/uploads/receipts/recibo-usado.jpg' });
      await ds.getRepository(ServiceItem).update(fx.service.id, { imageUrl: '/uploads/content/servicio-usado.png' });
      await ds.getRepository(Testimonial).save({ name: 'T', text: 'ok', avatarUrl: '/uploads/content/avatar-usado.png' } as never);
      await ds.getRepository(Project).save({ title: 'P', beforeUrl: '/uploads/content/antes-usado.png', afterUrl: '/uploads/content/despues-usado.png' } as never);
      await ds.getRepository(SiteSetting).save({
        key: 'brand',
        value: { logoUrl: '/uploads/content/logo-usado.png', nested: { x: ['/uploads/content/otro-usado.png'] } },
      });
      [
        'orders/foto-usada.jpg', 'documents/doc-usado.pdf', 'receipts/recibo-usado.jpg', 'content/servicio-usado.png', 'content/avatar-usado.png',
        'content/antes-usado.png', 'content/despues-usado.png', 'content/logo-usado.png', 'content/otro-usado.png',
      ].forEach((f) => put(f));
      put('orders/foto-huerfana.jpg');
      put('documents/doc-huerfano.pdf');
      put('content/reciente-sin-guardar.png', 1);

      const orphans = await findOrphanUploads(ds, { dir });
      expect(orphans.map((o) => o.url).sort()).toEqual(['/uploads/documents/doc-huerfano.pdf', '/uploads/orders/foto-huerfana.jpg']);
      expect(orphans.every((o) => o.bytes === 5)).toBe(true);

      const all = await findOrphanUploads(ds, { dir, minAgeHours: 0 });
      expect(all.map((o) => o.url)).toContain('/uploads/content/reciente-sin-guardar.png');
      expect(all).toHaveLength(3);
    });

    it('si uploads no existe devuelve una lista vacía', async () => {
      await expect(findOrphanUploads(ds, { dir: join(dir, 'no-existe') })).resolves.toEqual([]);
    });
  });
});
