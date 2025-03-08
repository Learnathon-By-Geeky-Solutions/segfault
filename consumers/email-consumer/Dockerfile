FROM python:3.13.2-slim-bookworm
LABEL maintainer="segfault"

WORKDIR /app
ENV PYTHONUNBUFFERED=1

COPY ./requirements.txt /tmp/requirements.txt
COPY ./src /app

ARG DEV=false
RUN pip install --upgrade pip && \
    pip install -r /tmp/requirements.txt && \
    rm -rf /tmp/requirements.txt && \
    adduser --disabled-password --no-create-home codesirius && \
    mkdir -p /app && \
    chown -R codesirius /app

USER codesirius
