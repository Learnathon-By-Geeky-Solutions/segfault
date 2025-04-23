from typing import Optional

import redis


class RedisClientSingleton:
    """
    Singleton class to manage a single Redis connection.
    """

    _instance: Optional["RedisClientSingleton"] = None

    def __new__(
        cls, host: str = "localhost", port: int = 6379, db: int = 0
    ) -> "RedisClientSingleton":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_connection(host, port, db)
        return cls._instance

    def _init_connection(self, host: str, port: int, db: int) -> None:
        self._redis = redis.Redis(host=host, port=port, db=db, decode_responses=True)

    def get_client(self) -> redis.Redis:
        return self._redis
