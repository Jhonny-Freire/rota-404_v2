from collections.abc import Iterable
from typing import Any

from app.models.gamification import ProgressRow, Score
from app.errors import MissingColumnError
from app.models.user import User
from app.repositories import BaseRepository
from app.repositories.data_source import Row


class UserRepository(BaseRepository):
    """Contas. Os métodos *_row devolvem a linha crua (com password_hash/token_hash) só para a autenticação."""

    table = "users"
    model = User
    default_order = ("created_at",)

    def get_row_by_nickname_key(self, nickname_key: str) -> Row | None:
        return self._data_source.get(self.table, "nickname_key", nickname_key)

    def get_row_by_token_hash(self, token_hash: str) -> Row | None:
        return self._data_source.get(self.table, "token_hash", token_hash)

    def list_by_ids(self, ids: Iterable[str]) -> list[User]:
        return self._list({"id": list(ids)})

    # colunas de migrations mais novas: se o banco ainda não as tem, grava o resto (cadastro não para na feira)
    OPTIONAL_COLUMNS = ("knowledge_level",)

    def create(self, values: Row) -> Row:
        try:
            return self._data_source.insert(self.table, values)
        except MissingColumnError:
            fallback = self._without_optional(values)
            if fallback == values:
                raise
            return self._data_source.insert(self.table, fallback)

    def update(self, user_id: str, values: Row) -> Row | None:
        try:
            rows = self._data_source.update(self.table, {"id": user_id}, values)
        except MissingColumnError:
            fallback = self._without_optional(values)
            if fallback == values:
                raise
            rows = self._data_source.update(self.table, {"id": user_id}, fallback) if fallback else []
        return rows[0] if rows else None

    def _without_optional(self, values: Row) -> Row:
        return {key: value for key, value in values.items() if key not in self.OPTIONAL_COLUMNS}


class ProgressRepository(BaseRepository):
    table = "user_progress"
    model = ProgressRow
    default_order = ("created_at",)
    ENTITY = "planet"

    def list_by_user(self, user_id: str) -> list[ProgressRow]:
        return self._list({"user_id": user_id, "entity_type": self.ENTITY})

    def save(self, user_id: str, planet_id: str, status: str) -> ProgressRow:
        key = {"user_id": user_id, "entity_type": self.ENTITY, "entity_id": planet_id}
        values: dict[str, Any] = {"status": status, "progress_percent": 100 if status == "completed" else 0}
        rows = self._data_source.update(self.table, key, values)
        row = rows[0] if rows else self._data_source.insert(self.table, {**key, **values})
        return self.model.from_row(row)


class ScoreRepository(BaseRepository):
    table = "scores"
    model = Score
    default_order = ("created_at",)

    def list_by_user(self, user_id: str) -> list[Score]:
        return self._list({"user_id": user_id})

    def list_by_galaxy(self, galaxy_id: str) -> list[Score]:
        return self._list({"galaxy_id": galaxy_id})

    def list_by_system(self, planetary_system_id: str) -> list[Score]:
        return self._list({"planetary_system_id": planetary_system_id})

    def get_for_lab(self, user_id: str, lab_id: str) -> Score | None:
        rows = self._list({"user_id": user_id, "lab_id": lab_id})
        return rows[0] if rows else None

    def create(self, values: Row) -> Score:
        return self.model.from_row(self._data_source.insert(self.table, values))

    def update_points(self, score_id: str, points: int) -> None:
        self._data_source.update(self.table, {"id": score_id}, {"points": points})
