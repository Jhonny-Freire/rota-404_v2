from app.controllers.responses import ok
from app.services.health_service import HealthService


class HealthController:
    def __init__(self, service: HealthService) -> None:
        self._service = service

    def show(self):
        return ok(self._service.check())
