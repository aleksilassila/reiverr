FROM node:24-alpine as base

# npm 11 compiles better-sqlite3 from source when installing from a lockfile
RUN apk add --no-cache python3 make g++

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

#COPY . .

COPY package.json .
COPY package-lock.json .

COPY backend/package.json ./backend/package.json
# COPY backend/package-lock.json ./backend/package-lock.json

COPY frontend/package.json ./frontend/package.json
# COPY frontend/package-lock.json ./frontend/package-lock.json

RUN npm i

# utp-native ships a glibc prebuild for linux-x64, which musl loads with
# unresolved symbols: the process dies on the first uTP packet. Without a
# prebuild its install script compiles the module, as it does on arm64.
RUN rm -r node_modules/utp-native/prebuilds && npm rebuild utp-native

COPY . .

FROM base as development

# Downloads and the library folders share the /data volume, so that finished
# downloads are hard linked into the library instead of copied
ENV DOWNLOADS_DIR=/data/downloads

CMD [ "npm", "run", "dev:backend" ]

FROM base as pre-production

RUN npm run build

FROM node:24-alpine as production

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV=production
# Downloads and the library folders share the /data volume, so that finished
# downloads are hard linked into the library instead of copied
ENV DOWNLOADS_DIR=/data/downloads

COPY --from=pre-production /usr/src/app/package.json ./package.json
COPY --from=pre-production /usr/src/app/package-lock.json ./package-lock.json
COPY --from=pre-production /usr/src/app/node_modules ./node_modules

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

RUN ln -s /usr/src/app/backend/config /config

CMD [ "npm", "run", "start:prod" ]
