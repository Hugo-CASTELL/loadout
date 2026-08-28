import fp from 'fastify-plugin'
import fastifyCors from "@fastify/cors";

export default fp(async (fastify) => {
  fastify.register(fastifyCors, {
    origin: process.env.CORS_ALLOWED_ORIGIN as string,
    credentials: true,
  })
})
