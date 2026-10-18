import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Pillar, ServiceItem, User, ENTITIES } from '../../src/entities';
import { Role } from '../../src/common/enums';

/** Base SQLite en memoria con el esquema completo: cada prueba parte de cero y no toca datos reales. */
export async function createTestDataSource(): Promise<DataSource> {
  const ds = new DataSource({ type: 'better-sqlite3', database: ':memory:', entities: ENTITIES, synchronize: true });
  return ds.initialize();
}

export interface Fixtures {
  admin: User;
  tech: User;
  otherTech: User;
  client: User;
  otherClient: User;
  service: ServiceItem;
  service2: ServiceItem;
}

const hash = 'x-no-es-un-hash-real';

/** Usuarios por rol y dos servicios de catálogo (datos ficticios). */
export async function seedFixtures(ds: DataSource): Promise<Fixtures> {
  const users = ds.getRepository(User);
  const mk = (name: string, email: string, role: Role) => users.save(users.create({ name, email, role, passwordHash: hash }));
  const pillar = await ds.getRepository(Pillar).save({ code: 'A', title: 'Adecuación', slug: 'adecuacion' });
  const services = ds.getRepository(ServiceItem);
  const svc = (name: string, slug: string) => services.save(services.create({ name, slug, shortDescription: name, pillar }));
  return {
    admin: await mk('Admin', 'admin@test.local', Role.ADMIN),
    tech: await mk('Técnico Uno', 'tech1@test.local', Role.TECHNICIAN),
    otherTech: await mk('Técnico Dos', 'tech2@test.local', Role.TECHNICIAN),
    client: await mk('Cliente Uno', 'cliente1@test.local', Role.CLIENT),
    otherClient: await mk('Cliente Dos', 'cliente2@test.local', Role.CLIENT),
    service: await svc('Pintura interior', 'pintura-interior'),
    service2: await svc('Impermeabilización', 'impermeabilizacion'),
  };
}
