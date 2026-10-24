from app.controllers.responses import ok, optional_query_param
from app.services.planetary_system_service import PlanetarySystemService


class PlanetarySystemController:
    def __init__(self, service: PlanetarySystemService) -> None:
        self._service = service

    def index(self):
        return ok(self._service.list_systems(optional_query_param("galaxy")))

    def show(self, ref: str):
        return ok(self._service.get_system(ref))
