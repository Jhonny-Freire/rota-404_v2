from typing import Any

from app.errors import NotImplementedFeatureError


class UserService:
    def get_current_user(self) -> dict[str, Any]:
        raise NotImplementedFeatureError()

    def create_user(self, payload: dict[str, Any] | None) -> dict[str, Any]:
        raise NotImplementedFeatureError()

    def update_current_user(self, payload: dict[str, Any] | None) -> dict[str, Any]:
        raise NotImplementedFeatureError()
