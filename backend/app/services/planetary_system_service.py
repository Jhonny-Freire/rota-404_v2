from typing import Any

from app.repositories.galaxy_repository import GalaxyRepository
from app.repositories.planet_repository import PlanetRepository
from app.repositories.planetary_system_repository import PlanetarySystemRepository
from app.services import require_by_ref
from app.services.galaxy_service import GALAXY_NOT_FOUND

SYSTEM_NOT_FOUND = "Sistema planetário não encontrado."


class PlanetarySystemService:
    def __init__(
        self,
        systems: PlanetarySystemRepository,
        galaxies: GalaxyRepository,
        planets: PlanetRepository,
    ) -> None:
        self._systems = systems
        self._galaxies = galaxies
        self._planets = planets

    def list_systems(self, galaxy_ref: str | None = None) -> list[dict[str, Any]]:
        if galaxy_ref is None:
            systems = self._systems.list_all()
        else:
            galaxy = require_by_ref(self._galaxies, galaxy_ref, GALAXY_NOT_FOUND)
            systems = self._systems.list_by_galaxy(galaxy.id)
        return [system.to_dict() for system in systems]

    def get_system(self, ref: str) -> dict[str, Any]:
        system = require_by_ref(self._systems, ref, SYSTEM_NOT_FOUND)
        galaxy = self._galaxies.get_by_id(system.galaxy_id)
        planets = self._planets.list_by_system(system.id)
        return {
            **system.to_dict(),
            "galaxy": galaxy.to_dict() if galaxy else None,
            "planets": [planet.to_dict() for planet in planets],
        }
