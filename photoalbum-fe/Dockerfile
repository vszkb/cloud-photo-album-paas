### STAGE 1: Build ###
FROM node:22.16.0-alpine AS build
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

### STAGE 2: Run ###
FROM nginx:1.25.2
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/src/app/dist/photoalbum-fe/browser /usr/share/nginx/html

EXPOSE 8080
CMD ["/bin/sh",  "-c",  "envsubst < /usr/share/nginx/html/env.sample.js > /usr/share/nginx/html/env.js && exec nginx -g 'daemon off;'"]