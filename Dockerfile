FROM --platform=linux/amd64 node:18-alpine as pre-production

WORKDIR /usr/src/app

#COPY . .

COPY package.json .
COPY package-lock.json .

COPY backend/package.json ./backend/package.json
COPY backend/package-lock.json ./backend/package-lock.json

# Add tini for better signal handling
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

RUN #npm ci --prefix backend --omit dev
RUN npm ci --prefix backend

COPY . .

RUN npm run build

FROM --platform=linux/amd64 node:18-alpine as production

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/build build/
COPY --from=builder /usr/src/app/node_modules node_modules/
COPY package.json ./

# Config folder
RUN mkdir -p ./config
RUN ln -s /usr/src/app/config /config

ENV PORT=9494
ENV NODE_ENV=production

COPY --from=pre-production /usr/src/app/backend/dist ./dist
COPY --from=pre-production /usr/src/app/backend/node_modules ./node_modules

COPY backend/package.json .
COPY backend/package-lock.json .

#RUN npm ci --omit dev

RUN mkdir -p ./config

RUN ln -s /usr/src/app/config /config

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
