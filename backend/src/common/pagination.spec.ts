import { parsePage, toPaged } from './pagination';

describe('pagination', () => {
  it('usa página 1 y 20 por defecto', () => {
    expect(parsePage()).toEqual({ page: 1, limit: 20, skip: 0 });
    expect(parsePage({})).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('calcula el salto y acepta strings de la query', () => {
    expect(parsePage({ page: '3', limit: '10' })).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it('limita el tamaño a 100 y descarta valores inválidos', () => {
    expect(parsePage({ limit: '5000' }).limit).toBe(100);
    expect(parsePage({ page: '0', limit: '-1' })).toEqual({ page: 1, limit: 20, skip: 0 });
    expect(parsePage({ page: 'x', limit: '2.9' })).toEqual({ page: 1, limit: 2, skip: 0 });
  });

  it('toPaged calcula las páginas y nunca baja de 1', () => {
    expect(toPaged([1, 2], 5, 1, 2)).toEqual({ items: [1, 2], total: 5, page: 1, limit: 2, pages: 3 });
    expect(toPaged([], 0, 1, 20).pages).toBe(1);
  });
});
