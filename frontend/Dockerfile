FROM node:22.13.1-alpine3.21
LABEL maintainer="segfault"

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY src ./src
COPY tsconfig.json ./
COPY public ./public
COPY next.config.ts ./

EXPOSE 3000

ARG DEV=false
RUN if [ "$DEV" = "true" ]; then \
      npm install --ignore-scripts && npm install --only=dev --ignore-scripts; \
    else \
      npm ci --ignore-scripts --production; \
    fi && \
    chown -R node /app

USER node

