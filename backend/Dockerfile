FROM python:3.10-alpine3.20
LABEL maintainer="segfault"

ENV PYTHONUNBUFFERED=1

COPY ./requirements.txt /tmp/requirements.txt
COPY ./requirements.dev.txt /tmp/requirements.dev.txt
COPY ./codesirius /app/codesirius
#WORKDIR /app
EXPOSE 8000


ARG DEV=false
RUN pip install --upgrade pip && \
    apk add --update --no-cache postgresql-client && \
    apk add --update --no-cache --virtual .tmp-build-deps build-base musl-dev postgresql-dev && \
    pip install -r /tmp/requirements.txt && \
    if [ "$DEV" = "true" ]; then pip install -r /tmp/requirements.dev.txt; fi && \
    rm -rf /tmp && \
    apk del .tmp-build-deps && \
    mkdir -p /app/codesirius/logs && \
    adduser --disabled-password --no-create-home codesirius && \
    chown -R codesirius /app/codesirius

USER codesirius
