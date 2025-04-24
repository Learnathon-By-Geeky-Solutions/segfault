FROM node:22.13.1-alpine3.21 AS builder
LABEL maintainer="segfault"

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build
# if NODE_ENV is set to production then remove dev dependencies
RUN if [ "$NODE_ENV" = "production" ]; then \
      echo "Pruning dev dependencies"; \
      npm prune --omit=dev; \
    fi

FROM builder AS final
WORKDIR /app

EXPOSE 4000
EXPOSE 50051

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN chown -R node /app
USER node

CMD ["node", "dist/server.js"]





