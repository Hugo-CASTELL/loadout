import fp from 'fastify-plugin'
import fastifyPostgres from '@fastify/postgres'
import {runMigrations} from "../db/migrate";

export default fp(async (fastify) => {
  await fastify.register(fastifyPostgres, {
    connectionString: process.env.DATABASE_URL,
    max: 20
  });

  await runMigrations(fastify.pg);
});
