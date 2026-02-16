FROM --platform=linux/amd64 node:18-alpine as pre-production

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json .
COPY package-lock.json .

COPY frontend/package.json ./frontend/package.json

COPY shared/package.json ./shared/package.json

RUN npm i

COPY frontend ./frontend
# COPY tizen ./tizen

RUN npm run --prefix frontend build:tizen

FROM --platform=linux/amd64 vitalets/tizen-webos-sdk

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY tizen ./tizen
COPY --from=pre-production /usr/src/app/frontend/dist.tizen ./tizen/dist

RUN tizen build-web -- tizen
RUN tizen package -t wgt -o ./tizen -- ./tizen/.buildResult
RUN chmod +x ./tizen/install.sh

ENTRYPOINT [ "/usr/src/app/tizen/install.sh" ]
