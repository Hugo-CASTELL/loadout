import { test } from 'node:test'
import * as assert from 'node:assert'
import Fastify from 'fastify'
import steam from '../../src/routes/steam'
import {
  DELETE_EXPIRED_INVENTORIES_SQL,
  findCachedInventory,
  INVENTORY_CACHE_TTL_SECONDS,
  saveCachedInventory,
  type SqlClient,
} from '../../src/db/inventories'

const STEAM_ID = '76561198000000000'
const AUTH_FAILURE_STEAM_ID = '76561198000000001'
const RATE_LIMIT_STEAM_ID = '76561198000000002'
const EXPECTED_INVENTORY_PATH = `/v2/steam/users/${STEAM_ID}/inventory/730/2`

const mappedInventory = {
  items: [
    {
      name: 'Glock-18 | Ocean Topo (Field-Tested)',
      icon_url: 'https://community.cloudflare.steamstatic.com/economy/image/icon-hash',
      show_in_game_uri: 'steam://run/730//+csgo_econ_action_preview%2053181949965',
    },
  ],
}

function steamApisEnvelope() {
  return {
    success: true,
    result: {
      assets: [
        {
          appid: 730,
          contextid: '2',
          assetid: '53181949965',
          classid: '7993037971',
          instanceid: '8740116227',
          amount: '1',
        },
      ],
      descriptions: [
        {
          appid: 730,
          classid: '7993037971',
          instanceid: '8740116227',
          name: 'Glock-18 | Ocean Topo',
          market_name: 'Glock-18 | Ocean Topo (Field-Tested)',
          icon_url: 'icon-hash',
          market_actions: [
            {
              link: 'steam://run/730//+csgo_econ_action_preview%20%assetid%',
              name: 'Inspect in Game...',
            },
          ],
        },
      ],
    },
  }
}

type QueryCall = { sql: string; params?: unknown[] }

function createPgMock(handler?: SqlClient['query']): { pg: SqlClient; calls: QueryCall[] } {
  const calls: QueryCall[] = []
  return {
    calls,
    pg: {
      query: async (sql: string, params?: unknown[]) => {
        calls.push({ sql, params })
        if (handler) {
          return handler(sql, params)
        }
        return { rows: [], rowCount: 0 }
      },
    },
  }
}

async function buildInventoryApp(user?: { steamId: string }, pg: SqlClient = createPgMock().pg) {
  const app = Fastify()
  if (user) {
    app.addHook('onRequest', async (request) => {
      (request as unknown as { user: { steamId: string } }).user = user
    })
  }
  app.decorate('pg', pg as never)
  await app.register(steam)
  await app.ready()
  return app
}

test('inventory requires authentication', async () => {
  const app = await buildInventoryApp()
  const res = await app.inject({ url: '/inventory' })
  assert.equal(res.statusCode, 401)
  assert.deepStrictEqual(JSON.parse(res.payload), { error: 'Unauthorized' })
  await app.close()
})

test('inventory fetches CS2 items from SteamApis v2 when the database has no cache', async (t) => {
  process.env.STEAMAPIS_API_KEY = 'test-steamapis-key'
  const originalFetch = globalThis.fetch
  const fetchCalls: Array<{ url: string; apiKey?: string }> = []
  const { pg, calls } = createPgMock()

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const headers = new Headers(init?.headers)
    fetchCalls.push({
      url: String(input),
      apiKey: headers.get('x-api-key') ?? undefined,
    })
    return new Response(JSON.stringify(steamApisEnvelope()), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }) as typeof fetch

  const app = await buildInventoryApp({ steamId: STEAM_ID }, pg)
  t.after(() => app.close())

  const res = await app.inject({ url: '/inventory' })
  assert.equal(res.statusCode, 200)
  assert.deepStrictEqual(JSON.parse(res.payload), mappedInventory)
  assert.equal(fetchCalls.length, 1)
  const requested = new URL(fetchCalls[0].url)
  assert.equal(requested.origin, 'https://api.steamapis.com')
  assert.equal(requested.pathname, EXPECTED_INVENTORY_PATH)
  assert.equal(requested.searchParams.get('api_key'), 'test-steamapis-key')
  assert.equal(requested.searchParams.get('key'), 'test-steamapis-key')
  assert.equal(fetchCalls[0].apiKey, 'test-steamapis-key')

  assert.equal(calls.length, 2)
  assert.match(calls[0].sql, /SELECT inventory/i)
  assert.deepStrictEqual(calls[0].params, [STEAM_ID])
  assert.match(calls[1].sql, /INSERT INTO inventories/i)
  assert.equal(calls[1].params?.[0], STEAM_ID)
  assert.equal(calls[1].params?.[1], JSON.stringify(mappedInventory))
  assert.equal(calls[1].params?.[2], INVENTORY_CACHE_TTL_SECONDS)
})

test('inventory returns a database-cached inventory without calling SteamApis', async (t) => {
  process.env.STEAMAPIS_API_KEY = 'test-steamapis-key'
  const originalFetch = globalThis.fetch
  let fetchCalls = 0

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = (async () => {
    fetchCalls += 1
    return new Response('should not be called', { status: 500 })
  }) as typeof fetch

  const { pg, calls } = createPgMock(async () => ({
    rows: [{ inventory: mappedInventory }],
    rowCount: 1,
  }))

  const app = await buildInventoryApp({ steamId: STEAM_ID }, pg)
  t.after(() => app.close())

  const res = await app.inject({ url: '/inventory' })
  assert.equal(res.statusCode, 200)
  assert.deepStrictEqual(JSON.parse(res.payload), mappedInventory)
  assert.equal(fetchCalls, 0)
  assert.equal(calls.length, 1)
  assert.match(calls[0].sql, /SELECT inventory/i)
  assert.match(calls[0].sql, /expires_at > NOW\(\)/i)
  assert.deepStrictEqual(calls[0].params, [STEAM_ID])
})

test('inventory maps SteamApis auth failures through to the client', async (t) => {
  process.env.STEAMAPIS_API_KEY = 'bad-key'
  const originalFetch = globalThis.fetch

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = (async () => {
    return new Response(
      JSON.stringify({
        success: false,
        error: { name: 'ForbiddenError', message: 'INVALID_API_KEY' },
      }),
      { status: 403, headers: { 'content-type': 'application/json' } },
    )
  }) as typeof fetch

  const app = await buildInventoryApp({ steamId: AUTH_FAILURE_STEAM_ID })
  t.after(() => app.close())

  const res = await app.inject({ url: '/inventory' })
  assert.equal(res.statusCode, 403)
  assert.deepStrictEqual(JSON.parse(res.payload), {
    error: 'SteamApis request failed: Steam blocked the request (private inventory, or temporary Steam block).',
  })
})

test('inventory maps SteamApis rate limits to 429', async (t) => {
  process.env.STEAMAPIS_API_KEY = 'test-steamapis-key'
  const originalFetch = globalThis.fetch

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = (async () => {
    return new Response(JSON.stringify({ success: false }), {
      status: 429,
      headers: { 'content-type': 'application/json' },
    })
  }) as typeof fetch

  const app = await buildInventoryApp({ steamId: RATE_LIMIT_STEAM_ID })
  t.after(() => app.close())

  const res = await app.inject({ url: '/inventory' })
  assert.equal(res.statusCode, 429)
  assert.deepStrictEqual(JSON.parse(res.payload), {
    error: 'SteamApis request failed: SteamApis rate-limited the request. Wait a minute and try again.',
  })
})

test('inventory still fetches SteamApis when the cache lookup fails', async (t) => {
  process.env.STEAMAPIS_API_KEY = 'test-steamapis-key'
  const originalFetch = globalThis.fetch

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = (async () => {
    return new Response(JSON.stringify(steamApisEnvelope()), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }) as typeof fetch

  const { pg } = createPgMock(async (sql) => {
    if (/SELECT inventory/i.test(sql)) {
      throw new Error('connection refused')
    }
    return { rows: [], rowCount: 0 }
  })

  const app = await buildInventoryApp({ steamId: STEAM_ID }, pg)
  t.after(() => app.close())

  const res = await app.inject({ url: '/inventory' })
  assert.equal(res.statusCode, 200)
  assert.deepStrictEqual(JSON.parse(res.payload), mappedInventory)
})

test('inventory still returns SteamApis data when persisting the cache fails', async (t) => {
  process.env.STEAMAPIS_API_KEY = 'test-steamapis-key'
  const originalFetch = globalThis.fetch

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = (async () => {
    return new Response(JSON.stringify(steamApisEnvelope()), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }) as typeof fetch

  const { pg } = createPgMock(async (sql) => {
    if (/INSERT INTO inventories/i.test(sql)) {
      throw new Error('write failed')
    }
    return { rows: [], rowCount: 0 }
  })

  const app = await buildInventoryApp({ steamId: STEAM_ID }, pg)
  t.after(() => app.close())

  const res = await app.inject({ url: '/inventory' })
  assert.equal(res.statusCode, 200)
  assert.deepStrictEqual(JSON.parse(res.payload), mappedInventory)
})

test('inventory maps unexpected fetch errors to 502', async (t) => {
  process.env.STEAMAPIS_API_KEY = 'test-steamapis-key'
  const originalFetch = globalThis.fetch

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = (async () => {
    throw new Error('network down')
  }) as typeof fetch

  const app = await buildInventoryApp({ steamId: STEAM_ID })
  t.after(() => app.close())

  const res = await app.inject({ url: '/inventory' })
  assert.equal(res.statusCode, 502)
  assert.deepStrictEqual(JSON.parse(res.payload), {
    error: 'Unexpected error while fetching Steam inventory',
  })
})

test('findCachedInventory returns null when no unexpired row exists', async () => {
  const { pg, calls } = createPgMock(async () => ({ rows: [], rowCount: 0 }))
  const cached = await findCachedInventory(pg, STEAM_ID)
  assert.equal(cached, null)
  assert.match(calls[0].sql, /expires_at > NOW\(\)/i)
})

test('saveCachedInventory upserts the mapped inventory with a TTL', async () => {
  const { pg, calls } = createPgMock()
  await saveCachedInventory(pg, STEAM_ID, mappedInventory)
  assert.match(calls[0].sql, /INSERT INTO inventories/i)
  assert.match(calls[0].sql, /ON CONFLICT \(steam_id\)/i)
  assert.deepStrictEqual(calls[0].params, [
    STEAM_ID,
    JSON.stringify(mappedInventory),
    INVENTORY_CACHE_TTL_SECONDS,
  ])
})

test('expired inventory cleanup is a timestamped delete', async () => {
  assert.equal(
    DELETE_EXPIRED_INVENTORIES_SQL,
    'DELETE FROM inventories WHERE expires_at < NOW()',
  )
})
