import { test } from 'node:test'
import * as assert from 'node:assert'
import { fetchSteamApis, isSteamApisHttpError } from '../../src/utils/steamApis'

type FetchHandler = typeof fetch

async function withMockedFetch(handler: FetchHandler, run: () => Promise<void>) {
  const originalFetch = globalThis.fetch
  globalThis.fetch = handler
  try {
    await run()
  } finally {
    globalThis.fetch = originalFetch
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

async function assertSteamApisFailure(
  statusCode: number,
  message: string,
) {
  await assert.rejects(
    () => fetchSteamApis('/v2/steam/users/1/inventory/730/2'),
    (error: unknown) => {
      assert.equal(isSteamApisHttpError(error), true)
      if (!isSteamApisHttpError(error)) return false
      assert.equal(error.statusCode, statusCode)
      assert.equal(error.message, message)
      return true
    },
  )
}

test('fetchSteamApis unwraps a successful v2 envelope', async () => {
  process.env.STEAMAPIS_API_KEY = 'test-key'
  await withMockedFetch(async () => jsonResponse({
    success: true,
    result: { assets: [], descriptions: [] },
  }), async () => {
    await assert.deepStrictEqual(
      await fetchSteamApis('/v2/steam/users/1/inventory/730/2'),
      { assets: [], descriptions: [] },
    )
  })
})

test('fetchSteamApis unwraps a legacy response key', async () => {
  process.env.STEAMAPIS_API_KEY = 'test-key'
  await withMockedFetch(async () => jsonResponse({
    success: true,
    response: { assets: [{ assetid: '1' }], descriptions: [] },
  }), async () => {
    await assert.deepStrictEqual(
      await fetchSteamApis('/v2/steam/users/1/inventory/730/2'),
      { assets: [{ assetid: '1' }], descriptions: [] },
    )
  })
})

test('fetchSteamApis fails when the API key is missing', async () => {
  const previous = process.env.STEAMAPIS_API_KEY
  delete process.env.STEAMAPIS_API_KEY
  try {
    await assertSteamApisFailure(500, 'SteamApis API key is not configured.')
  } finally {
    if (previous === undefined) {
      delete process.env.STEAMAPIS_API_KEY
    } else {
      process.env.STEAMAPIS_API_KEY = previous
    }
  }
})

test('fetchSteamApis maps rate limits to 429', async () => {
  process.env.STEAMAPIS_API_KEY = 'test-key'
  await withMockedFetch(async () => jsonResponse({ success: false }, 429), async () => {
    await assertSteamApisFailure(
      429,
      'SteamApis rate-limited the request. Wait a minute and try again.',
    )
  })
})

test('fetchSteamApis maps invalid API keys to 502', async () => {
  process.env.STEAMAPIS_API_KEY = 'bad-key'
  await withMockedFetch(async () => jsonResponse({
    success: false,
    error: { name: 'ForbiddenError', message: 'INVALID_API_KEY' },
  }, 403), async () => {
    await assertSteamApisFailure(
      502,
      'SteamApis rejected the request (invalid or missing API key).',
    )
  })
})

test('fetchSteamApis maps missing API key errors to 502', async () => {
  process.env.STEAMAPIS_API_KEY = 'test-key'
  await withMockedFetch(async () => jsonResponse({
    error: 'MISSING_API_KEY',
  }, 401), async () => {
    await assertSteamApisFailure(
      502,
      'SteamApis rejected the request (invalid or missing API key).',
    )
  })
})

test('fetchSteamApis maps private inventory blocks to 403', async () => {
  process.env.STEAMAPIS_API_KEY = 'test-key'
  await withMockedFetch(async () => jsonResponse({ success: false }, 403), async () => {
    await assertSteamApisFailure(
      403,
      'Steam blocked the request (private inventory, or temporary Steam block).',
    )
  })
})

test('fetchSteamApis maps other HTTP errors to 502', async () => {
  process.env.STEAMAPIS_API_KEY = 'test-key'
  await withMockedFetch(async () => jsonResponse({
    success: false,
    error: { message: 'INSUFFICIENT_BALANCE' },
  }, 400), async () => {
    await assertSteamApisFailure(502, 'SteamApis request failed: INSUFFICIENT_BALANCE.')
  })
})

test('fetchSteamApis maps unsuccessful envelopes to 403', async () => {
  process.env.STEAMAPIS_API_KEY = 'test-key'
  await withMockedFetch(async () => jsonResponse({
    success: false,
    error: { message: 'NOT_FOUND' },
  }), async () => {
    await assertSteamApisFailure(403, 'NOT_FOUND')
  })
})

test('fetchSteamApis maps empty payloads to 403', async () => {
  process.env.STEAMAPIS_API_KEY = 'test-key'
  await withMockedFetch(async () => new Response('', { status: 200 }), async () => {
    await assertSteamApisFailure(
      403,
      'SteamApis returned an empty payload (private inventory or temporary block).',
    )
  })
})
