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

ARG DEV=false
ARG GID=1000
ARG UID=1000

# install poetry and create user
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    curl -sSL https://install.python-poetry.org | python3 - && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd -g $GID codesirius || true && \
    useradd -u $UID -g $GID -m codesirius && \
    chown -R codesirius:codesirius $POETRY_HOME

USER codesirius
WORKDIR /home/codesirius/app

COPY . .

RUN poetry install --without dev && \
    if [ "$DEV" = "true" ]; then poetry install --only dev; fi

