import fs from 'node:fs/promises';
import path from 'node:path';

type MigrationLogger = {
  info: (msg: string) => void;
  warn: (obj: unknown, msg?: string) => void;
};

function isOptionalMigration(sql: string): boolean {
  return sql.trimStart().startsWith('-- OPTIONAL');
}

export async function runMigrations(pg: any, log?: MigrationLogger) {
  const dir = path.join(__dirname, '../../db/migrations');

  const sql = await fs.readFile(path.join(dir, '000_migration_table.sql'), 'utf8');
  await pg.query(sql);

  const files = (await fs.readdir(dir))
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => Number.parseInt(a.substring(0, 3)) - Number.parseInt(b.substring(0, 3)));

  for (const file of files) {
    const existing = await pg.query(
      'SELECT 1 FROM migrations WHERE name = $1',
      [file]
    );

    if (existing.rowCount) {
      continue;
    }

    const sql = await fs.readFile(
      path.join(dir, file),
      'utf8'
    );
    const optional = isOptionalMigration(sql);

    await pg.query('BEGIN');

    try {
      await pg.query(sql);

      await pg.query(
        'INSERT INTO migrations(name) VALUES ($1)',
        [file]
      );

      await pg.query('COMMIT');
    } catch (err) {
      await pg.query('ROLLBACK');
      if (optional) {
        log?.warn(err, `optional migration ${file} skipped`);
        continue;
      }
      throw err;
    }
  }
}
