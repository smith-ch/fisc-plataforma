import { ValidationPipe } from '@nestjs/common';
import { DocumentType, OrderStatus } from '../common/enums';
import { DocumentDto, StaffOrdersQueryDto, UpdateDocumentDto } from './orders.dto';

const pipe = new ValidationPipe({ whitelist: true, transform: true });
const run = <T>(metatype: new () => T, value: unknown) => pipe.transform(value, { type: 'body', metatype });

describe('UpdateDocumentDto (PATCH /admin/documents/:id)', () => {
  it('valida los campos aunque todos sean opcionales', async () => {
    await expect(run(UpdateDocumentDto, { amount: 'no-numero' })).rejects.toThrow();
    await expect(run(UpdateDocumentDto, { type: 'cualquiera' })).rejects.toThrow();
    await expect(run(UpdateDocumentDto, { amount: -5 })).rejects.toThrow();
  });

  it('acepta cambios parciales válidos', async () => {
    await expect(run(UpdateDocumentDto, { status: 'pagada', amount: '150.5' })).resolves.toMatchObject({ status: 'pagada', amount: 150.5 });
    await expect(run(UpdateDocumentDto, {})).resolves.toEqual({});
  });

  it('filtra los campos que no son del DTO (no hay asignación masiva sobre la entidad)', async () => {
    const out = await run(UpdateDocumentDto, { number: 'F-1', id: 99, createdAt: '2000-01-01', origin: 'concrebill', order: { id: 7 } });
    expect(out).toEqual({ number: 'F-1' });
  });

  it('DocumentDto sigue exigiendo tipo, número y monto', async () => {
    await expect(run(DocumentDto, { number: 'F-1' })).rejects.toThrow();
    await expect(run(DocumentDto, { type: DocumentType.INVOICE, number: 'F-1', amount: 10 })).resolves.toBeDefined();
  });
});

describe('StaffOrdersQueryDto (GET /staff/orders)', () => {
  const q = (value: unknown) => pipe.transform(value, { type: 'query', metatype: StaffOrdersQueryDto });

  it('convierte los números de la query y conserva filtros válidos', async () => {
    await expect(q({ status: OrderStatus.SURVEY, technicianId: '3', page: '2', limit: '10', q: 'ana' })).resolves.toMatchObject({
      status: OrderStatus.SURVEY,
      technicianId: 3,
      page: 2,
      limit: 10,
      q: 'ana',
    });
  });

  it.each([{ status: 'inventado' }, { source: 'otra' }, { technicianId: 'abc' }, { page: '0' }, { limit: '-1' }, { q: 'x'.repeat(101) }])(
    'rechaza %p',
    async (bad) => {
      await expect(q(bad)).rejects.toThrow();
    },
  );

  it('descarta parámetros desconocidos', async () => {
    expect(await q({ status: OrderStatus.RECEIVED, admin: 'true' })).toEqual({ status: OrderStatus.RECEIVED });
  });
});
