from app.controllers.responses import ok, optional_query_param
from app.services.galaxy_service import GalaxyService


class GalaxyController:
    def __init__(self, service: GalaxyService) -> None:
        self._service = service

    def index(self):
        return ok(self._service.list_galaxies(optional_query_param("age_range")))

    def show(self, ref: str):
        return ok(self._service.get_galaxy(ref))
