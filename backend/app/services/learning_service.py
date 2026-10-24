from typing import Any

from app.errors import NotFoundError
from app.repositories.lab_repository import LabRepository
from app.repositories.lesson_repository import LessonRepository
from app.repositories.planet_repository import PlanetRepository
from app.repositories.planetary_system_repository import PlanetarySystemRepository
from app.services import is_uuid, require_by_ref
from app.services.planetary_system_service import SYSTEM_NOT_FOUND

LESSON_NOT_FOUND = "Aula não encontrada."
LAB_NOT_FOUND = "Laboratório não encontrado."
WRONG_PLANET_MESSAGES = {
    "lab": "Aula não encontrada: este planeta é um laboratório.",
    "lesson": "Laboratório não encontrado: este planeta é uma aula.",
}


class LearningService:
    def __init__(
        self,
        lessons: LessonRepository,
        labs: LabRepository,
        planets: PlanetRepository,
        systems: PlanetarySystemRepository,
    ) -> None:
        self._lessons = lessons
        self._labs = labs
        self._planets = planets
        self._systems = systems

    def list_lessons(self, system_ref: str | None = None) -> list[dict[str, Any]]:
        if system_ref is None:
            lessons = self._lessons.list_all()
        else:
            lessons = self._lessons.list_by_planet_ids(self._system_planet_ids(system_ref))
        return [lesson.to_dict() for lesson in lessons]

    def get_lesson(self, ref: str) -> dict[str, Any]:
        return self._get_detail(self._lessons, ref, "lesson", LESSON_NOT_FOUND)

    def list_labs(self, system_ref: str | None = None) -> list[dict[str, Any]]:
        if system_ref is None:
            labs = self._labs.list_all()
        else:
            labs = self._labs.list_by_planet_ids(self._system_planet_ids(system_ref))
        return [lab.to_dict() for lab in labs]

    def get_lab(self, ref: str) -> dict[str, Any]:
        return self._get_detail(self._labs, ref, "lab", LAB_NOT_FOUND)

    def _system_planet_ids(self, system_ref: str) -> list[str]:
        system = require_by_ref(self._systems, system_ref, SYSTEM_NOT_FOUND)
        return [planet.id for planet in self._planets.list_by_system(system.id)]

    def _get_detail(
        self,
        repository: LessonRepository | LabRepository,
        ref: str,
        planet_type: str,
        not_found_message: str,
    ) -> dict[str, Any]:
        item, planet = self._find(repository, ref.strip())
        if item is None:
            if planet is not None and planet.type != planet_type:
                not_found_message = WRONG_PLANET_MESSAGES.get(planet.type, not_found_message)
            raise NotFoundError(not_found_message)
        if planet is None:
            planet = self._planets.get_by_id(item.planet_id)
        system = self._systems.get_by_id(planet.planetary_system_id) if planet else None
        return {
            **item.to_dict(),
            "planet": planet.to_dict() if planet else None,
            "system": system.to_dict() if system else None,
        }

    def _find(self, repository: LessonRepository | LabRepository, ref: str) -> tuple[Any, Any]:
        # ref pode ser o id/slug da própria aula (ou laboratório) ou o id/slug do planeta.
        if is_uuid(ref):
            ref = ref.lower()
            # o frontend navega pelo id do planeta: procurar o planeta primeiro poupa uma consulta
            planet = self._planets.get_by_id(ref)
            item = None if planet else repository.get_by_id(ref)
        else:
            item = repository.get_by_slug(ref)
            planet = None if item else self._planets.get_by_slug(ref)
        if planet is not None:
            item = repository.get_by_planet_id(planet.id)
        return item, planet
