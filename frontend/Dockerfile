FROM node:22.13.1-bullseye
LABEL maintainer="segfault"

WORKDIR /app

# Install system dependencies and formatters
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    openjdk-17-jre \
    clang-format \
    curl \
    && pip3 install autopep8 \
    && curl -L -o /usr/local/bin/google-java-format.jar https://github.com/google/google-java-format/releases/download/v1.19.2/google-java-format-1.19.2-all-deps.jar \
    && echo '#!/bin/bash\njava -jar /usr/local/bin/google-java-format.jar "$@"' > /usr/local/bin/google-java-format \
    && chmod +x /usr/local/bin/google-java-format \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

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

