FROM node:18-alpine as builder

WORKDIR /usr/src/app
ENV PORT=9494

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine as production

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/build ./build

COPY package.json package-lock.json ./
RUN npm ci --omit dev
RUN mkdir -p ./config

CMD [ "npm", "run", "preview" ]
