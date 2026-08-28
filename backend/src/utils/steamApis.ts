const CS2_APP_ID = 730;
const CS2_CONTEXT_ID = 2;
const STEAMAPIS_BASE_URL = "https://api.steamapis.com";

export const SteamApisUrls = {
  inventory: (steamId: string) => `/v2/steam/users/${encodeURIComponent(steamId)}/inventory/${CS2_APP_ID}/${CS2_CONTEXT_ID}`
}

export function isSteamApisHttpError(error: unknown): error is Error & { statusCode: number } {
  if (!(error instanceof Error)) return false;
  const statusCode = (error as Error & { statusCode?: unknown }).statusCode;
  return typeof statusCode === "number";
}

function fail(message: string, statusCode: number): never {
  throw Object.assign(new Error(message), { statusCode });
}

export async function fetchSteamApis<T>(endpoint: string): Promise<T> {
  const apiKey = process.env.STEAMAPIS_API_KEY;
  if (!apiKey) {
    fail("SteamApis API key is not configured.", 500);
  }

  const url = new URL(`${STEAMAPIS_BASE_URL}${endpoint}`);
  // v2 prefers x-api-key but some routes still document api_key as a query param.
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "x-api-key": apiKey,
    },
  });

  if (!response.ok) {
    let errorMessage = "SteamApis request failed: ";
    switch (response.status) {
      case 401: errorMessage += "SteamApis rejected the request (invalid or missing API key)."; break;
      case 429: errorMessage += "SteamApis rate-limited the request. Wait a minute and try again."; break;
      case 403: errorMessage += "Steam blocked the request (private inventory, or temporary Steam block)."; break;
      default: errorMessage += `SteamApis request failed with unknown error. Status ${response.status}`; break;
    }
    fail(errorMessage, response.status);
  }

  const payload: any = await response.json();

  if (!payload.success) {
    fail(payload.error?.message || "SteamApis returned an unsuccessful response.", 403);
  }

  let result = payload.success !== undefined && payload.result !== undefined ? /*V2*/ payload.result as T:
                                                                                   /*V1*/ payload as T;
  if (result === undefined || result === null) {
    fail("SteamApis returned an empty payload (private inventory or temporary block).", 403);
  }

  return result;
}
