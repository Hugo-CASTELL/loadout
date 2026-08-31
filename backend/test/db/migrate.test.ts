import { test } from 'node:test'
import * as assert from 'node:assert'
import { runMigrations } from '../../src/db/migrate'

test('optional pg_cron migration is skipped when the extension is unavailable', async () => {
  const warnings: string[] = []
  const applied: string[] = []

  const pg = {
    query: async (sql: string, params?: unknown[]) => {
      if (sql.includes('SELECT 1 FROM migrations')) {
        const name = String(params?.[0] ?? '')
        return {
          rows: [],
          rowCount: name === '003_inventory_cleanup_cron.sql' ? 0 : 1,
        }
      }

      if (sql.trimStart().startsWith('-- OPTIONAL') || sql.includes('pg_cron')) {
        throw new Error('extension "pg_cron" is not available')
      }

      if (sql.includes('INSERT INTO migrations')) {
        applied.push(String(params?.[0] ?? ''))
      }

      return { rows: [], rowCount: 0 }
    },
  }

  await runMigrations(pg, {
    info: () => undefined,
    warn: (_obj: unknown, msg?: string) => {
      if (msg) warnings.push(msg)
    },
  })

  assert.ok(warnings.some((msg) => msg.includes('003_inventory_cleanup_cron.sql')))
  assert.ok(!applied.includes('003_inventory_cleanup_cron.sql'))
})
