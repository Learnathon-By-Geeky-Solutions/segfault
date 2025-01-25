FROM node:22.13.1-alpine3.21
LABEL maintainer="segfault"

WORKDIR /app

COPY . .
EXPOSE 3000

ARG DEV=false
RUN npm install && \
    if [ "$DEV" = "true" ]; then npm install --only=dev; fi && \
    adduser --disabled-password codesirius

USER codesirius

