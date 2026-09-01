import { type FastifyPluginAsync } from "fastify";
import "@fastify/passport";
import "@fastify/postgres";
import { mapSteamInventoryToAppInventory } from "../../utils/mapping";
import {fetchSteamApis, isSteamApisHttpError, SteamApisUrls} from "../../utils/steamApis";
import {SteamApisInventoryResponse} from "../../utils/loadouts_shared_generated";
import {withAuth} from "../../utils/withAuth";
import {findCachedInventory, saveCachedInventory} from "../../db/inventories";

const steam: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/inventory",
   withAuth(async (request, reply) => {
    const { steamId } = request.user as { steamId: string };
    request.log.info(`Loading inventory of user ${steamId}...`);

    try {
      const cached = await findCachedInventory(fastify.pg, steamId);
      if (cached) {
        request.log.info(`Found cached inventory of user ${steamId}...`);
        return reply.send(cached);
      }
    } catch (error) {
      request.log.error(error, "failed to read cached steam inventory");
    }

    try {
      request.log.info(`Requesting inventory of user ${steamId}...`);
      const rawInventory = await fetchSteamApis<SteamApisInventoryResponse>(SteamApisUrls.inventory(steamId));
      const mappedInventory = mapSteamInventoryToAppInventory(rawInventory);

      try {
        await saveCachedInventory(fastify.pg, steamId, mappedInventory);
      } catch (error) {
        request.log.error(error, "failed to persist cached steam inventory");
      }

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
