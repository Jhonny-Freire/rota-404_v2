import logging
from typing import Any

from app.repositories import BaseRepository

logger = logging.getLogger(__name__)


class HealthService:
    def __init__(self, repository: BaseRepository) -> None:
        self._repository = repository

    def check(self) -> dict[str, Any]:
        try:
            database_ok = self._repository.ping()
        except Exception:
            logger.exception("Falha inesperada ao verificar o banco de dados.")
            database_ok = False
        return {
            "status": "ok" if database_ok else "degraded",
            "data_source": self._repository.source_name,
            "database": "ok" if database_ok else "error",
        }
