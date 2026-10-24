from app.controllers.responses import json_body, ok
from app.services.user_service import UserService


class UserController:
    def __init__(self, service: UserService) -> None:
        self._service = service

    def me(self):
        return ok(self._service.get_current_user())

    def create(self):
        return ok(self._service.create_user(json_body()), 201)

    def update_me(self):
        return ok(self._service.update_current_user(json_body()))
