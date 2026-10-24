from app.models.catalog import AgeRange
from app.repositories import BaseRepository


class AgeRangeRepository(BaseRepository):
    table = "age_ranges"
    model = AgeRange
    default_order = ("min_age",)

    def list_all(self) -> list[AgeRange]:
        return self._list()
