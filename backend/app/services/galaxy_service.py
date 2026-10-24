from typing import Any

from app.repositories.age_range_repository import AgeRangeRepository
from app.repositories.galaxy_repository import GalaxyRepository
from app.repositories.planet_repository import PlanetRepository
from app.repositories.planetary_system_repository import PlanetarySystemRepository
from app.services import require_by_ref
from app.services.age_range_service import AGE_RANGE_NOT_FOUND

GALAXY_NOT_FOUND = "Galáxia não encontrada."


class GalaxyService:
    def __init__(
        self,
        galaxies: GalaxyRepository,
        age_ranges: AgeRangeRepository,
        systems: PlanetarySystemRepository,
        planets: PlanetRepository,
    ) -> None:
        self._galaxies = galaxies
        self._age_ranges = age_ranges
        self._systems = systems
        self._planets = planets

    def list_galaxies(self, age_range_ref: str | None = None) -> list[dict[str, Any]]:
        if age_range_ref is None:
            min_ages = {age_range.id: age_range.min_age for age_range in self._age_ranges.list_all()}
            galaxies = sorted(
                self._galaxies.list_all(),
                key=lambda galaxy: (
                    min_ages.get(galaxy.age_range_id, float("inf")),
                    galaxy.order_index,
                    galaxy.name,
                ),
            )
        else:
            age_range = require_by_ref(self._age_ranges, age_range_ref, AGE_RANGE_NOT_FOUND)
            galaxies = self._galaxies.list_by_age_range(age_range.id)
        return [galaxy.to_dict() for galaxy in galaxies]

    def get_galaxy(self, ref: str) -> dict[str, Any]:
        galaxy = require_by_ref(self._galaxies, ref, GALAXY_NOT_FOUND)
        age_range = self._age_ranges.get_by_id(galaxy.age_range_id)
        systems = self._systems.list_by_galaxy(galaxy.id)
        planets_by_system: dict[str, list[dict[str, Any]]] = {system.id: [] for system in systems}
        if systems:
            for planet in self._planets.list_by_systems(planets_by_system):
                planets_by_system[planet.planetary_system_id].append(planet.to_dict())
        return {
            **galaxy.to_dict(),
            "age_range": age_range.to_dict() if age_range else None,
            "systems": [
                {**system.to_dict(), "planets": planets_by_system[system.id]} for system in systems
            ],
        }
