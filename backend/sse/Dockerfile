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

# Add build arguments for UID and GID with defaults
ARG UID=1000
ARG GID=1000
ARG USERNAME=codesirius

# Delete the existing node user and group first
RUN deluser --remove-home node && \
    delgroup node || true

# Create group and user with specified GID and UID
RUN addgroup -g $GID $USERNAME && \
    adduser -D -u $UID -G $USERNAME $USERNAME

EXPOSE 4000
EXPOSE 50051

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Set ownership to the new user
RUN chown -R $USERNAME:$USERNAME /app
USER $USERNAME

CMD ["node", "dist/server.js"]
