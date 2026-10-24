from typing import Any

from app.errors import NotImplementedFeatureError


class GamificationService:
    def list_progress(self) -> list[dict[str, Any]]:
        raise NotImplementedFeatureError()

    def update_progress(self, planet_id: str, payload: dict[str, Any] | None) -> dict[str, Any]:
        raise NotImplementedFeatureError()

    def list_scores(self) -> list[dict[str, Any]]:
        raise NotImplementedFeatureError()

    def submit_score(self, payload: dict[str, Any] | None) -> dict[str, Any]:
        raise NotImplementedFeatureError()

    def list_achievements(self) -> list[dict[str, Any]]:
        raise NotImplementedFeatureError()

    def list_my_achievements(self) -> list[dict[str, Any]]:
        raise NotImplementedFeatureError()

    def get_galaxy_ranking(self, ref: str) -> dict[str, Any]:
        raise NotImplementedFeatureError()

    def get_system_ranking(self, ref: str) -> dict[str, Any]:
        raise NotImplementedFeatureError()
