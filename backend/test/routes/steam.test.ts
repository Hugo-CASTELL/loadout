import { test } from 'node:test'
import * as assert from 'node:assert'
import Fastify from 'fastify'
import steam from '../../src/routes/steam'
import cache from '../../src/plugins/cache'

const STEAM_ID = '76561198000000000'
const AUTH_FAILURE_STEAM_ID = '76561198000000001'
const RATE_LIMIT_STEAM_ID = '76561198000000002'
const EXPECTED_INVENTORY_PATH = `/v2/steam/users/${STEAM_ID}/inventory/730/2`

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

async function buildInventoryApp(user?: { steamId: string }) {
  const app = Fastify()
  if (user) {
    app.addHook('onRequest', async (request) => {
      (request as unknown as { user: { steamId: string } }).user = user
    })
  }
  await app.register(cache)
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

test('inventory fetches CS2 items from SteamApis v2', async (t) => {
  process.env.STEAMAPIS_API_KEY = 'test-steamapis-key'
  const originalFetch = globalThis.fetch
  const fetchCalls: Array<{ url: string; apiKey?: string }> = []

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

  const app = await buildInventoryApp({ steamId: STEAM_ID })
  t.after(() => app.close())

  const res = await app.inject({ url: '/inventory' })
  assert.equal(res.statusCode, 200)
  assert.deepStrictEqual(JSON.parse(res.payload), {
    items: [
      {
        name: 'Glock-18 | Ocean Topo (Field-Tested)',
        icon_url: 'https://community.cloudflare.steamstatic.com/economy/image/icon-hash',
        show_in_game_uri: 'steam://run/730//+csgo_econ_action_preview%2053181949965',
      },
    ],
  })
  assert.equal(fetchCalls.length, 1)
  const requested = new URL(fetchCalls[0].url)
  assert.equal(requested.origin, 'https://api.steamapis.com')
  assert.equal(requested.pathname, EXPECTED_INVENTORY_PATH)
  assert.equal(requested.searchParams.get('api_key'), 'test-steamapis-key')
  assert.equal(requested.searchParams.get('key'), 'test-steamapis-key')
  assert.equal(fetchCalls[0].apiKey, 'test-steamapis-key')
})

test('inventory maps SteamApis auth failures to 502', async (t) => {
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
  assert.equal(res.statusCode, 502)
  assert.deepStrictEqual(JSON.parse(res.payload), {
    error: 'SteamApis rejected the request (invalid or missing API key).',
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
    error: 'SteamApis rate-limited the request. Wait a minute and try again.',
  })
})
