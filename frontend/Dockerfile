FROM node:22.13.1-alpine3.21
LABEL maintainer="segfault"

USER node
WORKDIR /app

COPY --chown=node:node package.json package-lock.json tsconfig.json ./
COPY --chown=node:node next.config.ts ./
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public

EXPOSE 3000

ARG DEV=false
RUN if [ "$DEV" = "true" ]; then \
      npm install --ignore-scripts && npm install --only=dev --ignore-scripts; \
    else \
      npm ci --ignore-scripts --production; \
      mkdir -p /app/.next && chown -R node:node /app/.next; \
    fi
