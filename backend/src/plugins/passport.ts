import fp from 'fastify-plugin'
import fastifyPassport from '@fastify/passport'
import fastifySecureSession from "@fastify/secure-session";
import { Strategy as SteamStrategy } from 'passport-steam'

export default fp(async (fastify) => {
  fastify.register(fastifySecureSession, {
    key: Buffer.from(process.env.SECURE_SESSION_KEY as string, 'hex'),
    cookie: {
      path: '/',
      httpOnly: true,
      // false on HTTP (local / VPS without TLS). Set COOKIE_SECURE=true behind HTTPS.
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
    },
  })

  fastify.register(fastifyPassport.initialize())
  fastify.register(fastifyPassport.secureSession())

  fastifyPassport.use(
    'steam',
    new SteamStrategy(
      {
        returnURL: (process.env.BACKEND_URL as string) + '/auth/steam/callback',
        realm: process.env.BACKEND_URL as string,
        apiKey: 'your steam API key',
        profile: false
      },
      function(identifier, profile, done) {
        done(null, {
          steamId: identifier.split('/').pop()
        })
      }
    )
  );

  fastifyPassport.registerUserSerializer(async (user: { steamId: string }) => {
    return user.steamId
  })

  fastifyPassport.registerUserDeserializer(async (steamId: string) => {
    return { steamId }
  })

})
