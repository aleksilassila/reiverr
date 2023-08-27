FROM node:18-alpine as builder

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine as production

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=builder /usr/src/app/build ./build

COPY package.json package-lock.json ./

RUN npm ci --omit dev

RUN mkdir -p ./config

RUN ln -s /usr/src/app/config /config

CMD [ "npm", "run", "deploy" ]
