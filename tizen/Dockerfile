FROM --platform=linux/amd64 node:18-alpine as pre-production

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

#COPY . .

COPY package.json .
COPY package-lock.json .

# COPY backend/package.json ./backend/package.json
# COPY backend/package-lock.json ./backend/package-lock.json

# COPY backend/packages/reiverr-plugin/package.json ./backend/packages/reiverr-plugin/package.json
# COPY backend/packages/jellyfin.plugin/package.json ./backend/packages/jellyfin.plugin/package.json
# COPY backend/packages/torrent-stream.plugin/package.json ./backend/packages/torrent-stream.plugin/package.json

RUN npm i

# RUN npm ci --prefix backend

COPY . .

RUN npm run build:tizen

FROM --platform=linux/amd64 vitalets/tizen-webos-sdk

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# ENV NODE_ENV=production
COPY --from=pre-production /usr/src/app/tizen ./tizen

# COPY --from=pre-production /usr/src/app/backend/dist ./dist
# COPY --from=pre-production /usr/src/app/backend/node_modules ./node_modules
# COPY --from=pre-production /usr/src/app/backend/packages ./packages
# VOLUME ./packages

# COPY backend/package.json .
# COPY backend/package-lock.json .
# COPY backend/tsconfig.json .
# COPY backend/tsconfig.build.json .

#RUN npm ci --omit dev

# RUN mkdir -p ./config
# RUN mkdir -p ./plugins

# RUN ln -s /usr/src/app/config /config
# RUN ln -s /usr/src/app/plugins /plugins

RUN tizen build-web -- tizen
RUN tizen package -t wgt -o ./tizen -- ./tizen/.buildResult
# RUN tizen install -n ./tizen/Reiverr.wgt -t QE55Q64TAUXXC

ENTRYPOINT [ "/usr/src/app/tizen/install.sh" ]

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
