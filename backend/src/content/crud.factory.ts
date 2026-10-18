import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, Type } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { Role } from '../common/enums';
import { parsePage, toPaged } from '../common/pagination';
import { Roles } from '../common/roles.decorator';

const PROTECTED = ['id', 'createdAt', 'updatedAt'];

function clean(body: Record<string, unknown>, allowed: string[]) {
  return Object.fromEntries(Object.entries(body ?? {}).filter(([k]) => allowed.includes(k) && !PROTECTED.includes(k)));
}

/**
 * Genera un controlador CRUD de administración para entidades de contenido
 * simples (testimonios, preguntas frecuentes, portafolio...).
 */
export function createCrudController<T extends ObjectLiteral>(path: string, entity: Type<T>, fields: string[]) {
  @Controller(`admin/${path}`)
  @Roles(Role.ADMIN)
  class CrudController {
    constructor(@InjectRepository(entity) readonly repo: Repository<T>) {}

    @Get()
    async list(@Query('page') page?: string, @Query('limit') limit?: string) {
      const order = { sortOrder: 'ASC', id: 'DESC' } as never;
      // Sin page/limit devuelve todo (listas cortas del panel); con ellos, paginado.
      if (page === undefined && limit === undefined) return this.repo.find({ order });
      const p = parsePage({ page, limit });
      const [items, total] = await this.repo.findAndCount({ order, skip: p.skip, take: p.limit });
      return toPaged(items, total, p.page, p.limit);
    }

    @Post()
    create(@Body() body: Record<string, unknown>) {
      return this.repo.save(this.repo.create(clean(body, fields) as T));
    }

    @Patch(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
      const item = await this.repo.findOneBy({ id } as never);
      if (!item) throw new NotFoundException();
      Object.assign(item, clean(body, fields));
      return this.repo.save(item);
    }

    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number) {
      await this.repo.delete(id);
      return { ok: true };
    }
  }
  return CrudController;
}
