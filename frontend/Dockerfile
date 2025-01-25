FROM node:22.13.1-alpine3.21
LABEL maintainer="segfault"

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY src ./src
COPY public ./public

EXPOSE 3000

ARG DEV=false
RUN npm install && \
    if [ "$DEV" = "true" ]; then npm install --only=dev; fi && \
    adduser --disabled-password codesirius

USER codesirius

