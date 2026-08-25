FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# nginx writes a pid file and cache entries, so those paths have to belong
# to the user it runs as. The site listens on 3000 (frontend/nginx.conf),
# which is unprivileged -- binding 80 as non-root would not work.
RUN touch /var/run/nginx.pid \
 && chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /usr/share/nginx/html
USER nginx

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
