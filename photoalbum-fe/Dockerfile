### STAGE 1: Build ###
FROM node:22.16.0-alpine AS build
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

### STAGE 2: Run ###
FROM nginx:1.25.2
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /usr/src/app/dist/photoalbum-fe /usr/share/nginx/html

EXPOSE 80
CMD ["/bin/sh",  "-c",  "envsubst < /usr/share/nginx/html/assets/env.sample.js > /usr/share/nginx/html/assets/env.js && exec nginx -g 'daemon off;'"]