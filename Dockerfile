FROM --platform=linux/amd64 node:18-alpine as pre-production

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

#COPY . .

COPY package.json .
COPY package-lock.json .

COPY backend/package.json ./backend/package.json
COPY backend/package-lock.json ./backend/package-lock.json

COPY backend/packages/reiverr-plugin/package.json ./backend/packages/reiverr-plugin/package.json

COPY backend/plugins/jellyfin.plugin/package.json ./backend/plugins/jellyfin.plugin/package.json
COPY backend/plugins/jellyfin.plugin/package-lock.json ./backend/plugins/jellyfin.plugin/package-lock.json

COPY backend/plugins/torrent-stream.plugin/package.json ./backend/plugins/torrent-stream.plugin/package.json
COPY backend/plugins/torrent-stream.plugin/package-lock.json ./backend/plugins/torrent-stream.plugin/package-lock.json

RUN npm i

RUN npm ci --prefix backend

COPY . .

RUN npm run build

FROM --platform=linux/amd64 node:18-alpine as production

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=pre-production /usr/src/app/backend/dist ./dist
COPY --from=pre-production /usr/src/app/backend/node_modules ./node_modules
COPY --from=pre-production /usr/src/app/backend/packages ./packages

COPY backend/package.json .
COPY backend/package-lock.json .

#RUN npm ci --omit dev

RUN mkdir -p ./config
RUN mkdir -p ./plugins

RUN ln -s /usr/src/app/config /config
RUN ln -s /usr/src/app/plugins /plugins

CMD [ "npm", "run", "start:prod" ]

#FROM node:18 as development
#
#ENV NODE_ENV=development
#
#RUN mkdir -p /usr/src/app
#WORKDIR /usr/src/app
#
#COPY package.json .
#COPY package-lock.json .
#
#RUN npm i
#
#RUN mkdir -p ./config
#
#RUN ln -s /usr/src/app/config /config
#
#CMD [ "npm", "run", "dev" ]
