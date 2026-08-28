FROM node:24 AS build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
RUN addgroup --system nonroot \
    && adduser --system frontend --ingroup nonroot \
    && chown -R frontend:nonroot /usr/share/nginx/html \
    && chown -R frontend:nonroot /var/cache/nginx \
    && chown -R frontend:nonroot /var/log/nginx \
    && chown -R frontend:nonroot /etc/nginx \
    && touch /var/run/nginx.pid \
    && chown frontend:nonroot /var/run/nginx.pid
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
USER frontend
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]