FROM --platform=linux/amd64 node:18-alpine as pre-production

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

#COPY . .

COPY package.json .
COPY package-lock.json .

COPY backend/package.json ./backend/package.json
# COPY backend/package-lock.json ./backend/package-lock.json

COPY frontend/package.json ./frontend/package.json
# COPY frontend/package-lock.json ./frontend/package-lock.json

COPY shared/package.json ./shared/package.json
# COPY shared/package-lock.json ./shared/package-lock.json

COPY torrent-stream.plugin/package.json ./torrent-stream.plugin/package.json
# COPY torrent-stream.plugin/package-lock.json ./torrent-stream.plugin/package-lock.json

COPY jellyfin.plugin/package.json ./jellyfin.plugin/package.json
# COPY jellyfin.plugin/package-lock.json ./jellyfin.plugin/package-lock.json

RUN npm i

COPY . .

RUN npm run build

FROM --platform=linux/amd64 node:18-alpine as production

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=pre-production /usr/src/app/package.json ./package.json
COPY --from=pre-production /usr/src/app/package-lock.json ./package-lock.json
COPY --from=pre-production /usr/src/app/node_modules ./node_modules

COPY --from=pre-production /usr/src/app/shared ./shared
COPY --from=pre-production /usr/src/app/torrent-stream.plugin ./torrent-stream.plugin
COPY --from=pre-production /usr/src/app/jellyfin.plugin ./jellyfin.plugin

COPY --from=pre-production /usr/src/app/backend/package.json ./backend/package.json
# # COPY --from=pre-production /usr/src/app/backend/package-lock.json ./backend/package-lock.json
COPY --from=pre-production /usr/src/app/backend/tsconfig.json ./backend/tsconfig.json
COPY --from=pre-production /usr/src/app/backend/tsconfig.build.json ./backend/tsconfig.build.json
COPY --from=pre-production /usr/src/app/backend/dist ./backend/dist
COPY --from=pre-production /usr/src/app/backend/node_modules ./backend/node_modules
# COPY --from=pre-production /usr/src/app/backend/packages ./backend/packages
# VOLUME ./backend/packages

# COPY backend/package.json ./backend/package.json
# COPY backend/package-lock.json ./backend/package-lock.json
# COPY backend/tsconfig.json ./backend/tsconfig.json
# COPY backend/tsconfig.build.json ./backend/tsconfig.build.json

#RUN npm ci --omit dev

RUN mkdir -p ./backend/config
RUN mkdir -p ./backend/plugins

RUN ln -s /usr/src/app/backend/config /config
RUN ln -s /usr/src/app/backend/plugins /plugins

CMD [ "npm", "run", "start:prod" ]
