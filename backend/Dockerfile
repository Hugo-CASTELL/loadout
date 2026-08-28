FROM node:24 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build:ts

FROM node:24-bookworm AS production
RUN npm install -g fastify-cli \
    && addgroup --system nonroot \
    && adduser --system backend --ingroup nonroot \
    && mkdir -p /app \
    && chown backend:nonroot /app
WORKDIR /app
COPY db ./db
COPY package.json package-lock.json ./
ENV NODE_ENV=production
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER backend
CMD ["fastify", "start", "--log-level", "info", "--pretty-logs", "dist/app.js"]