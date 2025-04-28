FROM python:3.13.2-slim-bookworm
LABEL maintainer="segfault"

# python env vars
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# poetry env vars
ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=false\
    POETRY_HOME=/opt/poetry

# add poetry to PATH
ENV PATH="${PATH}:${POETRY_HOME}/bin"

# Create the poetry directory with global permissions first
RUN mkdir -p ${POETRY_HOME}

# install poetry - do this before user creation
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    curl -sSL https://install.python-poetry.org | python3 - && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Now create user with specific UID/GID
ARG GID=1000
ARG UID=1000
RUN groupadd -g $GID codesirius || true && \
    useradd -u $UID -g $GID -m codesirius && \
    mkdir -p /home/codesirius/app && \
    chown -R codesirius:codesirius /home/codesirius && \
    chmod -R 755 ${POETRY_HOME}

USER codesirius
WORKDIR /home/codesirius/app

COPY --chown=codesirius:codesirius . .

ARG DEV=false
RUN poetry install --without dev && \
    if [ "$DEV" = "true" ]; then poetry install --only dev; fi

CMD ["poetry", "run", "python3", "src/main.py"]
