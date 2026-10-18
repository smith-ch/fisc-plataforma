import { DataSource } from 'typeorm';
import { createTestDataSource } from '../../test/helpers/db';
import { BillingDocument, Lead, Order, OrderItem, OrderPhoto, OrderUpdate, Payment } from '.';

/** Índices pedidos en #14 para los listados del panel y las FK (Postgres no indexa las FK solo). */
describe('índices de las entidades', () => {
  let ds: DataSource;
  beforeAll(async () => {
    ds = await createTestDataSource();
  });
  afterAll(() => ds.destroy());

  const indexed = (entity: Parameters<DataSource['getMetadata']>[0]) =>
    ds
      .getMetadata(entity)
      .indices.flatMap((i) => i.columns.map((c) => c.propertyName))
      .sort();

  it('orders: estado, correo, fecha, cliente y técnico', () => {
    expect(indexed(Order)).toEqual(['client', 'contactEmail', 'createdAt', 'status', 'technician']);
  });
  it('payments: estado, fecha y orden', () => {
    expect(indexed(Payment)).toEqual(['createdAt', 'order', 'status']);
  });
  it.each([OrderUpdate, OrderPhoto, BillingDocument, OrderItem])('%p indexa la FK a la orden', (e) => {
    expect(indexed(e)).toEqual(['order']);
  });
  it('leads: atendido y fecha', () => {
    expect(indexed(Lead)).toEqual(['createdAt', 'handled']);
  });
  it('los índices existen en la base', async () => {
    const rows: { name: string; tbl_name: string }[] = await ds.query(`select name, tbl_name from sqlite_master where type = 'index'`);
    expect(rows.filter((r) => r.tbl_name === 'orders').length).toBeGreaterThanOrEqual(5);
  });
});
