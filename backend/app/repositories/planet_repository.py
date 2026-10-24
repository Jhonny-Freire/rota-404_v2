from collections.abc import Iterable

from app.models.catalog import Planet
from app.repositories import BaseRepository


class PlanetRepository(BaseRepository):
    table = "planets"
    model = Planet
    default_order = ("order_index", "name")

    def list_by_system(self, planetary_system_id: str) -> list[Planet]:
        return self._list({"planetary_system_id": planetary_system_id})

    def list_by_systems(self, planetary_system_ids: Iterable[str]) -> list[Planet]:
        return self._list({"planetary_system_id": list(planetary_system_ids)})
