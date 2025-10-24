FROM mcr.microsoft.com/devcontainers/typescript-node:18

ENV NODE_ENV=development

RUN mkdir -p /workspaces/reiverr-debrid-stream
WORKDIR /workspaces/reiverr-debrid-stream

COPY package.json .

RUN mkdir -p ./config
RUN mkdir -p ./plugins

RUN ln -s /workspaces/reiverr-debrid-stream/config /config
RUN ln -s /workspaces/reiverr-debrid-stream/plugins /plugins

EXPOSE 5173

USER node

