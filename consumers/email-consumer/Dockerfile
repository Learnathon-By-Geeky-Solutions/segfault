FROM python:3.13.2-slim-bookworm
LABEL maintainer="segfault"

# python env vars
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# poetry env vars
ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_HOME=/home/codesirius/.poetry

# add poetry to PATH
ENV PATH="${PATH}:${POETRY_HOME}/bin"

# create a non-root user
RUN adduser --disabled-password codesirius

# install poetry
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    curl -sSL https://install.python-poetry.org | python3 - && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    chown -R codesirius:codesirius $POETRY_HOME

USER codesirius
WORKDIR /home/codesirius/app

COPY . .

ARG DEV=false
RUN poetry install --without dev && \
    if [ "$DEV" = "true" ]; then poetry install --only dev; fi

