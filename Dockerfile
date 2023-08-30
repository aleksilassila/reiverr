FROM node:18-alpine as builder

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine as production

ENV NODE_ENV=production
ENV PORT=9494

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/build ./build

COPY package.json package-lock.json ./
RUN npm ci --omit dev

CMD [ "node", "build" ]
