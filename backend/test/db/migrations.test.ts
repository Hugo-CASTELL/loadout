import { test } from 'node:test'
import * as assert from 'node:assert'
import fs from 'node:fs/promises'
import path from 'node:path'
import { DELETE_EXPIRED_INVENTORIES_SQL } from '../../src/db/inventories'

const migrationsDir = path.join(__dirname, '../../db/migrations')

test('inventories table is created for database-backed cache', async () => {
  const sql = await fs.readFile(path.join(migrationsDir, '002_inventories.sql'), 'utf8')
  assert.match(sql, /CREATE TABLE inventories/i)
  assert.match(sql, /steam_id TEXT PRIMARY KEY/i)
  assert.match(sql, /inventory JSONB NOT NULL/i)
  assert.match(sql, /expires_at TIMESTAMP NOT NULL/i)
})

test('hourly database cron deletes expired inventories', async () => {
  const sql = await fs.readFile(
    path.join(migrationsDir, '003_inventory_cleanup_cron.sql'),
    'utf8',
  )
  assert.match(sql, /^-- OPTIONAL/)
  assert.match(sql, /CREATE EXTENSION IF NOT EXISTS pg_cron/i)
  assert.match(sql, /cron\.schedule/)
  assert.match(sql, /0 \* \* \* \*/)
  assert.ok(sql.includes(DELETE_EXPIRED_INVENTORIES_SQL))
})
