from app.controllers.responses import ok
from app.services.age_range_service import AgeRangeService


class AgeRangeController:
    def __init__(self, service: AgeRangeService) -> None:
        self._service = service

    def index(self):
        return ok(self._service.list_age_ranges())

    def show(self, ref: str):
        return ok(self._service.get_age_range(ref))
