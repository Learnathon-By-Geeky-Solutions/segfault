FROM node:22.13.1-alpine3.21
LABEL maintainer="segfault"

USER node
WORKDIR /app

COPY --chown=node:node --chmod=755 package.json package-lock.json tsconfig.json ./
COPY --chown=node:node --chmod=755 next.config.ts ./
COPY --chown=node:node --chmod=755 src ./src
COPY --chown=node:node --chmod=755 public ./public

EXPOSE 3000

ARG DEV=false
RUN if [ "$DEV" = "true" ]; then \
      npm install --ignore-scripts && npm install --only=dev --ignore-scripts; \
    else \
      npm ci --ignore-scripts --production; \
      mkdir -p /app/.next && chown -R node:node /app/.next; \
    fi
