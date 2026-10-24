from app.models.catalog import Galaxy
from app.repositories import BaseRepository


class GalaxyRepository(BaseRepository):
    table = "galaxies"
    model = Galaxy
    default_order = ("order_index", "name")

    def list_all(self) -> list[Galaxy]:
        return self._list()

    def list_by_age_range(self, age_range_id: str) -> list[Galaxy]:
        return self._list({"age_range_id": age_range_id})
