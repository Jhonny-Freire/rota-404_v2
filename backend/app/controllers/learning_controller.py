from app.controllers.responses import ok, optional_query_param
from app.services.learning_service import LearningService


class LearningController:
    def __init__(self, service: LearningService) -> None:
        self._service = service

    def list_lessons(self):
        return ok(self._service.list_lessons(optional_query_param("system")))

    def get_lesson(self, ref: str):
        return ok(self._service.get_lesson(ref))

    def list_labs(self):
        return ok(self._service.list_labs(optional_query_param("system")))

    def get_lab(self, ref: str):
        return ok(self._service.get_lab(ref))
