from app.models.catalog import PlanetarySystem
from app.repositories import BaseRepository


class PlanetarySystemRepository(BaseRepository):
    table = "planetary_systems"
    model = PlanetarySystem
    default_order = ("order_index", "name")

    def list_all(self) -> list[PlanetarySystem]:
        return self._list()

    def list_by_galaxy(self, galaxy_id: str) -> list[PlanetarySystem]:
        return self._list({"galaxy_id": galaxy_id})
