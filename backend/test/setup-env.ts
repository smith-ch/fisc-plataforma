import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Se ejecuta antes de importar la app: base en memoria, archivos en una carpeta temporal y credenciales de prueba.
process.env.DB_SQLITE_PATH = ':memory:';
process.env.UPLOAD_DIR = mkdtempSync(join(tmpdir(), 'fisc-e2e-'));
process.env.JWT_SECRET = 'secreto-e2e';
process.env.ADMIN_EMAIL = 'admin-e2e@test.local';
process.env.ADMIN_PASSWORD = 'Admin-e2e-123';
process.env.CONCREBILL_ENABLED = 'false';
delete process.env.REVALIDATE_SECRET;
delete process.env.DB_TYPE;
delete process.env.DATABASE_URL;
