from app.controllers.responses import json_body, ok
from app.services.gamification_service import GamificationService


class GamificationController:
    def __init__(self, service: GamificationService) -> None:
        self._service = service

    def list_progress(self):
        return ok(self._service.list_progress())

    def update_progress(self, planet_id: str):
        return ok(self._service.update_progress(planet_id, json_body()))

    def list_scores(self):
        return ok(self._service.list_scores())

    def submit_score(self):
        return ok(self._service.submit_score(json_body()), 201)

    def list_achievements(self):
        return ok(self._service.list_achievements())

    def list_my_achievements(self):
        return ok(self._service.list_my_achievements())

    def galaxy_ranking(self, ref: str):
        return ok(self._service.get_galaxy_ranking(ref))

    def system_ranking(self, ref: str):
        return ok(self._service.get_system_ranking(ref))
