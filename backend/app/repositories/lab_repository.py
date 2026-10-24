from collections.abc import Iterable

from app.models.learning import Lab
from app.repositories import BaseRepository


class LabRepository(BaseRepository):
    table = "labs"
    model = Lab
    default_order = ("order_index", "title")

    def list_all(self) -> list[Lab]:
        return self._list()

    def list_by_planet_ids(self, planet_ids: Iterable[str]) -> list[Lab]:
        return self._list({"planet_id": list(planet_ids)})

    def get_by_planet_id(self, planet_id: str) -> Lab | None:
        return self._get("planet_id", planet_id)
