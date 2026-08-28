import {FastifyReply, FastifyRequest} from "fastify";
import "@fastify/passport";

export function withAuth(
  handler: (request: FastifyRequest, reply: FastifyReply) => Promise<any>
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    return handler(request, reply);
  };
}