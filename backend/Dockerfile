FROM python:3.10-slim-bookworm
LABEL maintainer="segfault"

ENV PYTHONUNBUFFERED=1

COPY ./requirements.txt /tmp/requirements.txt
COPY ./requirements.dev.txt /tmp/requirements.dev.txt
COPY ./codesirius /app/codesirius
#WORKDIR /app
EXPOSE 8000

ARG DEV=false
RUN pip install --upgrade pip && \
    apt-get update && apt-get install -y --no-install-recommends postgresql-client && \
    apt-get install -y --no-install-recommends build-essential libpq-dev && \
    pip install -r /tmp/requirements.txt && \
    if [ "$DEV" = "true" ]; then pip install -r /tmp/requirements.dev.txt; fi && \
    rm -rf /var/lib/apt/lists/* /tmp && \
    mkdir -p /app/codesirius/logs && \
    adduser --disabled-password --no-create-home codesirius && \
    chown -R codesirius /app/codesirius

USER codesirius
