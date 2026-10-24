from typing import Any

from app.models import Model
from app.repositories.data_source import DataSource


class BaseRepository:
    table: str
    model: type[Model]
    default_order: tuple[str, ...] = ()

    def __init__(self, data_source: DataSource) -> None:
        self._data_source = data_source

    @property
    def source_name(self) -> str:
        return self._data_source.name

    def ping(self) -> bool:
        return self._data_source.ping()

    def get_by_id(self, id: str) -> Any:
        return self._get("id", id)

    def get_by_slug(self, slug: str) -> Any:
        return self._get("slug", slug)

    def _list(self, filters: dict[str, Any] | None = None) -> list[Any]:
        rows = self._data_source.list(self.table, filters, list(self.default_order))
        return [self.model.from_row(row) for row in rows]

    def _get(self, column: str, value: Any) -> Any:
        row = self._data_source.get(self.table, column, value)
        return self.model.from_row(row) if row else None
