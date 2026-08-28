import fp from 'fastify-plugin';
import {AppInventory} from "../utils/loadouts_shared_generated";

type CachedInventory = {
  expiresAt: number;
  inventory: AppInventory;
};

class Cache {
  public inventories = new Map<string, CachedInventory>();
}

export default fp(async (fastify) => {
  const cache = new Cache();
  fastify.decorate("cache", cache);
});

declare module 'fastify' {
  interface FastifyInstance {
    cache: Cache;
  }
}