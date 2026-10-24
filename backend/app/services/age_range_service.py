from typing import Any

from app.repositories.age_range_repository import AgeRangeRepository
from app.repositories.galaxy_repository import GalaxyRepository
from app.services import require_by_ref

AGE_RANGE_NOT_FOUND = "Faixa etária não encontrada."


class AgeRangeService:
    def __init__(self, age_ranges: AgeRangeRepository, galaxies: GalaxyRepository) -> None:
        self._age_ranges = age_ranges
        self._galaxies = galaxies

    def list_age_ranges(self) -> list[dict[str, Any]]:
        return [age_range.to_dict() for age_range in self._age_ranges.list_all()]

    def get_age_range(self, ref: str) -> dict[str, Any]:
        age_range = require_by_ref(self._age_ranges, ref, AGE_RANGE_NOT_FOUND)
        galaxies = self._galaxies.list_by_age_range(age_range.id)
        return {**age_range.to_dict(), "galaxies": [galaxy.to_dict() for galaxy in galaxies]}
