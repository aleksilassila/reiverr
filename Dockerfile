FROM node:18-alpine as builder

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:18-alpine as production

# Add tini for better signal handling
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/build build/
COPY --from=builder /usr/src/app/node_modules node_modules/
COPY package.json ./

ENV PORT=9494
ENV NODE_ENV=production
CMD [ "node", "build" ]
