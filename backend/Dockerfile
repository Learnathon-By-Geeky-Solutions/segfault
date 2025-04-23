FROM python:3.13.2-slim-bookworm
LABEL maintainer="segfault"

ENV PYTHONUNBUFFERED=1

COPY ./requirements.txt /tmp/requirements.txt
COPY ./requirements.dev.txt /tmp/requirements.dev.txt
#WORKDIR /app
EXPOSE 8000

ARG DEV=false
ARG GID=1000
ARG UID=1000

RUN pip install --upgrade pip && \
    apt-get update && apt-get install -y --no-install-recommends postgresql-client && \
    apt-get install -y --no-install-recommends build-essential libpq-dev && \
    pip install -r /tmp/requirements.txt && \
    if [ "$DEV" = "true" ]; then pip install -r /tmp/requirements.dev.txt; fi && \
    rm -rf /var/lib/apt/lists/* /tmp && \
    mkdir -p /app/codesirius/logs && \
    groupadd -g $GID codesirius || true && \
    useradd -u $UID -g $GID -m codesirius && \
    chown -R codesirius /app/codesirius

USER codesirius
