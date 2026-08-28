import { type FastifyPluginAsync } from "fastify";
import fastifyPassport from "@fastify/passport";

const auth: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/steam',
    {
      preValidation: fastifyPassport.authenticate('steam')
    },
    async (request) => {
      request.log.info("Redirecting to Steam for authentication...");
    }
  )

  fastify.get('/steam/callback',
    {
      preValidation: fastifyPassport.authenticate('steam')
    },
    async (request, reply) => {
      request.log.info("Processing Steam authentication callback...");
      request.log.info(`Authentication state: ${!!request.user}`);
      const redirection = request.user ? process.env.FRONTEND_URL as string + "/auth/steam/success" :
                                                process.env.FRONTEND_URL as string;
      request.log.info(`Redirecting to: ${redirection}`);
      return reply.redirect(redirection);
    }
  )

  fastify.get("/me", async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({
        authenticated: false,
      });
    }

    return {
      authenticated: true,
      user: request.user,
    };
  });

  fastify.post("/logout", async (request, reply) => {
    if(request.user){
      request.log.info(`Logging out user: ${(request.user as { steamId: string }).steamId}`)
      await request.logout();
    }
    return reply.send({ ok: true });
  });
}

export default auth;