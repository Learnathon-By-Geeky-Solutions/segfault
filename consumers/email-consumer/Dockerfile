FROM python:3.13.2-slim-bookworm
LABEL maintainer="segfault"

ENV PYTHONUNBUFFERED=1

COPY ./requirements.txt /tmp/requirements.txt
EXPOSE 8000

ARG DEV=false
RUN pip install --upgrade pip && \
    pip install -r /tmp/requirements.txt && \
    adduser --disabled-password --no-create-home codesirius && \
    mkdir -p /app && \
    chown -R codesirius /app

USER codesirius
