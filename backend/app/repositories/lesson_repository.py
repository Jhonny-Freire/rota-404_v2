from collections.abc import Iterable

from app.models.learning import Lesson
from app.repositories import BaseRepository


class LessonRepository(BaseRepository):
    table = "lessons"
    model = Lesson
    default_order = ("order_index", "title")

    def list_all(self) -> list[Lesson]:
        return self._list()

    def list_by_planet_ids(self, planet_ids: Iterable[str]) -> list[Lesson]:
        return self._list({"planet_id": list(planet_ids)})

    def get_by_planet_id(self, planet_id: str) -> Lesson | None:
        return self._get("planet_id", planet_id)
