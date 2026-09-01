import { AppInventory } from "../utils/loadouts_shared_generated";

export const INVENTORY_CACHE_TTL_SECONDS = 60;

export const DELETE_EXPIRED_INVENTORIES_SQL =
  "DELETE FROM inventories WHERE expires_at < NOW()";

export type SqlClient = {
  query: (
    sql: string,
    params?: unknown[]
  ) => Promise<{ rows: Array<{ inventory: AppInventory }>; rowCount: number | null }>;
};

export async function findCachedInventory(
  pg: SqlClient,
  steamId: string
): Promise<AppInventory | null> {
  const result = await pg.query(
    `SELECT inventory
     FROM inventories
     WHERE steam_id = $1
       AND expires_at > NOW()`,
    [steamId]
  );

  if (!result.rowCount) {
    return null;
  }

  return result.rows[0].inventory;
}

export async function saveCachedInventory(
  pg: SqlClient,
  steamId: string,
  inventory: AppInventory
): Promise<void> {
  await pg.query(
    `INSERT INTO inventories (steam_id, inventory, expires_at)
     VALUES ($1, $2::jsonb, NOW() + ($3 * INTERVAL '1 second'))
     ON CONFLICT (steam_id) DO UPDATE SET
       inventory = EXCLUDED.inventory,
       expires_at = EXCLUDED.expires_at`,
    [steamId, JSON.stringify(inventory), INVENTORY_CACHE_TTL_SECONDS]
  );
}
