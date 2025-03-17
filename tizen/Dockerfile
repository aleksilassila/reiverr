FROM --platform=linux/amd64 node:18-alpine as pre-production

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json .
COPY package-lock.json .

RUN npm i

COPY . .

RUN npm run build:tizen

FROM --platform=linux/amd64 vitalets/tizen-webos-sdk

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# ENV NODE_ENV=production
COPY --from=pre-production /usr/src/app/tizen ./tizen

RUN tizen build-web -- tizen
RUN tizen package -t wgt -o ./tizen -- ./tizen/.buildResult
RUN chmod +x ./tizen/install.sh

ENTRYPOINT [ "/usr/src/app/tizen/install.sh" ]
