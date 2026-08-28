import { type FastifyPluginAsync } from "fastify";
import "@fastify/passport";
import { mapSteamInventoryToAppInventory } from "../../utils/mapping";
import {fetchSteamApis, isSteamApisHttpError, SteamApisUrls} from "../../utils/steamApis";
import {SteamApisInventoryResponse} from "../../utils/loadouts_shared_generated";
import {withAuth} from "../../utils/withAuth";

const CACHE_TTL_MS = 60_000;

const steam: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/inventory",
   withAuth(async (request, reply) => {
    const { steamId } = request.user as { steamId: string };
    request.log.info(`Loading inventory of user ${steamId}...`);

    const cached = fastify.cache.inventories.get(steamId);
    if (cached) {
      if(cached.expiresAt > Date.now()){
        request.log.info(`Found cached inventory of user ${steamId}...`);
        return reply.send(cached.inventory);
      } else {
        request.log.info(`Found expired cached inventory of user ${steamId}...`);
        request.log.info(`Clearing the expired cached inventory...`);
        fastify.cache.inventories.delete(steamId);
      }
    }

    try {
      request.log.info(`Requesting inventory of user ${steamId}...`);
      const rawInventory = await fetchSteamApis<SteamApisInventoryResponse>(SteamApisUrls.inventory(steamId));
      const mappedInventory = mapSteamInventoryToAppInventory(rawInventory);
      fastify.cache.inventories.set(steamId, {
        inventory: mappedInventory,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      return reply.send(mappedInventory);
    } catch (error) {
      if (isSteamApisHttpError(error)) {
        request.log.warn({ err: error.message, steamId }, "steamapis fetch failed");
        return reply.code(error.statusCode).send({ error: error.message });
      }

      request.log.error(error, "unexpected steam inventory error");
      return reply.code(502).send({ error: "Unexpected error while fetching Steam inventory" });
    }
  }));
};

export default steam;
